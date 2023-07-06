import express from 'express';
import usersinforController from '#root/controller/user/userinfo';

const router = express.Router();

router.get('/:id?', usersinforController.getfriendprofile);

export default router;
