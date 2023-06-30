import express from 'express';
import resourceController from '#root/controller/resource';
import verifyJWT from '#root/middleware/verifyJWT';
import getFileUpload from '#root/middleware/getFileUpload';
import checkAuthor from '#root/middleware/checkAuthor';
import upload from '#root/middleware/upload';

const router = express.Router();

router.use(verifyJWT);

router.route('/').get(resourceController.getMany).post(getFileUpload.single('avatar'), upload, resourceController.addNew);

router.route('/:id').delete(checkAuthor('resource'), resourceController.delete);

export default router;
