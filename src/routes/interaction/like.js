import express from 'express';
import likeController from '#root/controller/interaction/likes';
import verifyJWT from '#root/middleware/verifyJWT';
const router = express.Router();

router.use(verifyJWT);
router.route('/:id').get(likeController.getMany).put(likeController.update);

export default router;
