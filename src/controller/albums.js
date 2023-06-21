import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/friend';
import Albums from '#root/model/albums';

const albumsController = {
  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { vacationId, title, shareStatus, shareList, lastUpdateAt } = req.body;
    //Get userId from verifyJWT middleware
    const foundUser = req.userInfo;

    //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
    let newShareList;

    switch (shareStatus) {
      case 'protected':
        const friendList = await Friends.find({
          $or: [{ userId1: foundUser._id }, { userId2: foundUser._id }],
        })
          .populate('userId1', 'firstname lastname')
          .populate('userId2', 'firstname lastname')
          .exec();
        console.log(friendList);
        const filteredFriendList = friendList.map(friend => {
          if (friend.userId1._id.toString() === foundUser._id.toString()) {
            return friend.userId2._id; // Thay đổi thành friend.userId2._id
          } else {
            return friend.userId1._id; // Thay đổi thành friend.userId1._id
          }
        });
        newShareList = [...filteredFriendList, ...(shareList || [])]; // Thêm một mảng rỗng nếu shareList là null hoặc undefined
        break;
      case 'onlyme':
        newShareList = [foundUser._id];
        break;
      case 'public':
        newShareList = []; // hoặc có thể gán newShareList = newMemberList nếu muốn chia sẻ công khai với tất cả mọi người
        break;
      default:
        newShareList = null;
        break;
    }

    //Create new Vacation and run validation when creating
    const newAlbum = await Albums.create({
      vacationId,
      userId: foundUser._id,
      title,
      createdAt: new Date(),
      shareStatus,
      shareList: newShareList,
      lastUpdateAt,
    });

    //Send to front
    return res.status(201).json({ data: newAlbum, message: 'Alblums created' });
  }),
  updateAlbum: asyncWrapper(async (req, res) => {
    const { title, description, shareStatus, albumId } = req.body;
    const foundUser = req.userInfo;
    // console.log(foundUser);

    // Kiểm tra xem album có tồn tại trong database không
    const existingAlbum = await Albums.findOne(albumId);
    console.log(existingAlbum.userId);
    if (!existingAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }
    if (existingAlbum.userId.toString() !== foundUser._id.toString()) {
      return res.status(401).json({ message: 'You are not authorized to update this album' });
    }

    let updateShareList;

    switch (shareStatus) {
      case 'protected':
        const friendList = await Friends.find({
          $or: [{ userId1: foundUser }, { userId2: foundUser }],
        })
          .populate('userId1', 'firstname lastname')
          .populate('userId2', 'firstname lastname')
          .exec();
        const filteredFriendList = friendList.map(friend => {
          if (friend.userId1._id.toString() === foundUser.toString()) {
            return friend.userId2._id;
          } else {
            return friend.userId1._id;
          }
        });
        updateShareList = [...filteredFriendList];
        break;
      case 'onlyme':
        updateShareList = [foundUser];
        break;
      case 'public':
        updateShareList = [];
        break;
      default:
        updateShareList = null;
        break;
    }

    // Cập nhật thông tin album
    existingAlbum.shareStatus = shareStatus;
    existingAlbum.shareList = updateShareList;
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
    const foundUser = req.userInfo;
    // Kiểm tra xem album có tồn tại trong database không
    const existingAlbum = await Albums.findOne(albumId);

    if (!existingAlbum) {
      return res.status(404).json({ message: 'Album not found' });
    }

    // Kiểm tra quyền truy cập của người dùng
    if (existingAlbum.userId.toString() !== foundUser._id.toString()) {
      return res.status(401).json({ message: 'You are not authorized to update this albums' });
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
    // Return the list of albums
    res.json({
      message: 'get infor albums sucsses',
      data: albumList,
    });
  }),
  getonealbum: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const { id } = req.params;

    // Retrieve the albums associated with the user ID
    const albums = await Albums.findById({ id });

    // Return the list of albums
    res.json({
      message: 'get infor albums sucsses',
      data: albums,
    });
  }),
};
export default albumsController;
