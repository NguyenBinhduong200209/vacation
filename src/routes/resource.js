import express from 'express';
import resourceController from '#root/controller/resource';
import verifyJWT from '#root/middleware/verifyJWT';
import upload from '#root/middleware/uploadFiles/upload';
import getFileUpload from '#root/middleware/uploadFiles/getFileUpload';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';

const router = express.Router();

router.use(verifyJWT);

//Route post only use for upload new avatar user or cover of vacation
router.route('/').get(resourceController.getMany).post(getFileUpload.single('avatar'), upload, resourceController.addNewOne);
router
  .route('/vacation/:id')
  .post(checkAuthor('vacation'), getFileUpload.single('cover'), upload, resourceController.addNewOne);

router.route('/:id').delete(checkAuthor('resource'), resourceController.delete);

export default router;
