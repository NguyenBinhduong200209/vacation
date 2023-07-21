import express from 'express';
import albumsController from '#root/controller/album/albums';
import verifyJWT from '#root/middleware/verifyJWT';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';

const router = express.Router();
router.use(verifyJWT);

router
  .route('/')
  .post(checkPermission({ modelType: 'vacations', listType: 'memberList' }), albumsController.addNew)
  .get(albumsController.getAlbumsUser);

router
  .route('/:id')
  .get(checkPermission({ modelType: 'albums', listType: 'shareList' }), albumsController.getAlbumDetail)
  .put(checkAuthor({ modelType: 'albums' }), albumsController.updateAlbum)
  .delete(checkAuthor({ modelType: 'albums' }), albumsController.deleteAlbum);

export default router;
