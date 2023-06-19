import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/friend';
import Users from '#root/model/users';
import _throw from '#root/utils/_throw';

const friendsController = {
  addFriend: asyncWrapper(async (req, res) => {
    const { userId2 } = req.body;

    // Lấy ID của người dùng đăng nhập từ đối tượng req.userInfo
    const userId1 = req.userInfo._id;

    // Kiểm tra xem cả hai người dùng tồn tại trong hệ thống
    const foundUser2 = await Users.findById(userId2);

    if (!foundUser2) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Kiểm tra xem đã kết bạn trước đó chưa
    const existingFriendship = await Friends.findOne({
      $or: [
        { userId1, userId2 },
        { userId1: userId2, userId2 },
      ],
    });

    if (existingFriendship) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Tạo yêu cầu kết bạn mới
    const newFriendship = new Friends({
      userId1,
      userId2,
    });

    // Lưu yêu cầu kết bạn
    await newFriendship.save();
    const populatedFriendship = await Friends.findById(newFriendship._id)
      .populate('userId1', 'firstname lastname avatar dateOfBirth gender description')
      .populate('userId2', 'firstname lastname avatar dateOfBirth gender description')
      .exec();

    return res.status(200).json({
      message: 'Friend request sent',
      friendship: populatedFriendship,
    });
  }),
  getFriendList: asyncWrapper(async (req, res) => {
    const userId = req.userInfo._id;

    // Kiểm tra xem người dùng tồn tại trong hệ thống
    const foundUser = await Users.findById(userId);

    if (!foundUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Tìm danh sách bạn bè của người dùng
    const friendList = await Friends.find({
      $or: [{ userId1: foundUser._id }, { userId2: foundUser._id }],
    })
      .populate('userId1', 'firstname lastname avatar dateOfBirth gender description')
      .populate('userId2', 'firstname lastname avatar dateOfBirth gender description')
      .exec();
    const filteredFriendList = friendList.map(friend => {
      if (friend.userId1._id.toString() === foundUser._id.toString()) {
        return friend.userId2;
      } else {
        return friend.userId1;
      }
    });

    return res.status(200).json({
      message: 'Friend list retrieved',
      data: filteredFriendList,
    });
  }),
  removeFriend: asyncWrapper(async (req, res) => {
    const { friendId } = req.params;

    // Lấy ID của người dùng đăng nhập từ đối tượng req.userInfo
    const userId = req.userInfo._id;

    // Kiểm tra xem bạn bè tồn tại trong danh sách bạn bè của người dùng
    const existingFriendship = await Friends.findOne({
      $or: [
        { userId1: userId, userId2: friendId },
        { userId1: friendId, userId2: userId },
      ],
    });

    if (!existingFriendship) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    // Xóa bạn bè khỏi danh sách bạn bè của người dùng
    await Friends.findByIdAndDelete(existingFriendship._id);

    return res.status(200).json({ success: true, message: 'Friend removed' });
  }),
};

export default friendsController;
