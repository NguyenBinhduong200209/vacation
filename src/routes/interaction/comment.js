import express from 'express';
import commentController from '#root/controller/interaction/comments';
import notiController from '#root/controller/interaction/notification';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
const router = express.Router();

router.use(verifyJWT);
router
  .route('/:id')
  .get(commentController.getMany)
  .post(checkPermission({ listType: 'shareList' }), commentController.addNew, notiController.updateContent)
  .put(checkAuthor({ modelType: 'comments' }), commentController.update)
  .delete(checkAuthor({ modelType: 'comments' }), commentController.delete);

export default router;
