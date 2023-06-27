import Notifications from '#root/model/interaction/notification';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Users from '#root/model/user/users';
import { addTotalPageFields, facet } from '#root/config/pipeline';
import mongoose from 'mongoose';
import Posts from '#root/model/vacation/posts';
import Vacations from '#root/model/vacation/vacations';

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

        //Restructure the docs
        facet({ meta: ['total', 'page', 'pages'], data: ['content', 'lastUpdateAt', 'isSeen', 'modelType', 'modelId'] })
      )
    );

    //Send to front
    return foundList.length === 0 ? res.sendStatus(204) : res.status(200).json(foundList[0]);
  }),

  updateContent: asyncWrapper(async (req, res) => {
    const { modelType, modelId, receiverId, action } = req.noti;

    //Do not create new Noti if author like his/her own modelType
    const senderId = req.userInfo._id;
    if (receiverId.toString() !== senderId.toString()) {
      //Get username of user start action in modelType
      const username = req.userInfo.username;

      //Find Notification that has modelType, modelId, userId and has not been seen by user
      const foundNoti = await Notifications.findOne({ modelType, modelId, userId: receiverId, action, isSeen: false });

      //If Noti found
      if (foundNoti) {
        //Update content based on modelType
        switch (modelType) {
          case 'post':
            //Find title of vacation containing this post
            const { vacationId } = await Posts.findById(modelId);
            const vacationTitle = (await Vacations.findById(vacationId))?.title;
            foundNoti.content = `${username} and others ${action} your ${modelType} in vacation ${vacationTitle}`;
            break;

          case 'friend':
            foundNoti.content = `${username} and others ${action}`;
            break;

          default:
            //Throw an error if model is undefined
            const model = modelType === 'vacation' ? 'Vacations' : modelType === 'album' ? 'Albums' : undefined;
            !model && _throw({ code: 400, message: 'invalid modelType' });

            //Find title
            const { title } = await mongoose.model(model).findById(modelId);
            foundNoti.content = `${username} and others ${action} your ${modelType} ${title}`;
            break;
        }
        foundNoti.isSeen = false;
        await foundNoti.save();
      }

      //If Noti not found
      else {
        //Update content based on modelType
        let content;
        switch (modelType) {
          case 'post':
            //Find title of vacation containing this post
            const { vacationId } = await Posts.findById(modelId);
            const vacationTitle = (await Vacations.findById(vacationId))?.title;
            content = `${username} ${action} your post in vacation ${vacationTitle}`;
            break;

          case 'friend':
            content = `${username} ${action}`;
            break;

          default:
            //Throw an error if model is undefined
            const model = modelType === 'vacation' ? 'Vacations' : modelType === 'album' ? 'Albums' : undefined;
            !model && _throw({ code: 400, message: 'invalid modelType' });
            //Get title of vacation or album
            const { title } = await mongoose.model(model).findById(modelId);
            content = `${username} ${action} your ${modelType} ${title}`;
            break;
        }

        //Create new Notification
        await Notifications.create({
          modelType,
          modelId,
          action,
          userId: receiverId,
          content: content,
          createAt: new Date(),
        });
      }
    }

    //Send to front
    const { code, data, message } = res.result;
    return res.status(code).json({ data, message });
  }),

  updateStatusAll: asyncWrapper(async (req, res) => {
    const userId = req.userInfo._id;

    const foundNotiList = await Notifications.updateMany({ userId }, { isSeen: true });

    //Send to front
    return foundNotiList.length == 0
      ? res.sendStatus(204)
      : res.status(200).json({ meta: { total: foundNotiList.length }, message: 'update status of all post successfully' });
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
