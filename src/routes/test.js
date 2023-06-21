import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';

const test2 = asyncWrapper(async (req, res) => {
  const userId = '648692a56746401d9690a02c';

  return res.json(result);
});

router.get('/:id', test2);

export default router;
