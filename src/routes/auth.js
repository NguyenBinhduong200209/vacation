import express from 'express';
import usersController from '#root/controller/auth';
import verifyJWT from '#root/middleware/verifyJWT';
import usersinforController from '#root/controller/userinfo';

const router = express.Router();

router
  .post('/login', usersController.logIn)
  .post('/logout', verifyJWT, usersController.logOut)
  .post('/register', usersController.register)
  .post('/refresh', usersController.refresh)
  .put('/update', verifyJWT, usersController.update)
  .post('/forgot/:email', usersController.forgot)
  .put('/reset', usersController.reset)
  .get('/info', verifyJWT, usersinforController.getprofile);

export default router;
