import express from 'express';
import usersinforController from '#root/controller/userinfo';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router
  .get('/', verifyJWT, usersinforController.getprofile)

  .get('/friends', usersinforController.getfriendprofile);

export default router;
