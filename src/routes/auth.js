import express from 'express';
import usersController from '#root/controller/auth';
import verifyJWT from '#root/middleware/verifyJWT';
import upload from '#root/middleware/upload';
import usersinforController from '#root/controller/userinfo';

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
  .get('/update', upload.single('avatar'), usersController.update)
  .get('/info', usersinforController.getprofile)
  .post('/logout', usersController.logOut);

export default router;
