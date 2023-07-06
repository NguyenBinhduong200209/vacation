import express from 'express';
import verifyJWT from '#root/middleware/verifyJWT';
import albumspagesController from '#root/controller/albumspages';

const router = express.Router();

router.post('/', verifyJWT, albumspagesController.newalbums);
router.get('/vacation/:id', verifyJWT, albumspagesController.getalbumspagesvacations);
router.get('/:id', verifyJWT, albumspagesController.getAlbumDetails);

export default router;
