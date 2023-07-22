import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';
import { getResourcePath, getCountInfo, checkFriend } from '#root/config/pipeline';

const usersinforController = {
  getprofile: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const userId = new mongoose.Types.ObjectId(!id ? req.userInfo._id : id);
    const requestUserId = new mongoose.Types.ObjectId(req.userInfo._id);

    const result = await Users.aggregate(
      [].concat(
        { $match: { _id: userId } },
        getResourcePath({ localField: '_id', as: 'avatar' }),
        getCountInfo({ field: ['post', 'vacation', 'friend'], countLikePost: true }),
        id
          ? {
              $lookup: {
                from: 'friends',
                pipeline: [
                  {
                    $match: {
                      $or: [
                        { userId1: userId, userId2: requestUserId },
                        { userId2: userId, userId1: requestUserId },
                      ],
                    },
                  },
                ],
                as: 'friendStatus',
              },
            }
          : [],
        {
          $project: {
            firstname: 1,
            lastname: 1,
            username: 1,
            description: 1,
            avatar: 1,
            posts: 1,
            vacations: 1,
            friends: 1,
            likesPost: 1,
            friendStatus: { $first: '$friendStatus.status' },
          },
        }
      )
    );

    return result.length === 0
      ? res.sendStatus(204)
      : res.status(200).json({ data: result[0], message: 'get successfully' });
  }),
};
export default usersinforController;
