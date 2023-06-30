import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: 'name required',
      maxlength: 50,
      validate: value => {
        !validator.isAlphanumeric(value, 'vi-VN', { ignore: " -_',()." }) &&
          _throw({ code: 400, errors: [{ field: 'name', message: 'invalid name' }] });
      },
    },

    type: {
      type: String,
      trim: true,
      required: 'type required',
    },

    size: {
      type: Number,
      required: 'size required',
      min: 0,
      default: 0,
    },

    path: {
      type: String,
      trim: true,
      required: 'path required',
    },

    userId: {
      type: mongoose.ObjectId,
      required: 'UserId required',
      validate: async value => {
        const foundUser = await Users.findById(value);
        !foundUser && _throw({ code: 404, errors: [{ field: 'userId', message: 'userId not found' }] });
      },
    },

    ref: {
      type: [
        {
          model: {
            type: String,
            required: 'model ref required',
            trim: true,
            enum: Object.keys(mongoose.connection.models).map(item => item.toLowerCase()),
          },
          _id: {
            type: mongoose.ObjectId,
            required: 'modelId required',
          },
          field: { type: String, trim: true },
          index: { type: Number, min: 0 },
        },
      ],
      validate: value => {
        value.length === 0 && _throw({ code: 400, errors: [{ field: 'ref', message: 'ref must not be an empty array' }] });
      },
    },

    createdAt: {
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

const Resources = mongoose.model('Resources', resourceSchema);

export default Resources;
