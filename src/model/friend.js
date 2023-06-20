import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';

const friendSchema = new mongoose.Schema(
  {
    userId1: {
<<<<<<< HEAD
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
    userId2: {
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
  },
  {
    versionKey: false,
    toObject: { getters: true, setters: true },
    toJSON: { getters: true, setters: true },
    runSettersOnQuery: true,
  }
=======
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: 'UserId required',
     
    },
    userId2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: 'UserId required',
      
    },
  },
>>>>>>> 0bdcae46f928b3f0fdef45a13162a137767f30f7
);

const Friends = mongoose.model('Friends', friendSchema);

export default Friends;
