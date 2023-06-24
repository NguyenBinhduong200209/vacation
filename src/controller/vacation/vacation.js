import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Vacations from '#root/model/vacation/vacations';
import Posts from '#root/model/vacation/posts';
import { addTotalPageFields, getUserInfo, getCountInfo, facet } from '#root/config/pipeline';
import checkPermission from '#root/utils/checkForbidden/checkPermission';
import checkAuthor from '#root/utils/checkForbidden/checkAuthor';
import mongoose from 'mongoose';
import Likes from '#root/model/interaction/likes';
import Comments from '#root/model/interaction/comments';
import Views from '#root/model/interaction/views';
import viewController from '#root/controller/interaction/views';

const vacationController = {
  getMany: asyncWrapper(async (req, res) => {
    const { type, page } = req.query;
    const userId = req.userInfo._id;

    //Throw an error if type query is not newFeed or userProfile
    !['newFeed', 'userProfile'].includes(type) &&
      _throw({
        code: 400,
        errors: [{ field: 'type', message: 'type query can only be newFeed or userProfile' }],
        message: 'invalid type query',
      });

    const result = await Vacations.aggregate(
      [].concat(
        //Filter only return vacation has shareStatus is public or vacation has shareStatus is protected and has shared to user
        {
          $match: {
            $or: [
              type === 'newFeed' ? { shareStatus: 'public' } : { shareStatus: 'public', memberList: { $in: [userId] } },
              { shareStatus: 'protected', shareList: { $in: [userId] } },
              { shareStatus: 'onlyme', userId: userId },
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
            pipeline: getCountInfo({ field: ['like', 'comment'] }),
            as: 'posts',
          },
        },

        getCountInfo({ field: ['view'] }),

        //Replace field post with total posts, add new field likes and comments with value is total
        {
          $addFields: {
            likes: { $sum: '$posts.likes' },
            comments: { $sum: '$posts.comments' },
            posts: { $size: '$posts' },
          },
        },

        //Get username of author by lookup to users model by userId
        getUserInfo({ field: ['username', 'avatar'] }),

        //Set up new array with total field is length of array and list field is array without __v field
        facet({
          meta: ['total', 'page', 'pages'],
          data: [
            type === 'newFeed' && 'authorInfo',
            'title',
            'cover',
            'shareStatus',
            'posts',
            'views',
            'likes',
            'comments',
            'startingTime',
            'endingTime',
          ],
        })
      )
    );

    return res.status(200).json(result[0]);
  }),

  getOne: asyncWrapper(async (req, res) => {
    const { id } = req.params,
      userId = req.userInfo._id;

    //Throw an error if user login is not in shareList
    await checkPermission({ crUserId: userId, modelType: 'vacation', modelId: id });

    // Increase view of post by 1
    await viewController.update({ modelType: 'vacation', modelId: id, userId: userId });

    const result = await Vacations.aggregate(
      [].concat(
        //Filter based on id
        { $match: { _id: new mongoose.Types.ObjectId(id) } },

        //Get userInfo by looking up to model
        getUserInfo({ field: ['username', 'avatar'], getFriendList: true }),

        //Get field count total views of vacation
        getCountInfo({ field: ['view'] }),

        //Get specific fields
        { $project: { userId: 0 } }
      )
    );

    //Send to front
    return res.status(200).json({ data: result[0], message: 'get detail successfully' });
  }),

  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { title, description, memberList, shareStatus, shareList, startingTime, endingTime, cover } = req.body;
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

    //Find Posts in Vacation
    const foundPosts = await Posts.find({ vacationId: id });

    //Define promises for deleting post
    const deletePostPromise = foundPosts.reduce((arr, post) => {
      const postId = post._id;
      //Define deletePost method
      const deletePost = Posts.findByIdAndDelete(postId);

      //Define deleteLikes method
      const deleteLikes = Likes.deleteMany({
        $or: [
          { modelType: 'post', modelId: postId },
          { modelType: 'vacation', modelId: id },
        ],
      });

      //Define deleteComments method
      const deleteComments = Comments.deleteMany({
        $or: [
          { modelType: 'post', modelId: postId },
          { modelType: 'vacation', modelId: id },
        ],
      });

      //Define deleteViews method
      const deleteViews = Views.deleteMany({ modelType: 'vacation', modelId: id });
      arr.push(deletePost, deleteLikes, deleteComments, deleteViews);
      return arr;
    }, []);

    //Delete Vacation and posts
    await Promise.all(deletePostPromise.concat(Vacations.findByIdAndDelete(id)));

    //Send to front
    return res.status(202).json({ message: 'delete successfully' });
  }),
};

export default vacationController;
