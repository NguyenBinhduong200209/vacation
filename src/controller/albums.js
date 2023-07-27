import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/user/friend';
import Albums from '#root/model/albums';
import Vacations from '#root/model/vacation/vacations';
import AlbumsPage from '#root/model/albumspage';
import { facet, addTotalPageFields } from '#root/config/pipeline';
import mongoose from 'mongoose';

const albumsController = {
  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { vacationId, title, shareStatus } = req.body;
    //Get userId from verifyJWT middleware
    const foundUser = req.userInfo;
    // Get vacation information from vacationId
    const vacation = await Vacations.findById(vacationId);
    const foundAlbums = await Albums.findOne({ vacationId: vacationId });
    if (foundAlbums) {
      return res.status(400).json({ message: 'Albums Already' });
    }

    // Check if the foundUser is in the memberList or is the creator of the vacation
    const userIds = [...vacation.memberList, vacation.userId].map(value => value.toString());
    if (!userIds.includes(foundUser._id.toString())) {
      return res.status(403).json({ message: 'You are not allowed to create an album for this vacation' });
    }

    //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
    let newShareList;
    let shareList = [];
    switch (shareStatus) {
      case 'protected':
        // Get friend list of the user
        const friendList = await Friends.find({
          $or: [
            { userId1: foundUser._id, status: 'accepted' },
            { userId2: foundUser._id, status: 'accepted' },
          ],
        })
          .populate('userId1', 'firstname lastname')
          .populate('userId2', 'firstname lastname')
          .exec();

        // Create a Set to store unique friendIds
        const uniqueFriendIds = new Set();

        friendList.forEach(friend => {
          if (friend.userId1._id.toString() !== foundUser._id.toString()) {
            uniqueFriendIds.add(friend.userId1._id.toString());
          }

          if (friend.userId2._id.toString() !== foundUser._id.toString()) {
            uniqueFriendIds.add(friend.userId2._id.toString());
          }
        });

        // Add userId of the foundUser to the uniqueFriendIds Set
        uniqueFriendIds.add(foundUser._id.toString());

        // Create a new Set to store unique friendIds from shareList
        const uniqueShareList = new Set();

        // Add friendIds from shareList to the uniqueShareList Set
        if (Array.isArray(shareList)) {
          shareList.forEach(friendId => {
            if (friendId.toString() !== foundUser._id.toString()) {
              uniqueShareList.add(friendId.toString());
            }
          });
        }

        // Merge uniqueFriendIds and uniqueShareList to create the final shareList
        newShareList = Array.from(new Set([...uniqueFriendIds, ...uniqueShareList]));
        break;

      case 'onlyme':
        newShareList = [foundUser._id.toString()];
        break;

      case 'public':
        newShareList = [];
        break;

      default:
        newShareList = null;
        break;
    }

    // Check if shareList contains duplicate userId
    if (Array.isArray(shareList)) {
      const uniqueShareList = Array.from(new Set(shareList.map(friendId => friendId.toString())));

      if (uniqueShareList.length !== shareList.length) {
        return res.status(400).json({ message: 'Duplicate userIds found in shareList' });
      }
    }

    // Create new Vacation and run validation when creating
    const newAlbum = await Albums.create({
      vacationId,
      userId: foundUser._id,
      title,
      createdAt: new Date(),
      shareStatus,
      shareList: newShareList,
    });

    // Send response to the front-end
    return res.status(201).json({ data: newAlbum, message: 'Album created' });
  }),
  updateAlbum: asyncWrapper(async (req, res) => {
    const { title, description, shareStatus } = req.body;
    const { albumId } = req.params;
    const foundUser = req.userInfo;
    let shareList = [];

    // Kiểm tra xem album có tồn tại trong database không
    const existingAlbum = await Albums.findOne(albumId);

    if (!existingAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }

    if (existingAlbum.userId.toString() !== foundUser._id.toString()) {
      return res.status(401).json({ message: 'You are not authorized to update this album' });
    }

    let newShareList;

    switch (shareStatus) {
      case 'protected':
        // Get friend list of the user
        const friendList = await Friends.find({
          $or: [
            { userId1: foundUser._id, status: 'accepted' },
            { userId2: foundUser._id, status: 'accepted' },
          ],
        })
          .populate('userId1', 'firstname lastname')
          .populate('userId2', 'firstname lastname')
          .exec();

        // Create a Set to store unique friendIds
        const uniqueFriendIds = new Set();

        friendList.forEach(friend => {
          if (friend.userId1._id.toString() !== foundUser._id.toString()) {
            uniqueFriendIds.add(friend.userId1._id.toString());
          }

          if (friend.userId2._id.toString() !== foundUser._id.toString()) {
            uniqueFriendIds.add(friend.userId2._id.toString());
          }
        });

        // Add userId of the foundUser to the uniqueFriendIds Set
        uniqueFriendIds.add(foundUser._id.toString());

        // Create a new Set to store unique friendIds from shareList
        const uniqueShareList = new Set();

        // Add friendIds from shareList to the uniqueShareList Set
        if (Array.isArray(shareList)) {
          shareList.forEach(friendId => {
            if (friendId.toString() !== foundUser._id.toString()) {
              uniqueShareList.add(friendId.toString());
            }
          });
        }

        // Merge uniqueFriendIds and uniqueShareList to create the final shareList
        newShareList = Array.from(new Set([...uniqueFriendIds, ...uniqueShareList]));
        break;

      case 'onlyme':
        newShareList = [foundUser._id.toString()];
        break;

      case 'public':
        newShareList = [];
        break;

      default:
        newShareList = null;
        break;
    }

    // Check if shareList contains duplicate userId
    if (Array.isArray(shareList)) {
      const uniqueShareList = Array.from(new Set(shareList.map(friendId => friendId.toString())));

      if (uniqueShareList.length !== shareList.length) {
        return res.status(400).json({ message: 'Duplicate userIds found in shareList' });
      }
    }

    // Cập nhật thông tin album
    existingAlbum.shareStatus = shareStatus;
    existingAlbum.shareList = newShareList;
    existingAlbum.title = title;
    existingAlbum.description = description;
    existingAlbum.lastUpdateAt = new Date();

    // Lưu thay đổi vào database
    const updatedAlbum = await existingAlbum.save();

    return res.status(200).json({
      message: 'Album updated',
      album: updatedAlbum,
    });
  }),

  deleteAlbum: asyncWrapper(async (req, res) => {
    const albumId = req.params.id.trim();
    const foundUser = req.userInfo;

    // Kiểm tra xem album có tồn tại trong database không
    const existingAlbum = await Albums.findOne({ _id: albumId });

    if (!existingAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Kiểm tra quyền truy cập của người dùng
    if (existingAlbum.userId.toString() !== foundUser._id.toString()) {
      return res.status(401).json({ message: 'You are not authorized to delete this albums' });
    }

    // Xóa album khỏi database
    await Albums.findByIdAndDelete(existingAlbum._id);
    await AlbumsPage.deleteMany({ albumId: albumId });

    return res.status(200).json({
      message: 'Albums deleted',
    });
  }),

  getAlbumsUser: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const { page, userId } = req.query;
    const searchUserId = new mongoose.Types.ObjectId(userId || req.userInfo._id);

    const result = await Albums.aggregate(
      [].concat(
        { $match: { userId: searchUserId } },
        { $sort: { lastUpdateAt: -1, createdAt: -1 } },
        addTotalPageFields({ page }),
        {
          $lookup: { from: 'albumspages', localField: '_id', foreignField: 'albumId', as: 'cover' },
        },
        { $addFields: { cover: { $first: '$cover.resource.resourceId' } } },
        { $lookup: { from: 'resources', localField: 'cover', foreignField: '_id', as: 'cover' } },
        { $addFields: { cover: { $first: '$cover.path' } } },
        facet({ meta: ['total', 'page', 'pages'], data: ['title', 'createdAt', 'lastUpdateAt', 'cover', 'vacationId'] })
      )
    );

    return res.length == 0 ? res.sendStatus(204) : res.status(200).json(result[0]);

    // // const page = req.query.page ? parseInt(req.query.page) : 1; // Current page from the request
    // const itemPerPage = 10; // Number of items per page
    // const skip = (page - 1) * itemPerPage;
    // // Retrieve the albums associated with the user ID
    // if (userIds && userId) {
    //   const albums = await Albums.find({ userId: userIds })
    //     .skip(skip)
    //     .limit(itemPerPage)
    //     .lookup({ from: 'albumspages', localField: '_id', foreignField: 'albumId', as: 'image' });

    //   const albumList = albums.map(album => album.toObject()); // Convert each album to a plain JavaScript object
    //   // Count the total number of albums
    //   const totalAlbums = await Albums.countDocuments({ userId: userIds });
    //   // Return the list of albums
    //   res.json({
    //     message: 'get infor albums sucsses',
    //     meta: {
    //       total: totalAlbums,
    //       page: page,
    //       pages: Math.ceil(totalAlbums / itemPerPage),
    //     },
    //     data: albumList,
    //   });
    // } else if (userId) {
    //   const albums = await Albums.find({ userId }).skip(skip).limit(itemPerPage);

    //   const albumList = albums.map(album => album.toObject()); // Convert each album to a plain JavaScript object
    //   // Count the total number of albums
    //   const totalAlbums = await Albums.countDocuments({ userId });
    //   // Return the list of albums
    //   res.json({
    //     message: 'get infor albums sucsses',
    //     meta: {
    //       total: totalAlbums,
    //       page: page,
    //       pages: Math.ceil(totalAlbums / itemPerPage),
    //     },
    //     data: albumList,
    //   });
    // } else _throw({ code: 400, message: 'UserID not provided' });
  }),
  getablumsvacations: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const vacationId = req.params.id;
    const userId = req.userInfo._id;

    // Retrieve the albums associated with the user ID
    const album = await Albums.findOne({ vacationId: vacationId });
    if (!album.shareList.includes(userId) && album.userId.toString() !== userId) {
      return res.status(403).json({
        message: 'Người dùng không có quyền xem album',
      });
    }

    // Count the total number of albums
    const totalAlbums = album.length;
    // Return the list of albums
    res.json({
      message: 'get infor albums sucsses',
      totalAlbums: totalAlbums,
      data: album,
    });
  }),

  getalbumdetail: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const albumId = req.params.id;
    const userId = req.userInfo._id;
    const album = await Albums.findOne({ albumId: albumId });
    if (!album.shareList.includes(userId) && album.userId.toString() !== userId) {
      return res.status(403).json({
        message: 'Người dùng không có quyền xem album',
      });
    } else if (album.shareList.includes(userId) || album.userId.toString() == userId) {
    }

    // Retrieve the albums associated with the user ID
    const albums = await Albums.findById(id);

    // Return the list of albums
    res.json({
      message: 'get infor albums sucsses',
      data: albums,
    });
  }),
  addNewAlbumPage: asyncWrapper(async (req, res) => {
    // Get vital information from req.body
    const { albumId, imageId, ref, vacationId } = req.body;

    try {
      // Find the album using the albumId
      const album = await Albums.findById(albumId);

      // Check if the album exists
      if (!album) {
        return res.status(404).json({ message: 'Album not found' });
      }

      // Check if the user has permission to add images to the album
      const foundUser = req.userInfo;
      const userIds = [...vacationId.shareList, vacationId.userId, vacationId.memberList].map(value => value.toString());
      if (!userIds.includes(foundUser._id.toString())) {
        return res.status(403).json({ message: 'You are not allowed to add images to this album' });
      }

      // Update the ref property of the image with the new ref
      const updatedImage = album.images.find(image => image._id.toString() === imageId.toString());
      if (updatedImage) {
        updatedImage.ref = ref;
      } else {
        return res.status(404).json({ message: 'Image not found in the album' });
      }

      // Save the updated album
      await album.save();

      // Return the updated album as a response
      return res.status(200).json({ album });
    } catch (error) {
      return _throw(error);
    }
  }),
};
export default albumsController;
