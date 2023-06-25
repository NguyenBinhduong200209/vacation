import express from 'express';
import commentController from '#root/controller/interaction/comments';
import notiController from '#root/controller/interaction/notification';
import verifyJWT from '#root/middleware/verifyJWT';
const router = express.Router();

router.use(verifyJWT);
router
  .route('/:id')
  .get(commentController.getMany)
  .post(commentController.addNew, notiController.updateContent)
  .put(commentController.update)
  .delete(commentController.delete);

export default router;
