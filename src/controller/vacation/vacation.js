import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Vacations from '#root/model/vacation/vacations';
import { addTotalPageFields, getUserInfo, countLikesAndComments, facet } from '#root/config/pipeline';
import checkForbidden from '#root/utils/checkForbidden';
import checkAuthor from '#root/utils/checkAuthor';
import mongoose from 'mongoose';

const getVacationList = async ({ where, field, page, foundUserId }) => {
  const result = await Vacations.aggregate(
    [].concat(
      //Filter only return vacation has shareStatus is public or vacation has shareStatus is protected and has shared to user
      {
        $match: {
          $or: [
            where === 'newFeed'
              ? { shareStatus: 'public' }
              : { shareStatus: 'public', memberList: { $in: [foundUserId] } },
            { shareStatus: 'protected', shareList: { $in: [foundUserId] } },
            { shareStatus: 'onlyme', userId: foundUserId },
          ],
        },
      },

      //Sort in order to push the newest updated vacation to top
      { $sort: { lastUpdateAt: -1, createdAt: -1 } },

      //Add field total, page and pages fields
      addTotalPageFields({ page }),

      //Get total Likes and Comment by lookup to posts model
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'vacationId',
          pipeline: countLikesAndComments({ modelType: 'post' }).concat([
            {
              $group: {
                _id: '$vacationId',
                likes: { $sum: '$totalLikes' },
                comments: { $sum: '$totalComments' },
              },
            },
            { $unset: '_id' },
          ]),

          as: 'posts',
        },
      },
      { $unwind: '$posts' },
      { $addFields: { likes: '$posts.likes', comments: '$posts.comments' } },

      //Get username of author by lookup to users model by userId
      getUserInfo({ field: ['username', 'avatar'] }),

      //Set up new array with total field is length of array and list field is array without __v field
      facet({ meta: ['total', 'page', 'pages'], data: field }),

      // Destructuring field
      { $unwind: '$meta' }
    )
  );
  return result[0];
};

const vacationController = {
  getMany: asyncWrapper(async (req, res) => {
    const { type, page } = req.query;

    //Throw an error if type query is not newFeed or userProfile
    !['newFeed', 'userProfile'].includes(type) &&
      _throw({
        code: 400,
        errors: [{ field: 'type', message: 'type query can only be newFeed or userProfile' }],
        message: 'invalid type query',
      });

    const result = await getVacationList({
      where: type,
      field: [
        type === 'newFeed' && 'authorInfo',
        'title',
        'cover',
        'shareStatus',
        'views',
        'likes',
        'comments',
        'startingTime',
        'endingTime',
      ],
      page: page,
      foundUserId: req.userInfo._id,
    });

    return res.status(200).json(result);
  }),

  getOne: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Throw an error if user login is not in shareList
    const foundVacation = await checkForbidden({
      crUserId: req.userInfo._id,
      modelType: 'vacation',
      modelId: id,
    });

    // Increase view of post by 1
    foundVacation.views += 1;
    await foundVacation.save();

    const result = await Vacations.aggregate(
      //Filter based on id
      [{ $match: { _id: new mongoose.Types.ObjectId(id) } }].concat(
        //Get userInfo by looking up to model
        getUserInfo({ field: ['username', 'avatar'] }),

        //Get specific fields
        [{ $project: { userId: 0 } }]
      )
    );

    //Send to front
    return res.status(200).json({ data: result[0], message: 'get detail successfully' });
  }),

  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { title, description, memberList, shareStatus, shareList, startingTime, endingTime, cover } =
      req.body;
    //Get userId from verifyJWT middleware
    const userId = req.userInfo._id.toString();

    //if memberList receive is not an array, then return memberlist contain only userId, otherwises, combine memberList and userId
    const newMemberList = Array.isArray(memberList) ? [...new Set(memberList.concat(userId))] : [userId];

    //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
    const newShareList =
      shareStatus === 'protected'
        ? Array.isArray(shareList)
          ? [...new Set(newMemberList.concat(shareList))]
          : newMemberList
        : null;

    //Create new Vacation and run validation when creating
    const newVacation = await Vacations.create({
      title,
      description,
      memberList: newMemberList,
      shareStatus,
      shareList: newShareList,
      startingTime,
      endingTime,
      userId,
      cover,
    });

    //Send to front
    return res.status(201).json({ data: newVacation, message: 'vacation created' });
  }),

  update: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Check whether user login is author of this vacation, if user is not author, then throw an error Forbidden
    const foundVacation = await checkAuthor({ modelType: 'vacation', modelId: id, userId: req.userInfo._id });

    //Save new info to foundVacation
    const { memberList, shareStatus, shareList } = req.body;
    const updateKeys = [
      'title',
      'description',
      'memberList',
      'shareStatus',
      'shareList',
      'startingTime',
      'endingTime',
      'cover',
    ];
    updateKeys.forEach(key => {
      switch (key) {
        case 'memberList':
          //if memberList receive is not an array, then return memberlist contain only userId, otherwises, combine memberList and userId
          const newMemberList = Array.isArray(memberList)
            ? [...new Set(memberList.concat(req.userInfo._id))]
            : [req.userInfo._id];
          foundVacation.memberList = newMemberList;
          break;

        case 'shareList':
          //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
          const newShareList =
            shareStatus === 'protected'
              ? Array.isArray(shareList)
                ? [...new Set(newMemberList.concat(shareList))]
                : newMemberList
              : null;
          foundVacation.shareList = newShareList;
          break;

        case 'endingTime':
          //If endingTime < startingTime, then throw an error
          req.body.endingTime < req.body.startingTime &&
            _throw({
              code: 400,
              errors: [{ fields: 'endingTime', message: 'endingTime must be after startingTime' }],
              message: 'invalid endingTime',
            });
          break;

        default:
          foundVacation[key] = req.body[key];
          break;
      }
    });

    //Save to databse
    await foundVacation.save();

    //Send to front
    return res.status(201).json({ data: foundVacation, meta: '', message: 'update successfully' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Check whether user login is author of this vacation, if user is not author, then throw an error Forbidden
    await checkAuthor({ modelType: 'vacation', modelId: id, userId: req.userInfo._id });

    //Delete Vacation
    const deleteVacation = await Vacations.findByIdAndDelete(id);

    //Send to front
    return res.status(202).json({ data: deleteVacation, message: 'delete successfully' });
  }),
};

export default vacationController;
