import express from 'express';
import resourceController from '#root/controller/resource';
import verifyJWT from '#root/middleware/verifyJWT';
import upload from '#root/middleware/upload';
import checkAuthor from '#root/middleware/checkAuthor';

const router = express.Router();

router.use(verifyJWT);

router.route('/').post(upload.single('avatar'), resourceController.addNew);

router.route('/:id').get(resourceController.getOne).delete(checkAuthor('resource'), resourceController.delete);

export default router;
