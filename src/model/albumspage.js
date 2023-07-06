import mongoose from 'mongoose';

import _throw from '#root/utils/_throw';
import Albums from '#root/model/albums';
import Resource from '#root/model/resource';

const albumspageSchema = new mongoose.Schema({
  albumsId: {
    type: mongoose.ObjectId,
    required: 'albumsID required',
    validate: async value => {
      const foundalbumspage = await Albums.findById(value);
      !foundalbumspage &&
        _throw({
          code: 400,
          errors: [{ field: 'albumsID', message: 'invalid albumsID' }],
          message: 'invalid albumsID',
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
  order: {
    type: String,
    required: true,
  },
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
      resource: {
        type: String,
      },
      style: {
        type: String,
        required: true,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: new Date(),
  },
});
const AlbumsPage = mongoose.model('AlbumsPage', albumspageSchema);

export default AlbumsPage;
