import express from 'express';
import postController from '#root/controller/vacation/post';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkAuthor';
import checkPermission from '#root/middleware/checkPermission';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(checkPermission(), postController.getManyByVacation).post(postController.addNew);

router.route('/location').get(postController.getManyByLocation);
router
  .route('/:id')
  .get(checkPermission('post'), postController.getOne)
  .put(checkAuthor('post'), postController.update)
  .delete(checkAuthor('post'), postController.delete);

export default router;
