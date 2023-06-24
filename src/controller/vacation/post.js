import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Posts from '#root/model/vacation/posts';
import checkPermission from '#root/utils/checkForbidden/checkPermission';
import checkAuthor from '#root/utils/checkForbidden/checkAuthor';
import { addTotalPageFields, getUserInfo, getCountInfo, getLocation, facet } from '#root/config/pipeline';
import mongoose from 'mongoose';

const postController = {
  getMany: asyncWrapper(async (req, res) => {
    const { type, id, page } = req.query,
      isVacation = type === 'vacation',
      userId = req.userInfo._id;

    //Throw an error if type is not vacation and location
    !['vacation', 'location'].includes(type) &&
      _throw({
        code: 400,
        errors: [{ field: 'type', message: 'type can only be vacation or location' }],
        message: 'invalid type',
      });

    //Throw an error if user have no permission to see any post of vacation
    isVacation && (await checkPermission({ crUserId: userId, modelType: 'vacation', modelId: id }));

    const result = await Posts.aggregate(
      [].concat(
        //Get all posts belong to vacationId
        isVacation
          ? { $match: { vacationId: new mongoose.Types.ObjectId(id) } }
          : [
              {
                $lookup: {
                  from: 'vacations',
                  localField: 'vacationId',
                  foreignField: '_id',
                  pipeline: [{ $project: { shareStatus: 1, shareList: 1, userId: 1, _id: 0 } }],
                  as: 'vacation',
                },
              },
              { $unwind: '$vacation' },
              {
                $match: {
                  locationId: new mongoose.Types.ObjectId(id),
                  $or: [
                    { 'vacation.shareStatus': 'public' },
                    { 'vacation.shareStatus': 'protected', 'vacation.shareList': { $in: [userId] } },
                    { 'vacation.shareStatus': 'onlyme', 'vacation.userId': userId },
                  ],
                },
              },
            ],

        //Sort in order to push the newest updated post to top
        { $sort: { lastUpdateAt: -1, createdAt: -1 } },

        //Add 3 new fields (total, page, pages) and then Get username, location by looking up to other model
        addTotalPageFields({ page }),
        getUserInfo({ field: ['username', 'avatar'] }),
        getCountInfo({ field: ['like', 'comment'] }),
        isVacation ? getLocation({ localField: 'locationId' }) : [],

        //Set up new array with total field is length of array and list field is array without __v field
        facet({
          meta: ['total', 'page', 'pages'],
          data: ['content', 'lastUpdateAt', 'resource', 'location', 'createdAt', 'authorInfo', 'likes', 'comments'],
        })
      )
    );

    return res.status(200).json(result[0]);
  }),

  getOne: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Get vacationId based on postId and check forbidden of userId login and vacation contain post
    const foundPost = await Posts.findById(id);
    !foundPost && _throw({ code: 404, errors: [{ field: 'id', message: 'invalid' }], message: 'post not found' });

    //Check the authorization of user to post
    await checkPermission({ crUserId: req.userInfo._id, modelType: 'vacation', modelId: foundPost.vacationId });

    const result = await Posts.aggregate(
      //Filter based on id
      [{ $match: { _id: new mongoose.Types.ObjectId(id) } }].concat(
        //Get username, location by looking up to other model
        getUserInfo({ field: ['username', 'avatar'] }),
        getLocation({ localField: 'locationId' }),

        //Remove unnecessary fields
        [{ $project: { vacationId: 0, userId: 0, locationId: 0, __v: 0 } }]
      )
    );

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
    const foundPost = await checkAuthor({ modelType: 'post', modelId: id, userId: req.userInfo._id });

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
    await checkAuthor({ modelType: 'post', modelId: id, userId: req.userInfo._id });

    //Define deletePost method
    const deletePost = Posts.findByIdAndDelete(id);

    //Define deleteLikes method
    const deleteLikes = Likes.deleteMany({ modelType: 'post', modelId: id });

    //Define deleteComments method
    const deleteComments = Comments.deleteMany({ modelType: 'post', modelId: id });

    //Run all methods at once
    await Promise.all([deletePost, deleteLikes, deleteComments]);

    //Send to front
    return res.status(202).json({ message: 'delete post successfully' });
  }),
};

export default postController;
