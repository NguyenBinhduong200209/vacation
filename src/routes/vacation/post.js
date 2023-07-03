import express from 'express';
import postController from '#root/controller/vacation/post';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';

const router = express.Router();

router.use(verifyJWT);
router.route('/').post(postController.addNew);

router.route('/vacation/:id').get(checkPermission('vacation'), postController.getManyByVacation);
router.route('/location/:id').get(postController.getManyByLocation);

router
  .route('/:id')
  .get(checkPermission('post'), postController.getOne)
  .put(checkAuthor('post'), postController.update)
  .delete(checkAuthor('post'), postController.delete);

export default router;
