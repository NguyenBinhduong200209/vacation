import express from 'express';
import authController from '#root/controller/user/auth';
import verifyJWT from '#root/middleware/verifyJWT';
import usersController from '#root/controller/user/userinfo';
import upload from '#root/middleware/uploadFiles/upload';
import getFileUpload from '#root/middleware/uploadFiles/getFileUpload';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import resourceController from '#root/controller/resource';

const router = express.Router();

router
  .post('/login', authController.logIn)
  .post('/register', authController.register)
  .post('/verify', authController.verify)
  .post('/refresh', authController.refresh)
  .post('/forgot/:email', authController.forgot)
  .put('/reset', authController.reset);

router.use(verifyJWT);
router.put('/update', authController.update).get('/info', usersController.getprofile).post('/logout', authController.logOut);

router.post('/avatar', getFileUpload.single('avatar'), upload, resourceController.addNewOne);

export default router;
