import mongoose from 'mongoose';
import validator from 'validator';
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
  order: {
    type: Number,
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
const AlbumsPageSchema = mongoose.model('AlbumPages', albumspageSchema);

export default AlbumSchema;
