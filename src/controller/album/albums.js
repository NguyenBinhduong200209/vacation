import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Friends from '#root/model/user/friend';
import Albums from '#root/model/album/albums';
import Vacations from '#root/model/vacation/vacations';
import AlbumsPage from '#root/model/album/albumspage';
import mongoose from 'mongoose';
import { addTotalPageFields, facet, getUserInfo } from '#root/config/pipeline';

const albumsController = {
  getAlbumsUser: asyncWrapper(async (req, res) => {
    const { userId, page } = req.query;
    const searchUserId = userId ? userId : req.userInfo._id;

    const result = await Albums.aggregate(
      [].concat(
        {
          $match: Object.assign(
            { userId: new mongoose.Types.ObjectId(searchUserId) },
            userId
              ? {
                  $or: [
                    { shareStatus: 'public' },
                    { shareStatus: 'protected', shareList: { $in: [userId] } },
                    { shareStatus: 'onlyme', userId: new mongoose.Types.ObjectId(userId) },
                  ],
                }
              : {}
          ),
        },
        addTotalPageFields({ page }),
        getUserInfo({ field: ['firstname', 'lastname', 'username', 'avatar'] }),
        { $addFields: { shareList: { $size: '$shareList' } } },
        facet({
          meta: ['total', 'page', 'pages'],
          data: ['authorInfo', 'title', 'lastUpdateAt', 'image', 'shareStatus', 'shareList'],
        })
      )
    );

    return res.json(result[0]);
  }),

  getAlbumDetail: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const albumId = req.params.id;

    const result = await Albums.aggregate(
      [].concat(
        { $match: { _id: new mongoose.Types.ObjectId(albumId) } },
        getUserInfo({ field: ['username', 'firstname', 'lastname', 'avatar'] }),
        { $addFields: { shareList: { $size: '$shareList' } } }
      )
    );

    // Return the list of albums
    res.json(result[0]);
  }),

  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { vacationId, title, shareStatus, shareList, lastUpdateAt } = req.body;

    //Get userId from verifyJWT middleware
    const foundUser = req.userInfo;

    //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
    let newShareList;
    switch (shareStatus) {
      case 'protected':
        // Get friend list of the user
        const friendList = await Friends.aggregate(
          [].concat(
            {
              $match: {
                $or: [
                  { userId1: foundUser._id, status: 'accepted' },
                  { userId2: foundUser._id, status: 'accepted' },
                ],
              },
            },
            {
              $addFields: {
                userInfo: { $cond: { if: { $eq: ['$userId1', foundUser._id] }, then: '$userId2', else: '$userId1' } },
              },
            },
            { $group: { _id: null, list: { $push: { $toString: '$userInfo' } } } }
          )
        );

        //Throw an error if one user in shareList is not author's friend
        for (const userId of shareList) {
          !friendList.list.includes(userId) &&
            _throw({ code: 400, message: 'all user in your shareList must be your friend' });
        }
        newShareList = [...new Set(shareList.concat(foundUser._id.toString()))];
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

    // Create new Vacation and run validation when creating
    const newAlbum = await Albums.create({
      vacationId,
      userId: foundUser._id,
      title,
      shareStatus,
      shareList: newShareList,
      createdAt: new Date(),
      lastUpdateAt: new Date(),
    });

    // Send response to the front-end
    return res.status(201).json({ data: newAlbum, message: 'Album created' });
  }),

  updateAlbum: asyncWrapper(async (req, res) => {
    const { title, description, shareStatus, shareList } = req.body;
    const { id } = req.params;
    const foundAlbum = req.doc;
    const foundUser = req.userInfo;

    let newShareList;
    switch (shareStatus) {
      case 'protected':
        const friendList = await Friends.aggregate(
          [].concat(
            {
              $match: {
                $or: [
                  { userId1: foundUser._id, status: 'accepted' },
                  { userId2: foundUser._id, status: 'accepted' },
                ],
              },
            },
            {
              $addFields: {
                userInfo: { $cond: { if: { $eq: ['$userId1', foundUser._id] }, then: '$userId2', else: '$userId1' } },
              },
            },
            { $group: { _id: null, list: { $push: { $toString: '$userInfo' } } } }
          )
        );

        //Throw an error if one user in shareList is not author's friend
        for (const userId of shareList) {
          !friendList.list.includes(userId) &&
            _throw({ code: 400, message: 'all user in your shareList must be your friend' });
        }
        newShareList = [...new Set(foundAlbum.concat(shareList, foundUser._id.toString()))];
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

    // Cập nhật thông tin album
    existingAlbum.shareStatus = shareStatus;
    existingAlbum.shareList = newShareList;
    existingAlbum.title = title;
    existingAlbum.description = description;
    existingAlbum.lastUpdateAt = new Date();

    // Lưu thay đổi vào database
    const updatedAlbum = await foundAlbum.save();

    return res.status(200).json({
      message: 'Album updated',
      data: updatedAlbum,
    });
  }),

  deleteAlbum: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    // Xóa album khỏi database
    await Albums.findByIdAndDelete(id);
    await AlbumsPage.deleteMany({ albumId: id });

    return res.status(200).json({
      message: 'Albums deleted',
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
