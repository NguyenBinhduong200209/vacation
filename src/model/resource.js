import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/users';

const resourceSchema = new mongoose.Schema(
  {
    category: [
      {
        classType: {
          type: String,
          required: 'classType required',
          enum: ['profileAvatar', 'vacationCover', 'post', 'album'],
        },

        classId: {
          type: mongoose.ObjectId,
          required: 'classId required',
        },

        isSelected: {
          type: Boolean,
        },
      },
    ],

    userId: {
      type: mongoose.ObjectId,
      required: 'UserId required',
      validate: async value => {
        const foundUser = await Users.findById(value);
        !foundUser &&
          _throw({
            code: 404,
            errors: [{ field: 'userId', message: 'userId not found' }],
            message: 'invalid userId',
          });
      },
    },

    name: {
      type: String,
      trim: true,
      required: 'name required',
      maxlength: 50,
      validate: value => {
        !validator.isAlphanumeric(value, 'vi-VN', { ignore: " -_',()" }) &&
          _throw({
            code: 400,
            errors: [{ field: 'name', message: 'invalid name' }],
            message: 'invalid name',
          });
      },
    },

    contentType: {
      type: String,
      trim: true,
      required: 'contentType required',
    },

    resource: {
      type: Buffer,
      required: 'resource required',
      set: val => {
        return typeof val === 'string'
          ? Buffer.from(val.replace(/data:image\/\w+;base64,/, ''), 'base64')
          : val;
      },

      get: val => {
        return 'data:image/webp;base64,' + val.toString('base64');
      },
    },

    createdAt: {
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

const Resources = mongoose.model('Resources', resourceSchema);

export default Resources;
