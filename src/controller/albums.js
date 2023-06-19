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
          .populate('userId1', 'firstname lastname ')
          .populate('userId2', 'firstname lastname ')
          .exec();
        const filteredFriendList = friendList.map(friend => {
          if (friend.userId1._id.toString() === foundUser._id.toString()) {
            return friend.userId2;
          } else {
            return friend.userId1;
          }
        });
        newShareList = [...filteredFriendList, ...shareList];
        break;
      case 'onlyme':
        newShareList = [userId];
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
    return res.status(201).json({ data: newAlbum, message: 'alblums created' });
  }),
  updateAlbum: asyncWrapper(async (req, res) => {
    try {
      const { albumId } = req.params;
      const { title, description } = req.body;

      // Kiểm tra xem album có tồn tại trong database không
      const existingAlbum = await Albums.findById(albumId);
      if (!existingAlbum) {
        return res.status(404).json({ message: 'Album not found' });
      }

      // Kiểm tra quyền truy cập của người dùng
      if (existingAlbum.userId.toString() !== req.userInfo._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Cập nhật thông tin album
      existingAlbum.title = title;
      existingAlbum.description = description;
      existingAlbum.lastUpdateAt = new Date();

      // Lưu thay đổi vào database
      const updatedAlbum = await existingAlbum.save();

      return res.status(200).json({
        success: true,
        message: 'Album updated',
        album: updatedAlbum,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }),
  deleteAlbum: asyncWrapper(async (req, res) => {
    try {
      const { albumId } = req.params;

      // Kiểm tra xem album có tồn tại trong database không
      const existingAlbum = await Albums.findById(albumId);
      if (!existingAlbum) {
        return res.status(404).json({ message: 'Album not found' });
      }

      // Kiểm tra quyền truy cập của người dùng
      if (existingAlbum.userId.toString() !== req.userInfo._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Xóa album khỏi database
      await existingAlbum.remove();

      return res.status(200).json({
        success: true,
        message: 'Album deleted',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }),
};
export default albumsController;
