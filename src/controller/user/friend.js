import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/user/friend';
import Users from '#root/model/user/users';
import _throw from '#root/utils/_throw';
import { addTotalPageFields } from '#root/config/pipeline';
import Resources from '#root/model/resource/resource';

const friendsController = {
  addFriend: asyncWrapper(async (req, res) => {
    const { userId2 } = req.body;

    const userId1 = req.userInfo._id;

    // Kiểm tra xem cả hai người dùng tồn tại trong hệ thống
    const foundUser2 = await Users.findById(userId2);
    if (userId1.toString() === userId2.toString()) {
      return res.status(403).json({ message: "You can't make friends with yourself" });
    }
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

    const page = req.query.page ? parseInt(req.query.page) : 1; // Trang hiện tại từ yêu cầu
    const itemOfPage = Number(process.env.ITEM_OF_PAGE);

    // Pipeline để tính tổng số yêu cầu kết bạn
    const pipelineTotal = [
      { $match: { userId2: userId, status: 'pending' } },
      { $group: { _id: null, total: { $sum: 1 } } },
      { $project: { _id: 0, total: 1 } },
    ];

    const aggregateResultTotal = await Friends.aggregate(pipelineTotal);
    const total = aggregateResultTotal.length > 0 ? aggregateResultTotal[0].total : 0;
    const totalPages = Math.ceil(total / itemOfPage);

    if (page > totalPages) {
      return res.status(400).json({ message: 'Invalid page number' });
    }

    const startIndex = (page - 1) * itemOfPage;

    // Pipeline để lấy danh sách bạn bè kết bạn và thông tin avatar, firstname và lastname
    const pipelineFriends = [
      { $match: { userId2: userId, status: 'pending' } },
      {
        $lookup: {
          from: 'resources',
          localField: 'userId1',
          foreignField: 'userId',
          as: 'avatar',
        },
      },
      { $unwind: '$avatar' },
      { $match: { 'avatar.ref.model': 'users' } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId1',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1, // Loại bỏ trường _id
          userId1: 1, // Bao gồm trường userId1 (đổi tên thành userId)
          firstname: '$user.firstname', // Lấy giá trị firstname từ trường user.firstname
          lastname: '$user.lastname', // Lấy giá trị lastname từ trường user.lastname
          avatar: '$avatar.path', // Đổi tên trường avatar thành path
        },
      },
      { $skip: startIndex },
      { $limit: itemOfPage },
    ];

    const paginatedFriendRequests = await Friends.aggregate(pipelineFriends);

    return res.status(200).json({
      message: 'Friend Request list retrieved',
      meta: {
        page: page,
        pages: totalPages,
        total: total,
      },
      data: paginatedFriendRequests,
    });
  }),

  getFriendList: asyncWrapper(async (req, res) => {
    const userId = req.userInfo._id;
    const foundUser = await Users.findById(userId);

    const page = req.query.page ? parseInt(req.query.page) : 1; // Trang hiện tại từ yêu cầu
    const itemOfPage = Number(process.env.ITEM_OF_PAGE);

    // Pipeline để tính tổng số yêu cầu kết bạn
    const pipelineTotal = [
      {
        $match: {
          $or: [{ userId2: userId }, { userId1: userId }],
          status: 'accepted',
        },
      },
      { $group: { _id: null, total: { $sum: 1 } } },
      { $project: { _id: 0, total: 1 } },
    ];

    const aggregateResultTotal = await Friends.aggregate(pipelineTotal);
    const total = aggregateResultTotal.length > 0 ? aggregateResultTotal[0].total : 0;
    const totalPages = Math.ceil(total / itemOfPage);

    if (page > totalPages) {
      return res.status(400).json({ message: 'Invalid page number' });
    }

    const startIndex = (page - 1) * itemOfPage;

    // Pipeline để lấy danh sách bạn bè kết bạn và thông tin avatar, firstname và lastname
    const pipelineFriends = [
      {
        $match: {
          $or: [{ userId2: userId }, { userId1: userId }],
          status: 'accepted',
        },
      },
      {
        $lookup: {
          from: 'resources',
          localField: 'userId1',
          foreignField: 'userId',
          as: 'avatar',
        },
      },
      { $unwind: '$avatar' },
      { $match: { 'avatar.ref.model': 'users' } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId1',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1, // Loại bỏ trường _id
          userId1: 1, // Bao gồm trường userId1 (đổi tên thành userId)
          firstname: '$user.firstname', // Lấy giá trị firstname từ trường user.firstname
          lastname: '$user.lastname', // Lấy giá trị lastname từ trường user.lastname
          avatar: '$avatar.path', // Đổi tên trường avatar thành path
        },
      },
      { $skip: startIndex },
      { $limit: itemOfPage },
    ];

    const paginatedFriendRequests = await Friends.aggregate(pipelineFriends);

    return res.status(200).json({
      message: 'Friend Request list retrieved',
      meta: {
        page: page,
        pages: totalPages,
        total: total,
      },
      data: paginatedFriendRequests,
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
