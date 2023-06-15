import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';
import Users from '#root/model/users';
import Posts from '#root/model/posts';

const likeSchema = new mongoose.Schema({
  postId: {
    type: mongoose.ObjectId,
    required: 'postId required',
    validate: async value => {
      const foundPost = await Posts.findById(value);
      !foundPost &&
        _throw({
          code: 400,
          errors: [{ field: 'postId', message: 'invalid postId' }],
          message: 'invalid postId',
        });
    },
  },

  userId: {
    type: mongoose.ObjectId,
    required: 'UserId required',
    validate: async value => {
      const foundUser = await Users.findById(value);
      !foundUser &&
        _throw({
          code: 400,
          errors: [{ field: 'userId', message: 'invalid userId' }],
          message: 'invalid userId',
        });
    },
  },

  createdAt: {
    type: Date,
  },

  lastUpdateAt: {
    type: Date,
    default: new Date(),
  },
});

const Likes = mongoose.model('Likes', likeSchema);

export default Likes;
