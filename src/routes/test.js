import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';

const test2 = asyncWrapper(async (req, res) => {
  return res.json(foundUsers);
});

router.get('/', test2);

export default router;
