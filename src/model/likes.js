import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';
import Users from '#root/model/users';

const likeSchema = new mongoose.Schema({
  //Level 1 stands for postId, level 2 stands for vacationId
  level: {
    type: Number,
    required: 'districtId required',
    min: 1,
    max: 3,
  },

  //If level is 1, parentId is postId, if level is 2, parentId is albumId, if level is 3, parentId is vacationId
  parentId: {
    type: mongoose.ObjectId,
    required: 'parentId required',
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
