import express from 'express';
import usersinforController from '#root/controller/user/userinfo';
import authController from '#root/controller/user/auth';
import checkAuthor from '#root/middleware/checkAuthor';

const router = express.Router();

router.delete('/avatar/:id', checkAuthor('avatar'), authController.removeAvatar);
router.get('/', usersinforController.getfriendprofile);

export default router;
