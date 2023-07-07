import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import AlbumsPage from '#root/model/albumspage';
import Albums from '#root/model/albums';
import Vacations from '#root/model/vacation/vacations';
import Posts from '#root/model/vacation/posts';
import mongoose from 'mongoose';

const albumspagesController = {
  newalbums: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const userId = req.userInfo._id;
    console.log(userId);
    const { albumId, resource, vacationId } = req.body;
    console.log(resource);

    const existingAlbum = await AlbumsPage.findOne({
      albumsId: albumId,
      userId: userId,
      vacationId: vacationId,
    });

    if (existingAlbum) {
      // Người dùng đã tạo album trong vacation này rồi
      return res.status(400).json({ message: 'You can only create one album in this vacation' });
    }

    const vacation = await Vacations.findOne({
      _id: vacationId,
      $or: [{ memberList: userId }, { shareList: userId }],
    });

    if (!vacation) {
      // Người dùng không có quyền truy cập vào albums
      return res.status(403).json({ message: 'Access denied' });
    }

    const newAlbumPage = await AlbumsPage.create({
      albumsId: albumId,
      userId: userId,
      resource: resource,
      createdAt: new Date(),
    });

    res.json({
      message: 'AlbumPage created successfully',
      data: newAlbumPage,
    });
  }),

  getalbumspagesvacations: asyncWrapper(async (req, res) => {
    // Lấy user ID từ request
    const userId = req.userInfo._id;

    const vacationId = req.params.id;

    const vacation = await Vacations.findOne({
      _id: vacationId,
      $or: [{ memberList: userId }, { shareList: userId }],
    });

    if (!vacation) {
      // Người dùng không có quyền truy cập vào vacation
      return res.status(403).json({ message: 'Access denied' });
    }
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const itemPerPage = Number(process.env.ITEM_OF_PAGE); // Number of items per page
    const skip = (page - 1) * itemPerPage;

    const albumspage = await Posts.aggregate([
      { $match: { vacationId: new mongoose.Types.ObjectId(vacationId) } },
      {
        $lookup: {
          from: 'resources',
          let: { id: { $toObjectId: '$_id' } },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$$id', '$ref._id'] },
              },
            },
            { $project: { _id: 1, path: 1 } },
          ],
          as: 'resources',
        },
      },

      {
        $group: {
          _id: null,
          resources: { $push: '$resources' },
        },
      },
      {
        $project: {
          _id: 0,
          resources: { $reduce: { input: '$resources', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } },
        },
      },
      {
        $facet: {
          totalCount: [
            {
              $group: {
                _id: null,
                total: { $sum: { $size: '$resources' } },
              },
            },
            {
              $project: {
                _id: 0,
                total: 1,
              },
            },
          ],
          paginatedResults: [{ $skip: skip }, { $limit: itemPerPage }],
        },
      },
    ]);
    const totalCount = albumspage[0].totalCount[0].total;
    const data = albumspage[0].paginatedResults;
    const totalPages = Math.ceil(totalCount / itemPerPage);
    const currentPage = page > 0 ? page : 1;

    res.json({
      message: 'Get albumspages information success',
      meta: {
        page: totalPages,
        pages: currentPage,
        total: totalCount,
      },
      data: data,
    });
  }),
  getAlbumDetails: asyncWrapper(async (req, res) => {
    const albumId = req.params.id;

    try {
      const album = await AlbumsPage.findOne({ albumId: albumId });

      if (!album) {
        return res.status(404).json({ message: 'Album not found' });
      }

      res.json({
        message: 'Album details retrieved successfully',
        data: album,
      });
    } catch (error) {
      // Xử lý lỗi nếu có
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }),
};

export default albumspagesController;
