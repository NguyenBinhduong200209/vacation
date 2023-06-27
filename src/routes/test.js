import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import fs from 'fs';
import path from 'path';
import { resourcePath } from '#root/config/path';

const test = asyncWrapper(async (req, res) => {
  const files = await fs.promises.readdir(resourcePath);
  return res.json(files);
});

router.get('/', test);

export default router;
