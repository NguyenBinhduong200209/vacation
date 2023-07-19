import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/user/friend';
import Users from '#root/model/user/users';
import _throw from '#root/utils/_throw';
import { addTotalPageFields, getUserInfo, facet } from '#root/config/pipeline';

const friendsController = {
  addFriend: asyncWrapper(async (req, res) => {
    const { userId2 } = req.body;
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
        { userId1: userId2, userId2: userId1 },
      ],
    });

    if (existingFriendship) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Tạo yêu cầu kết bạn mới
    const newFriendRequest = await Friends.create({
      userId1,
      userId2,
    });

    return res.status(201).json({
      message: 'Friend request sent',
      friendRequest: newFriendRequest,
    });
  }),

  acceptFriend: asyncWrapper(async (req, res) => {
    const { friendRequestId, status } = req.body;
    const userId2 = req.userInfo._id;
    console.log(userId2);

    // Kiểm tra xem yêu cầu kết bạn tồn tại
    const friendRequest = await Friends.findById(friendRequestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Kiểm tra xem người dùng hiện tại có quyền chấp nhận hoặc từ chối yêu cầu này

    if (!friendRequest.userId2.equals(userId2)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Cập nhật trạng thái của yêu cầu kết bạn
    switch (status) {
      case 'accepted': {
        // Chấp nhận yêu cầu kết bạn
        await Friends.findOneAndUpdate({ _id: friendRequestId }, { $set: { status: 'accepted' } });
        return res.status(200).json({
          message: 'Friend request accepted',
        });
      }
      case 'rejected':
        // Từ chối yêu cầu kết bạn và xóa bản ghi
        await Friends.findOneAndDelete({ _id: friendRequestId });
        return res.status(200).json({
          message: 'Friend request rejected and deleted',
        });
    }
  }),

  getResquestFriendList: asyncWrapper(async (req, res) => {
    const { page } = req.query;
    const userId = req.userInfo._id;

    // Tìm các yêu cầu kết bạn đối với người dùng hiện tại
    const result = await Friends.aggregate(
      [].concat(
        { $match: { userId2: userId, status: 'pending' } },
        addTotalPageFields({ page }),
        getUserInfo({
          localField: 'userId1',
          field: ['avatar', 'username', 'firstname', 'lastname', 'username'],
          as: 'userInfo',
        }),
        { $project: { userId2: 0 } },
        facet({ meta: ['page', 'pages', 'total'], data: ['_id', 'createdAt', 'userInfo'] })
      )
    );

    return res.json(result[0]);
  }),

  getFriendList: asyncWrapper(async (req, res) => {
    const { page } = req.query;
    const userId = req.userInfo._id;

    const result = await Friends.aggregate(
      [].concat(
        {
          $match: {
            $or: [
              { userId1: userId, status: 'accepted' },
              { userId2: userId, status: 'accepted' },
            ],
          },
        },
        addTotalPageFields({ page }),
        { $addFields: { userInfo: { $cond: { if: { $eq: ['$userId1', userId] }, then: '$userId2', else: '$userId1' } } } },
        getUserInfo({
          localField: 'userInfo',
          field: ['avatar', 'username', 'firstname', 'lastname', 'username'],
          as: 'userInfo',
        }),
        { $project: { userId1: 0, userId2: 0 } },
        facet({ meta: ['page', 'pages', 'total'], data: ['_id', 'userInfo', 'createdAt'] })
      )
    );

    return res.json(result[0]);
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
    const result = await Friends.findByIdAndDelete(existingFriendship._id);

    return res.status(200).json({ data: result, message: 'Friend removed' });
  }),
};

export default friendsController;
