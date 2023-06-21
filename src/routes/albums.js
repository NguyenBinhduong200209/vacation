import express from 'express';
import albumsController from '#root/controller/albums';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();
router.post('/', verifyJWT, albumsController.addNew);
router.put('/', verifyJWT, albumsController.updateAlbum);
router.delete('/:id', verifyJWT, albumsController.deleteAlbum);
router.get('/', verifyJWT, albumsController.getablumsuser);
router.get('/:id', albumsController.getonealbum);
export default router;
