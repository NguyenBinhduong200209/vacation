import express from 'express';
import authController from '#root/controller/user/auth';
import verifyJWT from '#root/middleware/verifyJWT';
import upload from '#root/middleware/upload';
import usersController from '#root/controller/user/userinfo';
import resourceController from '#root/controller/resource';
import checkAuthor from '#root/middleware/checkAuthor';

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

router.route('/avatar/:id').post(upload.single('avatar'), resourceController.addNew);
// .delete(checkAuthor('avatar'), authController.removeAvatar);

export default router;
