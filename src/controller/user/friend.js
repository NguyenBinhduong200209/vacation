import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/user/friend';
import Users from '#root/model/user/users';
import _throw from '#root/utils/_throw';
import { addTotalPageFields, getUserInfo, getCountInfo, facet } from '#root/config/pipeline';

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
    const userId = req.userInfo._id;
    const foundUser = await Users.findById(userId);
    console.log(userId);
    // Tìm các yêu cầu kết bạn đối với người dùng hiện tại
    const friendRequests = await Friends.find({ userId2: userId, status: 'pending' })
      .populate('userId1', 'avatar firstname lastname dateOfBirth')
      .populate('userId2', 'avatar firstname lastname dateOfBirth')
      .exec();
    const filteredFriendRequests = friendRequests.map(friend => {
      if (friend.userId2._id.toString() === foundUser._id.toString()) {
        return friend.userId1;
      }
    });

    const page = req.query.page ? parseInt(req.query.page) : 1; // Trang hiện tại từ yêu cầu
    const itemOfPage = Number(process.env.ITEM_OF_PAGE);
    const pipeline = addTotalPageFields({ page });
    const aggregateResult = await Friends.aggregate(pipeline);

    const total = aggregateResult.length > 0 ? aggregateResult[0].total : 0;
    const totalPages = Math.ceil(total / itemOfPage);

    if (page > totalPages) {
      return res.status(400).json({ message: 'Invalid page number' });
    }

    const startIndex = (page - 1) * itemOfPage;
    const endIndex = startIndex + itemOfPage;

    const paginatedFriendRequests = filteredFriendRequests.slice(startIndex, endIndex);
    const friendRequestsCount = friendRequests.length;

    return res.status(200).json({
      message: 'Friend Request list retrieved',
      meta: {
        page: page,
        pages: totalPages,
        total: friendRequestsCount,
      },
      data: paginatedFriendRequests,
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
      $or: [
        { userId1: foundUser._id, status: 'accepted' },
        { userId2: foundUser._id, status: 'accepted' },
      ],
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
    const page = req.query.page ? parseInt(req.query.page) : 1; // Trang hiện tại từ yêu cầu
    const itemOfPage = Number(process.env.ITEM_OF_PAGE);
    const pipeline = addTotalPageFields({ page });
    const aggregateResult = await Friends.aggregate(pipeline);

    const total = aggregateResult.length > 0 ? aggregateResult[0].total : 0;
    const totalPages = Math.ceil(total / itemOfPage);

    if (page > totalPages) {
      return res.status(400).json({ message: 'Invalid page number' });
    }

    const startIndex = (page - 1) * itemOfPage;
    const endIndex = startIndex + itemOfPage;

    const paginatedFriendList = filteredFriendList.slice(startIndex, endIndex);
    const friendListcount = friendList.length;

    return res.status(200).json({
      message: 'Friend list retrieved',
      meta: {
        page: page,
        pages: totalPages,
        total: friendListcount,
      },
      data: paginatedFriendList,
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

    return res.status(200).json({ message: 'Friend removed' });
  }),
};

export default friendsController;
