import asyncWrapper from '#root/middleware/asyncWrapper';
import User_User from '#root/model/user_user';
import _throw from '#root/utils/_throw';

const friendsController = {
  addFriend: asyncWrapper(async (req, res) => {
    try {
      const { userId1, userId2 } = req.body;

      // Kiểm tra xem cả hai người dùng tồn tại trong hệ thống
      const foundUser1 = await User_User.findById(userId1);
      const foundUser2 = await User_User.findById(userId2);

      if (!foundUser1 || !foundUser2) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Kiểm tra xem đã kết bạn trước đó chưa
      if (foundUser1.friends.includes(userId2) || foundUser2.friends.includes(userId1)) {
        return res.status(400).json({ message: 'Already friends' });
      }

      // Thêm userId2 vào danh sách bạn bè của userId1 và ngược lại
      foundUser1.friends.push(userId2);
      foundUser2.friends.push(userId1);

      await foundUser1.save();
      await foundUser2.save();

      return res.status(200).json({ message: 'Friendship established' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }),
};

export default friendsController;
