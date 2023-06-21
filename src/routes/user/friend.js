import express from 'express';
import friendsController from '#root/controller/user/friend';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router
  .post('/', verifyJWT, friendsController.addFriend)
  .get('/', verifyJWT, friendsController.getFriendList)
  .delete('/:id', verifyJWT, friendsController.removeFriend);

export default router;
