import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import AlbumsPage from '#root/model/albumspage'; // Sửa đổi tên mô hình ở đây
import Albums from '#root/model/albums';
import Vacations from '#root/model/vacation/vacations';
import Posts from '#root/model/vacation/posts';

const albumspagesController = {
  getalbumpage: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const albumId = req.params.id;

    console.log(albumId);
    const albums = await AlbumsPage.findOne({ albumId: albumId });

    res.json({
      message: 'get infor albums success',
      data: albums,
    });
  }),
  getalbumspagesvacations: asyncWrapper(async (req, res) => {
    // Get the user ID from the request
    const userId = req.userInfo._id;
    console.log(userId);
    res.json({
      message: 'get infor albums success',
    });
  }),
};

export default albumspagesController;
