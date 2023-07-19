import express from 'express';
import friendsController from '#root/controller/user/friend';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router
  .post('/', verifyJWT, friendsController.addFriend)
  .put('/', verifyJWT, friendsController.acceptFriend)
  .get('/', verifyJWT, friendsController.getFriendList)
  .get('/resfriend', verifyJWT, friendsController.getResquestFriendList)
  .delete('/:friendId', verifyJWT, friendsController.removeFriend);

export default router;
