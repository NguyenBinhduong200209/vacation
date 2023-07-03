import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import fs from 'fs';
import { resourcePath } from '#root/config/path';
import path from 'path';
import getFileUpload from '#root/middleware/uploadFiles/getFileUpload';
import upload from '#root/middleware/uploadFiles/upload';
import Resources from '#root/model/resource';
import Vacations from '#root/model/vacation/vacations';
import Posts from '#root/model/vacation/posts';
import verifyJWT from '#root/middleware/verifyJWT';

const monitor = asyncWrapper(async (req, res) => {
  const { id } = req.query;
  console.log(resourcePath);
  const files = await fs.promises.readdir(id ? path.join(resourcePath, id) : resourcePath);
  return res.status(200).json(files);
});

const test = asyncWrapper(async (req, res) => {
  const { quantity } = req.query;
  const { originalname, mimetype, size } = req.file;
  const url = req.url;

  const foundVacations = await Vacations.aggregate([
    {
      $lookup: {
        from: 'resources',
        let: { vacationId: { $toObjectId: '$_id' } },
        pipeline: [
          {
            $match: {
              $expr: { $in: ['$$vacationId', '$ref._id'] },
              ref: { $elemMatch: { model: 'vacations', field: 'cover' } },
            },
          },
          { $sort: { createdAt: -1 } },
        ],
        as: 'cover',
      },
    },
    { $match: { cover: [] } },
  ]);

  for (let index = 0; index < foundVacations.length; index++) {
    const foundVacation = foundVacations[index];

    const foundCover = await Resources.findOne({
      userId: foundVacation.userId,
      'ref.field': 'cover',
      _id: foundVacation._id,
    });

    //Create new Resource document
    !foundCover &&
      (await Resources.create({
        name: originalname,
        type: mimetype,
        size: size,
        path: url[0],
        userId: foundVacation.userId,
        ref: [{ model: 'vacations', field: 'cover', _id: foundVacation._id }],
      }));
  }
  return res.status(200).json('done');
});

const clean = asyncWrapper(async (req, res) => {
  const deleteAll = await Resources.deleteMany();
  return res.status(200).json(deleteAll);
});

// router.route('/').get(monitor).post(getFileUpload.single('cover'), upload, test).delete(clean);

router.use(verifyJWT);
// router.get('/', getFileUpload.single('avatar'), upload);

export default router;
