import mongoose from 'mongoose';
import Users from '#root/model/user/users';
import _throw from '#root/utils/_throw';
import Albums from '#root/model/albums';
import Resource from '#root/model/resource/resource';

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
  resource: [
    {
      id: {
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
      index: { type: Number, min: 0 },
      style: {
        type: String,
        required: true,
        trim: true,
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
