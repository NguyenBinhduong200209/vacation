import mongoose from 'mongoose';
import validator from 'validator';
import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import { getStorage, ref, deleteObject } from 'firebase/storage';

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: 'name required',
      maxlength: 100,
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
            enum: ['users', 'vacations', 'posts', 'albums'],
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

// resourceSchema.pre('findByIdAndDelete', function (next) {
//   console.log(this);
// });

Resources.watch().on('change', async function (data) {
  switch (data.operationType) {
    case 'insert':
      console.log('insert new resource');
      break;

    case 'delete':
      //Get id of resource deleted
      const { _id } = data.documentKey;

      break;

    default:
      break;
  }
});

export default Resources;
