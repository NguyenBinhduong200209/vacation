import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import Vacations from '#root/model/vacation/vacations';

const albumSchema = new mongoose.Schema(
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

    title: {
      type: String,
      trim: true,
      required: 'Title required',
      maxlength: 100,
      validate: value => {
        !validator.isAlpha(value, 'vi-VN', { ignore: ' -_' }) &&
          _throw({
            code: 400,
            errors: [{ field: 'title', message: 'invalid title' }],
            message: 'invalid title',
          });
      },
    },

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
    image: [
      {
        id: {
          type: mongoose.ObjectId,
          ref: 'Resource', // Sử dụng tham chiếu đến mô hình Resource
          required: 'resourceID',
          validate: async value => {
            const foundimage = await Resource.findById(value).select('path');
            // Tìm ảnh theo đường dẫn
            !foundimage &&
              _throw({
                code: 400,
                errors: [{ field: 'resourceID', message: 'invalid resourceID' }],
                message: 'invalid resourceID',
              });
          },
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
  },
  {
    versionKey: false,
    toObject: { getters: true, setters: true },
    toJSON: { getters: true, setters: true },
    runSettersOnQuery: true,
  }
);
albumSchema.pre('remove', async function (next) {
  const albumId = this._id;

  try {
    // Remove associated AlbumsPage documents with matching albumId
    await AlbumsPage.deleteMany({ albumId: albumId });
    next();
  } catch (error) {
    next(error);
  }
});

const Albums = mongoose.model('Albums', albumSchema);

export default Albums;
