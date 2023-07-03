import express from 'express';
import resourceController from '#root/controller/resource';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
import upload from '#root/middleware/uploadFiles/upload';
import getFileUpload from '#root/middleware/uploadFiles/getFileUpload';

const router = express.Router();

router.use(verifyJWT);

router.route('/').get(checkPermission(), resourceController.getMany);
//   .delete(checkAuthor('resource'), resourceController.deleteMany);

router.route('/:type/:id?').post(checkAuthor(), getFileUpload, upload, resourceController.addNewOne);

router.route('/:id').delete(checkAuthor('resource'), resourceController.deleteOne);

export default router;
