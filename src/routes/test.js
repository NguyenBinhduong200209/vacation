import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import fs from 'fs';
import path from 'path';
import { __publicPath } from '#root/app';

const test2 = asyncWrapper(async (req, res) => {
  const files = await fs.readdirSync(path.join(__publicPath, 'resource'));
  return res.json(files);
});

router.get('/', test2);

export default router;
