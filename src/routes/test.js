import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import Resources from '#root/model/resource/resource';

const updatePost = async (req, res) => {
  const result = await Resources.deleteMany({ ref: [] });
  return res.json(result);
};

router.get('/', updatePost);

export default router;
