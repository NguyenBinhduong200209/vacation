import express from 'express';
import usersController from '#root/controller/auth';
import verifyJWT from '#root/middleware/verifyJWT';
<<<<<<< HEAD
import upload from '#root/middleware/upload';
=======
import usersinforController from '#root/controller/userinfo';
>>>>>>> 0bdcae46f928b3f0fdef45a13162a137767f30f7

const router = express.Router();

router
  .post('/login', usersController.logIn)
  .post('/logout', verifyJWT, usersController.logOut)
  .post('/register', usersController.register)
  .post('/refresh', usersController.refresh)
  .get('/update', verifyJWT, upload.single('avatar'), usersController.update)
  .post('/forgot/:email', usersController.forgot)
  .put('/reset', usersController.reset)
  .get('/info', verifyJWT, usersinforController.getprofile);

export default router;
