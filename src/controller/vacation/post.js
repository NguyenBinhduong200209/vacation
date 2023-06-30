import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Posts from '#root/model/vacation/posts';
import Vacations from '#root/model/vacation/vacations';
import { addTotalPageFields, getUserInfo, getCountInfo, getLocation, facet } from '#root/config/pipeline';
import mongoose from 'mongoose';

const postController = {
  getManyByVacation: asyncWrapper(async (req, res) => {
    const { id, page, prevPage, timeline } = req.query;

    //Get other data
    const result = await Posts.aggregate(
      [].concat(
        //Get all posts belong to vacationId
        { $match: { vacationId: new mongoose.Types.ObjectId(id) } },
        //Sort in order to push the newest updated post to top
        { $sort: { lastUpdateAt: -1, createdAt: -1 } },

        //Add 3 new fields (total, page, pages) and then Get username, location by looking up to other model
        addTotalPageFields({ page }),
        getUserInfo({ field: ['username', 'avatar'] }),
        getCountInfo({ field: ['like', 'comment'] }),
        getLocation({ localField: 'locationId' }),

        //Set up new array with total field is length of array and list field is array without __v field
        facet({
          meta: ['total', 'page', 'pages'],
          data: ['content', 'lastUpdateAt', 'resource', 'location', 'createdAt', 'authorInfo', 'likes', 'comments'],
        })
      )
    );

    //Get timeline
    if (result.length > 0) {
      const timeline = await Posts.find({ vacationId: id }).distinct('createdAt');
      result[0].meta.timeline = timeline;
      return res.status(200).json(result[0]);
    } else return res.sendStatus(204);
  }),

  getManyByLocation: asyncWrapper(async (req, res) => {
    const { id, page } = req.query,
      userId = req.userInfo._id;

    //Get other data
    const result = await Posts.aggregate(
      [].concat(
        //Get all posts belong to vacationId
        [
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

        //Set up new array with total field is length of array and list field is array without __v field
        facet({
          meta: ['total', 'page', 'pages'],
          data: ['content', 'lastUpdateAt', 'resource', 'location', 'createdAt', 'authorInfo', 'likes', 'comments'],
        })
      )
    );

    return result.length === 0 ? res.sendStatus(204) : res.status(200).json(result[0]);
  }),

  getOne: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const result = await Posts.aggregate(
      [].concat(
        //Filter based on id
        { $match: { _id: new mongoose.Types.ObjectId(id) } },

        //Get username, location by looking up to other model
        getUserInfo({ field: ['username', 'avatar'] }),
        getLocation({ localField: 'locationId' }),

        //Remove unnecessary fields
        { $project: { vacationId: 0, userId: 0, locationId: 0, __v: 0 } }
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

    //Update lastUpdateAt in vacation
    await Vacations.findByIdAndUpdate(vacationId, { lastUpdateAt: new Date() });

    //Send to front
    return res.status(201).json({ data: newPost, message: 'post created successfully' });
  }),

  update: asyncWrapper(async (req, res) => {
    //Get document from previous middleware
    const foundPost = req.doc;

    //Config updatable key and update based on req.body value
    const updateKeys = ['locationId', 'content'];
    updateKeys.forEach(key => {
      const val = req.body[key];
      val && (foundPost[key] = req.body[key]);
    });

    //Save new value for key lastUpdateAt
    foundPost.lastUpdateAt = new Date();
    await foundPost.save();

    //Send to front
    return res.status(201).json({ data: foundPost, message: 'update post successfully' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Define deletePost method
    const deletePost = Posts.findByIdAndDelete(id);

    //Define deleteLikes method
    const deleteLikes = Likes.deleteMany({ modelType: 'post', modelId: id });

    //Define deleteComments method
    const deleteComments = Comments.deleteMany({ modelType: 'post', modelId: id });

    //Run all methods at once
    await Promise.all([deletePost, deleteLikes, deleteComments]);

    //Send to front
    return res.status(200).json({ message: 'delete post successfully' });
  }),
};

export default postController;
