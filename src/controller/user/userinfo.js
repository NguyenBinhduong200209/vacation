import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';
import { getResourcePath, getCountInfo } from '#root/config/pipeline';

const usersinforController = {
  getprofile: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const userId = !id ? req.userInfo._id : id;

    const result = await Users.aggregate(
      [].concat(
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        getResourcePath({ localField: '_id', as: 'avatar' }),
        getCountInfo({ field: ['post', 'vacation', 'friend'], countLikePost: true }),
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
          },
        }
      )
    );

    return res.json({ data: result[0], message: 'get successfully' });
  }),
};
export default usersinforController;
