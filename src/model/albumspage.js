import mongoose from 'mongoose';
import { Schema } from 'mongoose';
import Users from '#root/model/user/users';
import _throw from '#root/utils/_throw';
import Albums from '#root/model/albums';
import Resource from '#root/model/resource';

const albumspageSchema = new mongoose.Schema({
  albumId: {
    type: mongoose.ObjectId,
    required: 'albumId required',
    validate: async value => {
      const foundalbumspage = await Albums.findById(value);
      !foundalbumspage &&
        _throw({
          code: 400,
          errors: [{ field: 'albumId', message: 'invalid albumId' }],
          message: 'invalid albumsID',
        });
    },
  },
  page: {
    type: Number,
    required: 'page Number required',
    trim: true,
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
  resource: [
    {
      resourceId: {
        type: mongoose.ObjectId,
        ref: 'Resource', // Sử dụng tham chiếu đến mô hình Resource
        required: 'resourceId',
        trim: true,
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

      style: {
        type: Schema.Types.Mixed,
        required: true,
        trim: true,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: new Date(),
  },
  lastUpdate: {
    type: Date,
    default: new Date(),
  },
});
const AlbumsPage = mongoose.model('AlbumsPage', albumspageSchema);

export default AlbumsPage;
