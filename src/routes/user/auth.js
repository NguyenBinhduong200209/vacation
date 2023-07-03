import express from 'express';
import usersController from '#root/controller/user/auth';
import verifyJWT from '#root/middleware/verifyJWT';
import upload from '#root/middleware/upload';
import usersinforController from '#root/controller/user/userinfo';

const router = express.Router();

router
  .post('/login', usersController.logIn)
  .post('/register', usersController.register)
  .post('/verify', usersController.verify)
  .post('/refresh', usersController.refresh)
  .post('/forgot/:email', usersController.forgot)
  .put('/reset', usersController.reset);

router.use(verifyJWT);
router
  .put('/update', upload.single('avatar'), usersController.update)
  .get('/info/:id?', usersinforController.getprofile)
  .post('/logout', usersController.logOut);

export default router;
