import express from 'express';
import usersinforController from '#root/controller/userinfo';

const router = express.Router();

router.get('/:id', usersinforController.getfriendprofile);

export default router;
