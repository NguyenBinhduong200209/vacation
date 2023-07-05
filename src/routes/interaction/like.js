import express from 'express';
import likeController from '#root/controller/interaction/likes';
import notiController from '#root/controller/interaction/notification';
import verifyJWT from '#root/middleware/verifyJWT';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
const router = express.Router();

router.use(verifyJWT);
router
  .route('/:id')
  .get(likeController.getMany)
  .put(checkPermission({ listType: 'shareList' }), likeController.update);

export default router;
