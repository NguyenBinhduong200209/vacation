import express from 'express';
import albumsController from '#root/controller/albums';
import verifyJWT from '#root/middleware/verifyJWT';
import albumspagesController from '#root/controller/albumspages';

const router = express.Router();
router.post('/', verifyJWT, albumsController.addNew);
router.put('/:id', verifyJWT, albumsController.updateAlbum);
router.delete('/:id', verifyJWT, albumsController.deleteAlbum);
router.get('/:id?', verifyJWT, albumsController.getAlbumsUser);
router.get('/vacation/:id', verifyJWT, albumsController.getablumsvacations);
// router.get('/albumspages/:id', albumspagesController.getalbumpage);
router.get('/albumspages/:id?', verifyJWT, albumspagesController.getalbumspagesvacations);

export default router;
