import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';
import Users from '#root/model/users';

const locationSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: 'districtId required',
    min: 1,
    max: 3,
  },

  title: {
    type: String,
    required: 'title required',
    maxlength: 1000,
    trim: true,
  },

  parentId: {
    type: mongoose.ObjectId,
    default: null,
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

  description: {
    type: String,
    required: 'description required',
    trim: true,
    maxlength: 65000,
  },

  // longitude: {
  //   type: String,
  //   trim: true,
  //   required: 'longitude required',
  // },

  // latitude: {
  //   type: String,
  //   trim: true,
  //   required: 'latitude required',
  // },

  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const Locations = mongoose.model('Locations', locationSchema);

export default Locations;
