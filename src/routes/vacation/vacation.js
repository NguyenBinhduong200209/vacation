import express from 'express';
import vacationController from '#root/controller/vacation/vacation';
import resourceController from '#root/controller/resource';
import verifyJWT from '#root/middleware/verifyJWT';
import getFileUpload from '#root/middleware/getFileUpload';
import checkAuthor from '#root/middleware/checkAuthor';
import checkPermission from '#root/middleware/checkPermission';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(vacationController.getMany).post(vacationController.addNew);
router
  .route('/:id')
  .get(checkPermission('vacation'), vacationController.getOne)
  // .put(checkAuthor('vacation'), getFileUpload('cover'), resourceController.addNew, vacationController.update)
  .delete(checkAuthor('vacation'), vacationController.delete);

export default router;
