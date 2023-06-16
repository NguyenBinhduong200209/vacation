import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import Likes from '#root/model/likes';
import Comments from '#root/model/comments';

const test = asyncWrapper(async (req, res) => {
  const result = await Comments.updateMany({}, [
    { $addFields: { parentId: '$postId', level: 1 } },
    { $unset: 'postId' },
  ]);
  return res.json(result);
});

router.get('/', test);

export default router;
