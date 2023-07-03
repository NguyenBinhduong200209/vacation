import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import Vacations from '#root/model/vacation/vacations';
import Locations from '#root/model/vacation/locations';
import Likes from '#root/model/interaction/likes';
import Comments from '#root/model/interaction/comments';

const postSchema = new mongoose.Schema(
  {
    vacationId: {
      type: mongoose.ObjectId,
      required: 'vacationId required',
      validate: async value => {
        const foundVacation = await Vacations.findById(value);
        !foundVacation &&
          _throw({
            code: 400,
            errors: [{ field: 'vacationId', message: 'invalid vacationId' }],
            message: 'invalid vacationId',
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

    locationId: {
      type: mongoose.ObjectId,
      required: 'locationId required',
      validate: async value => {
        const foundLocation = await Locations.findById(value);
        !foundLocation &&
          _throw({
            code: 400,
            errors: [{ field: 'locationId', message: 'invalid locationId' }],
            message: 'invalid locationId',
          });
      },
    },

    content: {
      type: String,
      required: 'content required',
      trim: true,
      maxlength: 65000,
    },

    resource: [
      {
        type: String,
        validate: async value => {
          !validator.isURL(value) &&
            _throw({
              code: 400,
              errors: [{ field: 'subAlbum', message: 'upload failed' }],
              message: 'upload failed',
            });
        },
      },
    ],

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

const Posts = mongoose.model('Posts', postSchema);

Posts.watch().on('change', async function (data) {
  switch (data.operationType) {
    case 'insert':
      console.log('insert new post');
      break;

    case 'delete':
      //Get id of post deleted
      const { _id } = data.documentKey;

      //Use postId to delete like and comment within post deleted
      const deleteLike = Likes.deleteMany({ modelType: 'post', modelId: _id });
      const deleteComment = Comments.deleteMany({ modelType: 'post', modelId: _id });
      await Promise.all([deleteLike, deleteComment]);
      break;

    default:
      break;
  }
});

export default Posts;
