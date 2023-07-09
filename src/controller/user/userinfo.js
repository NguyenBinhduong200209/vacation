import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Likes from '#root/model/interaction/likes';
import Posts from '#root/model/vacation/posts';
import Resource from '#root/model/resource/resource';
import Vacations from '#root/model/vacation/vacations';
import Friends from '#root/model/user/friend';
import mongoose from 'mongoose';

const usersinforController = {
  getprofile: asyncWrapper(async (req, res) => {
    const ObjectId = mongoose.Types.ObjectId;
    const userId = req.userInfo._id;
    const value = { userId };

    const ids = req.params.id;
    const field = 'avatar';

    if (userId && ids) {
      const users = [];
      const avatar = await Resource.findOne({
        userId: ids,
        'ref.model': 'users',
        'ref.field': field,
      })
        .sort({ createdAt: -1 })
        .select('path');

      const foundUser = await Users.findById(ids);
      const userPosts = await Posts.find({ ids: foundUser._id });

      // Lấy danh sách các ID bài viết của người dùng
      const postIds = userPosts.map(post => post._id.toString());

      // Đếm tổng số lượt thích của từng bài viết
      const likeCounts = await Likes.aggregate([
        {
          $match: {
            modelId: { $in: postIds.map(id => new ObjectId(id)) },
          },
        },
        {
          $group: {
            _id: '$modelId',
            totalLikes: { $sum: 1 },
          },
        },
      ]);

      // Tạo một đối tượng Map để lưu trữ tổng số lượt thích của từng bài viết
      const postLikeCountsMap = new Map();

      // Đưa các giá trị vào Map
      likeCounts.forEach(likeCount => {
        postLikeCountsMap.set(likeCount._id.toString(), likeCount.totalLikes);
      });

      // Tính tổng số lượt thích của người dùng
      let totalLikesForUserPosts = 0;

      userPosts.forEach(post => {
        const postId = post._id.toString();
        const likeCount = postLikeCountsMap.get(postId);
        totalLikesForUserPosts += likeCount || 0;
      });

      const totalPosts = await Posts.countDocuments({ userId: foundUser._id });
      const totalFriends = await Friends.countDocuments({
        $or: [{ userId1: foundUser._id }, { userId2: foundUser._id }],
      });
      const totalVacations = await Vacations.countDocuments({
        $or: [{ userId: foundUser._id }, { memberList: foundUser._id }],
      });

      users.push({
        id: foundUser._id,
        avatar: avatar,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        dateOfBirth: foundUser.dateOfBirth,
        gender: foundUser.gender,
        description: foundUser.description,
        national: foundUser.national,
        totalLikesForUserPosts: totalLikesForUserPosts,
        totalPosts: totalPosts,
        totalFriends: totalFriends,
        totalVacations: totalVacations,
      });

      const totalUsers = users.length;

      return res.status(200).json({
        message: 'Get info successfully',
        totalUsers: totalUsers,
        data: users,
      });
    } else if (userId) {
      const foundUser = await Users.findOne(value);
      if (!foundUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      const avatar = await Resource.findOne({
        userId: userId,
        'ref.model': 'users',
        'ref.field': field,
      })
        .sort({ createdAt: -1 })
        .select('path');

      const userPosts = await Posts.find({ userId: foundUser._id });

      // Lấy danh sách các ID bài viết của người dùng
      const postIds = userPosts.map(post => post._id.toString());

      // Đếm tổng số lượt thích của từng bài viết
      const likeCounts = await Likes.aggregate([
        {
          $match: {
            modelId: { $in: postIds.map(id => new ObjectId(id)) },
          },
        },
        {
          $group: {
            _id: '$modelId',
            totalLikes: { $sum: 1 },
          },
        },
      ]);

      // Tạo một đối tượng Map để lưu trữ tổng số lượt thích của từng bài viết
      const postLikeCountsMap = new Map();

      // Đưa các giá trị vào Map
      likeCounts.forEach(likeCount => {
        postLikeCountsMap.set(likeCount._id.toString(), likeCount.totalLikes);
      });

      // Tính tổng số lượt thích của người dùng
      let totalLikesForUserPosts = 0;

      userPosts.forEach(post => {
        const postId = post._id.toString();
        const likeCount = postLikeCountsMap.get(postId);
        totalLikesForUserPosts += likeCount || 0;
      });

      const totalPosts = await Posts.countDocuments({ userId: foundUser._id });
      const totalFriends = await Friends.countDocuments({
        $or: [{ userId1: foundUser._id }, { userId2: foundUser._id }],
      });
      const totalVacations = await Vacations.countDocuments({
        $or: [{ userId: foundUser._id }, { memberList: foundUser._id }],
      });

      return res.status(200).json({
        data: {
          id: foundUser._id,
          avatar: avatar,
          username: foundUser.username,
          firstname: foundUser.firstname,
          lastname: foundUser.lastname,
          email: foundUser.email,
          dateOfBirth: foundUser.dateOfBirth,
          gender: foundUser.gender,
          description: foundUser.description,
          national: foundUser.national,
          totalLikes: totalLikesForUserPosts,
          totalPosts: totalPosts,
          totalFriends: totalFriends,
          totalVacations: totalVacations,
        },
        message: 'Get info successfully',
      });
    } else _throw({ code: 400, message: 'userId not provided' });
  }),

  getfriendprofile: asyncWrapper(async (req, res) => {
    const { ids } = req.body;
    console.log(ids);
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid IDs provided' });
    }

    // Get User Information from database

    const users = [];

    for (const id of ids) {
      const foundUser = await Users.findById(id);

      if (!foundUser) {
        // Bỏ qua ID không hợp lệ
        continue;
      }

      const totalLikes = await Likes.countDocuments({ userId: foundUser._id });
      const totalPosts = await Posts.countDocuments({ userId: foundUser._id });
      const totalFriends = await Friends.countDocuments({
        $or: [{ userId1: foundUser._id }, { userId2: foundUser._id }],
      });
      const totalVacations = await Vacations.countDocuments({
        $or: [{ userId: foundUser._id }, { memberList: foundUser._id }],
      });
      users.push({
        id: foundUser._id,
        avatar: foundUser.avatar,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        dateOfBirth: foundUser.dateOfBirth,
        gender: foundUser.gender,
        description: foundUser.description,
        national: foundUser.national,
        totalLikes: totalLikes,
        totalPosts: totalPosts,
        totalFriends: totalFriends,
        totalVacations: totalVacations,
      });
    }
    const totalUsers = users.length;
    return res.status(200).json({
      message: 'Get info successfully',
      totalUsers: totalUsers,
      data: users,
    });
  }),
};
export default usersinforController;
