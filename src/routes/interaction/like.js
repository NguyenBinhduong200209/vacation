import express from 'express';
import likeController from '#root/controller/interaction/likes';
import notiController from '#root/controller/interaction/notification';
import verifyJWT from '#root/middleware/verifyJWT';
const router = express.Router();

router.use(verifyJWT);
router.route('/:id').get(likeController.getMany).put(likeController.update, notiController.updateContent);

export default router;
