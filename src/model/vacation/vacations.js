import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import Posts from '#root/model/vacation/posts';
import Views from '#root/model/interaction/views';
import Likes from '#root/model/interaction/likes';
import Comments from '#root/model/interaction/comments';

const vacationSchema = new mongoose.Schema(
  {
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

    title: {
      type: String,
      trim: true,
      required: 'Title required',
      maxlength: 1000,
      validate: value => {
        !validator.isAlpha(value, 'vi-VN', { ignore: " -_',()" }) &&
          _throw({
            code: 400,
            errors: [{ field: 'title', message: 'invalid title' }],
            message: 'invalid title',
          });
      },
    },

    description: {
      type: String,
      required: 'Description required',
      trim: true,
      maxlength: 65000,
    },

    memberList: [
      {
        type: mongoose.ObjectId,
        validate: async value => {
          const foundUser = await Users.findById(value);
          !foundUser &&
            _throw({
              code: 400,
              errors: [{ field: 'memberId', message: 'invalid userId' }],
              message: 'invalid userId',
            });
        },
      },
    ],

    shareStatus: {
      type: String,
      required: 'Share Status required',
      enum: ['public', 'protected', 'onlyme'],
      default: 'public',
    },

    shareList: [
      {
        type: mongoose.ObjectId,
        validate: async value => {
          const foundUser = await Users.findById(value);
          !foundUser &&
            _throw({
              code: 400,
              errors: [{ field: 'memberId', message: 'invalid userId' }],
              message: 'invalid userId',
            });
        },
      },
    ],

    startingTime: {
      type: Date,
      required: 'starting Time required',
      validate: value => {
        !validator.isDate(value) &&
          _throw({
            code: 400,
            errors: [{ field: 'startingTime', message: 'invalid time' }],
            message: 'invalid time',
          });
      },
    },

    endingTime: {
      type: Date,
      validate: value => {
        !validator.isDate(value) &&
          _throw({
            code: 400,
            errors: [{ field: 'endingTime', message: 'invalid time' }],
            message: 'invalid time',
          });
      },
    },

    views: {
      type: Number,
      min: 1,
      default: 1,
    },

    createdAt: {
      type: Date,
    },

    lastUpdateAt: {
      type: Date,
      default: new Date(),
    },
  }
  // {
  //   versionKey: false,
  //   toObject: { getters: true, setters: true },
  //   toJSON: { getters: true, setters: true },
  //   runSettersOnQuery: true,
  // }
);

const Vacations = mongoose.model('Vacations', vacationSchema);

Vacations.watch().on('change', async function (data) {
  switch (data.operationType) {
    case 'insert':
      console.log('insert new vacation');
      break;

    case 'delete':
      //Get id of vacation deleted
      const { _id } = data.documentKey;

      //Use vacationId to delete Posts, views, like and comment of vacation deleted
      const deletePost = Posts.deleteMany({ vacationId: _id });
      const deleteViews = Views.deleteMany({ modelType: 'vacation', modelId: _id });
      const deleteLike = Likes.deleteMany({ modelType: 'vacation', modelId: _id });
      const deleteComment = Comments.deleteMany({ modelType: 'vacation', modelId: _id });
      await Promise.all([deletePost, deleteViews, deleteLike, deleteComment]);
      break;

    default:
      break;
  }
});

export default Vacations;
