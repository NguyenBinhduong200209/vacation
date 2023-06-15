import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/users';
import Vacations from '#root/model/vacations';
import Locations from '#root/model/locations';

const postSchema = new mongoose.Schema({
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
});

const Posts = mongoose.model('Posts', postSchema);

export default Posts;
