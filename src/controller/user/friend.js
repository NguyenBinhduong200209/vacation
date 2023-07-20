import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/user/friend';
import Users from '#root/model/user/users';
import _throw from '#root/utils/_throw';
import { addTotalPageFields, getUserInfo, facet } from '#root/config/pipeline';

const friendsController = {
  addFriend: asyncWrapper(async (req, res) => {
    const userId1 = req.userInfo._id;
    const userId2 = req.params.id;

    // Kiểm tra xem cả hai người dùng tồn tại trong hệ thống
    const foundUser2 = await Users.findById(userId2);
    !foundUser2 && _throw({ code: 404, message: 'user not found' });

    // Kiểm tra xem đã kết bạn trước đó chưa
    const existingFriendship = await Friends.findOne({
      $or: [
        { userId1: userId1, userId2: userId2 },
        { userId1: userId2, userId2: userId1 },
      ],
    });
    existingFriendship && _throw({ code: 400, message: 'Friend request already sent' });

    // Tạo yêu cầu kết bạn mới
    const newFriendRequest = await Friends.create({ userId1, userId2 });

    return res.status(201).json({
      data: newFriendRequest,
      message: 'Friend request sent',
    });
  }),

  acceptFriend: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const userId = req.userInfo._id;

    const result = await Friends.findOneAndUpdate({ _id: id, userId2: userId }, { status: 'accepted' });
    !result && _throw({ code: 404, message: 'not found' });

    return res.status(200).json({
      data: result,
      message: 'Friend request accepted',
    });
  }),

  getResquestList: asyncWrapper(async (req, res) => {
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
    const { id } = req.params;

    // Lấy ID của người dùng đăng nhập từ đối tượng req.userInfo
    const userId = req.userInfo._id;

    // Xóa bạn bè khỏi danh sách bạn bè của người dùng
    const result = await Friends.findOneAndDelete({
      _id: id,
      $or: [{ userId1: userId }, { userId2: userId }],
    });
    !result && _throw({ code: 404, message: 'not found' });

    return res.status(200).json({ data: result, message: 'Friend removed' });
  }),
};

export default friendsController;
