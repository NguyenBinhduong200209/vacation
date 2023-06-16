import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Vacations from '#root/model/vacations';
import pipelineLookup from '#root/config/pipelineLookup';
import checkForbidden from '#root/utils/checkForbidden';
import checkAuthor from '#root/utils/checkAuthor';
import mongoose from 'mongoose';

const vacationController = {
  getMany: asyncWrapper(async (req, res) => {
    const { page } = req.query,
      validPage = page && page > 0 ? Number(page) : 1,
      itemOfPage = Number(process.env.ITEM_OF_PAGE),
      foundUser = req.userInfo;

    const result = await Vacations.aggregate([
      //Filter only return vacation has shareStatus is public or vacation has shareStatus is protected and has shared to user
      {
        $match: { $or: [{ shareStatus: 'public' }, { shareStatus: 'protected', shareList: { $in: [foundUser._id] } }] },
      },

      { $project: { shareList: 0, createdAt: 0, lastUpdateAt: 0 } },

      //Sort in order to push the newest updated vacation to top
      { $sort: { lastUpdateAt: -1, createdAt: -1 } },

      //Add field total to calculate length of result of prev pipeline
      { $setWindowFields: { output: { total: { $count: {} } } } },

      //Add 2 new fields with field page is current page user wanna get, and field pages is total pages divided by length of array and itemOfPage
      { $addFields: { page: validPage, pages: { $ceil: { $divide: ['$total', itemOfPage] } } } },

      //Remove some firstN element in array if page > 1 and get quantity of element equal to itemOfPage
      { $skip: (validPage - 1) * itemOfPage },
      { $limit: itemOfPage },

      //Get username of author by lookup to users model by userId
      ...pipelineLookup.getUserInfo,

      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'vacationId',
          pipeline: [
            ...pipelineLookup.countLikesAndComments({ level: 2 }),

            //Only get field views, totalLikes, totalComments
            {
              $group: {
                _id: '$vacationId',
                likes: { $sum: '$totalLikes' },
                comments: { $sum: '$totalComments' },
              },
            },
            { $unset: '_id' },
          ],
          as: 'posts',
        },
      },
      { $unwind: '$posts' },
      { $addFields: { likes: '$posts.likes', comments: '$posts.comments' } },

      //Set up new array with total field is length of array and list field is array without __v field
      {
        $facet: {
          meta: [
            {
              $group: {
                _id: '$total',
                total: { $first: '$total' },
                page: { $first: '$page' },
                pages: { $first: '$pages' },
              },
            },
            { $project: { _id: 0 } },
          ],
          data: [{ $project: { total: 0, page: 0, pages: 0, userId: 0, __v: 0, posts: 0 } }],
        },
      },

      // Destructuring field
      { $unwind: '$meta' },
    ]);

    return res.status(200).json(result[0]);
  }),

  getOne: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const userId = req.userInfo._id.toString();

    //Throw an error if user login is not in shareList
    const foundVacation = await checkForbidden(userId, id);

    // Increase view of post by 1
    foundVacation.views += 1;
    await foundVacation.save();

    const result = await Vacations.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          pipeline: [{ $project: { username: 1, avatar: 1 } }],
          as: 'userInfo',
        },
      },
      { $project: { userId: 0, __v: 0 } },
      { $unwind: '$userInfo' },
    ]);

    //Send to front
    return res.status(200).json({ data: result[0], message: 'get detail successfully' });
  }),

  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { title, description, memberList, shareStatus, shareList, startingTime, endingTime } = req.body;
    //Get userId from verifyJWT middleware
    const userId = req.userInfo._id.toString();

    //if memberList receive is not an array, then return memberlist contain only userId, otherwises, combine memberList and userId
    const newMemberList = Array.isArray(memberList) ? [...new Set([...memberList, userId])] : [userId];

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
    });

    //Send to front
    return res.status(201).json({ data: newVacation, message: 'vacation created' });
  }),

  update: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Check whether user login is author of this vacation, if user is not author, then throw an error Forbidden
    const foundVacation = await checkAuthor({ type: 'vacation', vacationId: id, userId: req.userInfo._id });

    //Save new info to foundVacation
    const { memberList, shareStatus, shareList } = req.body;
    const updateKeys = ['title', 'description', 'memberList', 'shareStatus', 'shareList', 'startingTime', 'endingTime'];
    updateKeys.forEach(key => {
      switch (key) {
        case 'memberList':
          //if memberList receive is not an array, then return memberlist contain only userId, otherwises, combine memberList and userId
          const newMemberList = Array.isArray(memberList) ? [...new Set([...memberList, userId])] : [userId];
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
    await checkAuthor({ type: 'vacation', vacationId: id, userId: req.userInfo._id });

    //Delete Vacation
    const deleteVacation = await Vacations.findByIdAndDelete(id);

    //Send to front
    return res.status(202).json({ data: deleteVacation, message: 'delete successfully' });
  }),
};

export default vacationController;
