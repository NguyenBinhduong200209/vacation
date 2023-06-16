import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Posts from '#root/model/posts';
import checkForbidden from '#root/utils/checkForbidden';
import checkAuthor from '#root/utils/checkAuthor';
import pipelineLookup from '#root/config/pipelineLookup';
import mongoose from 'mongoose';

const postController = {
  getMany: asyncWrapper(async (req, res) => {
    const { vacationId, page } = req.query,
      validPage = page && page > 0 ? Number(page) : 1,
      itemOfPage = Number(process.env.ITEM_OF_PAGE),
      foundUserId = req.userInfo._id;

    //Throw an error if user have no permission to see any post of vacation
    await checkForbidden(foundUserId, vacationId);

    const result = await Posts.aggregate([
      //Get all posts belong to vacationId
      { $match: { vacationId: new mongoose.Types.ObjectId(vacationId) } },

      //Sort in order to push the newest updated post to top
      { $sort: { lastUpdateAt: -1, createdAt: -1 } },

      //Add field total to calculate length of result of prev pipeline
      { $setWindowFields: { output: { total: { $count: {} } } } },

      //Add 2 new fields with field page is current page user wanna get, and field pages is total pages divided by length of array and itemOfPage
      { $addFields: { page: validPage, pages: { $ceil: { $divide: ['$total', itemOfPage] } } } },

      //Remove some firstN element in array if page > 1 and get quantity of element equal to itemOfPage
      { $skip: (validPage - 1) * itemOfPage },
      { $limit: itemOfPage },

      //Get username, location by looking up to other model
      ...pipelineLookup.getUserInfo({ field: ['username', 'avatar'] }),
      ...pipelineLookup.location,
      ...pipelineLookup.countLikesAndComments({ level: 1 }),

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
          data: [{ $project: { userId: 0, vacationId: 0, locationId: 0, total: 0, page: 0, pages: 0 } }],
        },
      },

      // Destructuring field
      { $unwind: '$meta' },
    ]);

    return res.status(200).json(result);
  }),

  getOne: asyncWrapper(async (req, res) => {
    const { id } = req.params,
      foundUserId = req.userInfo._id;

    //Get vacationId based on postId and check forbidden of userId login and vacation contain post
    const foundPost = await Posts.findById(id);
    !foundPost &&
      _throw({ code: 400, errors: [{ field: 'id', message: 'invalid' }], message: 'post not found' });

    await checkForbidden(foundUserId, foundPost.vacationId);

    const result = await Posts.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      //Get username, location by looking up to other model
      ...pipelineLookup.getUserInfo({ field: ['username', 'avatar'] }),
      ...pipelineLookup.location,

      //Get detail likeInfo by looking up to likes model
      {
        $lookup: {
          from: 'likes',
          pipeline: [
            { $project: { userId: 1 } },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [{ $project: { username: 1, _id: 0 } }],
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            { $addFields: { username: '$userInfo.username' } },
            { $unset: 'userInfo' },
          ],
          localField: '_id',
          foreignField: 'parentId',
          as: 'likesInfo',
        },
      },

      //Get detail commentInfo by looking up to comment model
      {
        $lookup: {
          from: 'comments',
          pipeline: [
            { $project: { postId: 0, __v: 0 } },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [{ $project: { username: 1, _id: 0 } }],
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            { $addFields: { username: '$userInfo.username' } },
            { $project: { userInfo: 0, parentId: 0 } },
          ],
          localField: '_id',
          foreignField: 'parentId',
          as: 'commentsInfo',
        },
      },
      { $project: { vacationId: 0, userId: 0, locationId: 0, __v: 0 } },
    ]);

    //Send to front
    return res.status(200).json({ data: result[0], message: 'get detail post successully' });
  }),

  addNew: asyncWrapper(async (req, res) => {
    //Get infor from req.body
    const { vacationId, locationId, content, resource } = req.body;

    //Get userInfo from verifyJWT middleware
    const foundUser = req.userInfo;

    //Create new post and save it to database
    const newPost = await Posts.create({
      vacationId,
      locationId,
      userId: foundUser._id,
      content,
      resource,
      createdAt: new Date(),
    });

    //Send to front
    return res.status(201).json({ data: newPost, message: 'post created successfully' });
  }),

  update: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Throw an error if user login is not author of this post
    const foundPost = await checkAuthor({ type: 'post', postId: id, userId: req.userInfo._id });

    //Config updatable key and update based on req.body value
    const updateKeys = ['vacationId', 'locationId', 'content', 'resource'];
    updateKeys.forEach(key => {
      foundPost[key] = req.body[key];
    });

    //Save new value for key lastUpdateAt
    foundPost.lastUpdateAt = new Date();
    await foundPost.save();

    //Send to front
    return res.status(201).json({ data: foundPost, message: 'update post successfully' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Throw an error if user login is not author of this post
    await checkAuthor({ type: 'post', postId: id, userId: req.userInfo._id });

    //Find and delete post match id parse in params
    const deletePost = await Posts.findByIdAndDelete(id);

    //Send to front
    return res.status(202).json({ data: deletePost, message: 'delete post successfully' });
  }),
};

export default postController;
