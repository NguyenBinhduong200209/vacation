import express from 'express';
import usersinforController from '#root/controller/user/userinfo';
import authController from '#root/controller/user/auth';
import checkAuthor from '#root/middleware/checkAuthor';

const router = express.Router();

router.get('/:id', usersinforController.getfriendprofile);
router.delete('/avatar/:id', checkAuthor('avatar'), authController.removeAvatar);

export default router;
