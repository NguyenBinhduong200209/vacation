import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';

const notiSchema = new mongoose.Schema(
  {
    modelType: {
      type: String,
      required: 'model Type required',
      enum: ['post', 'vacation', 'album', 'friend'],
      default: 'friend',
    },

    modelId: {
      type: mongoose.ObjectId,
      required: 'modelId required',
    },

    action: {
      type: String,
      required: 'action required',
      enum: ['like', 'comment', 'addFriend'],
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

    content: {
      type: String,
      required: 'content required',
      trim: true,
      maxlength: 65000,
    },

    isSeen: {
      type: Boolean,
      required: 'seen status required',
      default: false,
    },

    createdAt: {
      type: Date,
    },

    lastUpdateAt: {
      type: Date,
      default: new Date(),
    },
  },
  {
    versionKey: false,
    toObject: { getters: true, setters: true },
    toJSON: { getters: true, setters: true },
    runSettersOnQuery: true,
  }
);

const Notifications = mongoose.model('Notifications', notiSchema);

export default Notifications;