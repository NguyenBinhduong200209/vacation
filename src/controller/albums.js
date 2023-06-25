import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/user/friend';
import Albums from '#root/model/albums';
import Vacations from '#root/model/vacation/vacations';

const albumsController = {
  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { vacationId, title, shareStatus, shareList, lastUpdateAt } = req.body;
    //Get userId from verifyJWT middleware
    const foundUser = req.userInfo;
    // Get vacation information from vacationId
    const vacation = await Vacations.findById(vacationId);

    // Check if the foundUser is in the memberList or is the creator of the vacation
    if (![...vacation.memberList, vacation.userId].includes(foundUser._id.toString())) {
      return res.status(403).json({ message: 'You are not allowed to create an album for this vacation' });
    }

    //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
    let newShareList;

    switch (shareStatus) {
      case 'protected':
        // Get friend list of the user
        const friendList = await Friends.find({
          $or: [{ userId1: foundUser._id }, { userId2: foundUser._id }],
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
      lastUpdateAt,
    });

    // Send response to the front-end
    return res.status(201).json({ data: newAlbum, message: 'Album created' });
  }),
  updateAlbum: asyncWrapper(async (req, res) => {
    const { title, description, shareStatus, shareList } = req.body;
    const { albumId } = req.params;
    console.log(albumId);
    const foundUser = req.userInfo;

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
          $or: [{ userId1: foundUser._id }, { userId2: foundUser._id }],
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
    const { albumId } = req.params;
    console.log(albumId);
    const foundUser = req.userInfo;
    // Kiểm tra xem album có tồn tại trong database không
    const existingAlbum = await Albums.findOne(albumId);
    console.log(existingAlbum);

    if (!existingAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Kiểm tra quyền truy cập của người dùng
    if (existingAlbum.userId.toString() !== foundUser._id.toString()) {
      return res.status(401).json({ message: 'You are not authorized to delete this albums' });
    }

    // Xóa album khỏi database
    await Albums.findByIdAndDelete(existingAlbum._id);

    return res.status(200).json({
      message: 'Albums deleted',
    });
  }),
  getablumsuser: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const userId = req.userInfo._id;

    // Retrieve the albums associated with the user ID
    const albums = await Albums.find({ userId });
    const albumList = albums.map(album => album.toObject()); // Convert each album to a plain JavaScript object
    // Count the total number of albums
    const totalAlbums = albums.length;
    // Return the list of albums
    res.json({
      message: 'get infor albums sucsses',
      totalAlbums: totalAlbums,
      data: albumList,
    });
  }),
  getablumsfriend: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const userId = req.params;

    // Retrieve the albums associated with the user ID
    const albums = await Albums.find(userId);
    const albumList = albums.map(album => album.toObject()); // Convert each album to a plain JavaScript object
    // Count the total number of albums
    const totalAlbums = albums.length;
    // Return the list of albums
    res.json({
      message: 'get infor albums sucsses',
      totalAlbums: totalAlbums,
      data: albumList,
    });
  }),

  getonealbum: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const { id } = req.params;

    // Retrieve the albums associated with the user ID
    const albums = await Albums.findById(id);

    // Return the list of albums
    res.json({
      message: 'get infor albums sucsses',
      data: albums,
    });
  }),
};
export default albumsController;
