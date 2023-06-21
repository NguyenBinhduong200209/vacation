import express from 'express';
import postController from '#root/controller/vacation/post';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.use(verifyJWT);
router.route('/').post(postController.addNew).get(postController.getMany);
router.route('/:id').get(postController.getOne).put(postController.update).delete(postController.delete);

export default router;
