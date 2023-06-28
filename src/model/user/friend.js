import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';

const friendSchema = new mongoose.Schema({
  userId1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: 'UserId required',
  },
  userId2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: 'UserId required',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Friends = mongoose.model('Friends', friendSchema);

export default Friends;
