import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import Vacations from '#root/model/vacation/vacations';
import Locations from '#root/model/vacation/locations';
import Likes from '#root/model/interaction/likes';
import Comments from '#root/model/interaction/comments';
import Resources from '#root/model/resource';

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

postSchema.post('findOneAndDelete', async function () {
  const { _id } = this.getQuery();

  //Use vacationId to delete Posts, views, like and comment of vacation deleted
  const deleteLike = Likes.deleteMany({ modelType: 'post', modelId: _id });
  const deleteComment = Comments.deleteMany({ modelType: 'post', modelId: _id });
  const deleteResource = Resources.deleteMany({ ref: { $elemMatch: { model: 'posts', _id: _id } } });
  const result = await Promise.all([deleteLike, deleteComment, deleteResource]);
  console.log('deletePost', result);
});

postSchema.post('save', async function () {
  const { vacationId } = this;

  //Update lastUpdateAt in vacation
  const updateVacation = await Vacations.findByIdAndUpdate(vacationId, { lastUpdateAt: new Date() });
  // console.log('createPost', updateVacation);
});

const Posts = mongoose.model('posts', postSchema);

export default Posts;
