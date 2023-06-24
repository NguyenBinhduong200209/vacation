import Notifications from '#root/model/interaction/notification';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Users from '#root/model/user/users';
import { addTotalPageFields } from '#root/config/pipeline';
import checkAuthor from '#root/utils/checkForbidden/checkAuthor';
import mongoose from 'mongoose';

const notiController = {
  getMany: asyncWrapper(async (req, res) => {
    const { page } = req.query;
    //Get userId from verify JWT middelware
    const userId = req.userInfo._id;

    //Find noti list based on userId
    const foundList = await Notifications.aggregate(
      [].concat({ $match: { userid: new mongoose.Types.ObjectId(userId) } }, addTotalPageFields({ page }))
    );

    //Throw an error if error occurs during finding
    !foundList &&
      _throw({ code: 400, errors: [{ field: 'accessToken', message: 'invalid' }], message: 'invalid accessToken' });

    //Send to front
    return foundList.length === 0
      ? res.sendStatus(204)
      : res.status(200).json({ data: foundList, message: 'get noti successfully' });
  }),

  updateContent: async ({ modelType, modelId, action, authorId, userId }) => {
    //Get username of user has like the modelType
    const username = (await Users.findById(userId)).username;

    //Find Notification that has modelType, modelId, userId and has not been seen by user
    const foundNoti = await Notifications.findOne({ modelType, modelId, userId: authorId, action, isSeen: false });

    //If found Noti, then update it by showing username has actioned recently to modelType of author
    if (foundNoti) {
      foundNoti.content = `${username} and others ${action} your ${modelType}`;
      foundNoti.isSeen = false;
      await foundNoti.save();
      return foundNoti;
    }
    //If Noti cannot be found, then create new Notification and show username has actioned recently
    else
      return await Notifications.create({
        modelType,
        modelId,
        action,
        userId: authorId,
        content: `${username} ${action} your ${modelType}`,
        createAt: new Date(),
      });
  },

  updateStatus: asyncWrapper(async (req, res) => {
    const { type, id } = req.params;
    const userId = req.userInfo._id;

    switch (type) {
      case 'one':
        //Throw error if cannot find notification, or user is not author of this noti
        const foundNoti = await checkAuthor({ modelType: 'notification', modelId: id, userId });

        //Change seen Status to true and save to DB
        foundNoti.isSeen = true;
        await foundNoti.save();

        //Send to front
        return res.status(200).json({ data: foundNoti, message: 'update status of one post successfully' });

      case 'all':
        const foundNotiList = await Notifications.updateMany({ userId }, { isSeen: true });

        //Send to front
        return foundNotiList.length == 0
          ? res.sendStatus(204)
          : res
              .status(200)
              .json({ meta: { total: foundNotiList.length }, message: 'update status of all post successfully' });

      //Throw an error if type is not one or all
      default:
        _throw({ code: 400, errors: [{ field: 'type', message: 'type must be one or many' }], message: 'invalid type' });
        break;
    }
  }),
};

export default notiController;
