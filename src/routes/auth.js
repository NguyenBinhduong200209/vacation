import express from 'express';
import usersController from '#root/controller/auth';
import verifyJWT from '#root/middleware/verifyJWT';
import upload from '#root/middleware/upload';

const router = express.Router();

router
  .post('/login', usersController.logIn)
  .post('/logout', verifyJWT, usersController.logOut)
  .post('/register', usersController.register)
  .post('/refresh', usersController.refresh)
  .get('/update', verifyJWT, upload.single('avatar'), usersController.update)
  .post('/forgot/:email', usersController.forgot)
  .put('/reset', usersController.reset);

export default router;
