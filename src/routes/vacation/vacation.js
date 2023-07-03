import express from 'express';
import vacationController from '#root/controller/vacation/vacation';
import resourceController from '#root/controller/resource';
import verifyJWT from '#root/middleware/verifyJWT';
import getFileUpload from '#root/middleware/uploadFiles/getFileUpload';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
import upload from '#root/middleware/uploadFiles/upload';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(vacationController.getMany).post(vacationController.addNew);

router
  .route('/cover/:id')
  .post(checkAuthor('vacation'), getFileUpload.single('cover'), upload, resourceController.addNewOne);

router
  .route('/:id')
  .get(checkPermission('vacation'), vacationController.getOne)
  .put(checkAuthor('vacation'), getFileUpload.single(), vacationController.update)
  .delete(checkAuthor('vacation'), vacationController.delete);

export default router;
