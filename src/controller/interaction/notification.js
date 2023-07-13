import Notifications from '#root/model/interaction/notification';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import { addTotalPageFields, facet, getUserInfo } from '#root/config/pipeline';
import mongoose from 'mongoose';

const notiController = {
  getMany: asyncWrapper(async (req, res) => {
    const { page, type } = req.query;
    //Get userId from verify JWT middelware
    const userId = req.userInfo._id;

    //Find noti list based on userId
    const foundList = await Notifications.aggregate(
      [].concat(
        //Filter to get all noti that belong to userLogin by searching by userId
        {
          $match: Object.assign({ userId: new mongoose.Types.ObjectId(userId) }, type === 'unread' ? { isSeen: false } : {}),
        },

        //Sort fron the newest to the oldest
        { $sort: { lastUpdateAt: -1, createdAt: -1 } },

        //Add 3 fields total, page and pages to docs
        addTotalPageFields({ page }),
        getUserInfo({ localField: 'userActionId', as: 'userInfo', field: ['username', 'avatar'] }),

        //Lookup to get content of post and vacation
        {
          $lookup: {
            from: 'posts',
            localField: 'modelId',
            foreignField: '_id',
            pipeline: [{ $project: { content: 1 } }],
            as: 'modelInfo',
          },
        },
        { $unwind: '$modelInfo' },
        { $addFields: { 'modelInfo.type': '$modelType' } },

        // Restructure the docs
        facet({
          meta: ['total', 'page', 'pages'],
          data: ['lastUpdateAt', 'isSeen', 'userInfo', '__v', 'action', 'modelInfo'],
        })
      )
    );

    //Send to front
    return foundList.length === 0 ? res.sendStatus(204) : res.status(200).json(foundList[0]);
  }),

  updateContent: async ({ document, action }) => {
    let { modelType, modelId, userId, receiverId, senderId } = document;

    const foundDocument = await mongoose.model(modelType).findById(modelId);

    !foundDocument &&
      _throw({
        code: 500,
        errors: [{ field: 'notification', message: 'error while creating' }],
        message: 'error while creating notification',
      });

    //Reassign when action is not add friend
    receiverId ||= foundDocument.userId;
    senderId ||= userId;

    //Do not create new Noti if author like his/her own modelType
    if (receiverId.toString() !== senderId.toString()) {
      //Find Notification that has modelType, modelId, userId and has not been seen by user
      const foundNoti = await Notifications.findOne({ modelType, modelId, userId: receiverId, action, isSeen: false });

      //If Noti found
      if (foundNoti) {
        //Update found Notification and save to DB
        foundNoti.userActionId = senderId;
        foundNoti.isSeen = false;
        await foundNoti.save();

        return foundNoti;
      }

      //If Noti not found, create new Notification
      else
        return await Notifications.create({
          modelType,
          modelId,
          action,
          userId: receiverId,
          userActionId: senderId,
          createAt: new Date(),
          lastUpdateAt: new Date(),
        });
    }
  },

  updateStatusAll: asyncWrapper(async (req, res) => {
    const userId = req.userInfo._id;

    const foundNotiList = await Notifications.updateMany({ userId }, { isSeen: true });

    //Send to front
    return res
      .status(200)
      .json({ meta: { total: foundNotiList.modifiedCount }, message: 'update status of all post successfully' });
  }),

  updateStatusOne: asyncWrapper(async (req, res) => {
    //Get document from previos middleware, Change seen Status to true and save to DB
    const foundNoti = req.doc;
    foundNoti.isSeen = true;
    await foundNoti.save();

    //Send to front
    return res.status(200).json({ data: foundNoti, message: 'update status of one post successfully' });
  }),

  delete: async () => {
    //Config expired date
    const expDate = new Date(Date.now() - process.env.MAX_RANGE_NOTI);

    //Delete all Notifications that have been seen or exceed expired date in all users
    const deleteNoti = await Notifications.deleteMany({ $or: [{ isSeen: true }, { lastUpdateAt: { $lte: expDate } }] });

    //Return result
    return deleteNoti;
  },
};

export default notiController;
