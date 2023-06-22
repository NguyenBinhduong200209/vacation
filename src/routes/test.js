import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import Users from '#root/model/user/users';

const test2 = asyncWrapper(async (req, res) => {
  const userId = '648692a56746401d9690a02c';
  const foundUsers = await Users.find();

  for (let index = 0; index < foundUsers.length; index++) {
    const user = foundUsers[index];
    user.avatar = `https://picsum.photos/id/${index + 110}/200/300`;
    await user.save();
  }

  return res.json(foundUsers);
});

router.get('/', test2);

export default router;
