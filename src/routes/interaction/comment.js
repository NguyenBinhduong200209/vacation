import express from 'express';
import commentController from '#root/controller/interaction/comments';
import verifyJWT from '#root/middleware/verifyJWT';
const router = express.Router();

router.use(verifyJWT);
router.route('/').post(commentController.addNew);
router
  .route('/:id')
  .get(commentController.getMany)
  .put(commentController.update)
  .delete(commentController.delete);

export default router;
