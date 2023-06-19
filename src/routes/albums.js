import express from 'express';
import albumsController from '#root/controller/albums';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();
router.post('/newalbums', verifyJWT, albumsController.addNew);

export default router;
