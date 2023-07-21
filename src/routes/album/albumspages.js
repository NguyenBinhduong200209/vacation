import express from 'express';
import verifyJWT from '#root/middleware/verifyJWT';
import albumspagesController from '#root/controller/album/albumspages';

const router = express.Router();

router.post('/', verifyJWT, albumspagesController.newalbums);
router.put('/:id', verifyJWT, albumspagesController.updatealbumspage);
router.delete('/:id', verifyJWT, albumspagesController.deletealbumspage);

router.get('/:id', verifyJWT, albumspagesController.getmanyAlbumPage);

export default router;
