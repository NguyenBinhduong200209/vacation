import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import Vacations from '#root/model/vacations';

const test = asyncWrapper(async (req, res) => {
  const result = await Vacations.find();
  for (let i = 0; i < result.length; i++) {
    const vacation = result[i];
    const newImage = `https://picsum.photos/id/${i + 100}/1000/500`;
    vacation.cover = newImage;
    await vacation.save();
  }
  return res.json('Done');
});

router.get('/', test);

export default router;
