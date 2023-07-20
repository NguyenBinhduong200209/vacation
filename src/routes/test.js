import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import Resources from '#root/model/resource/resource';
import Friends from '#root/model/user/friend';

const updatePost = async (req, res) => {
  const result = await Friends.updateMany({}, [{ $set: { lastUpdateAt: '$createdAt' } }]);

  res.json(result);
};

router.get('/', updatePost);

export default router;
