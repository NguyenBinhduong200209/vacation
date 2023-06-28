import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import fs from 'fs';
import { resourcePath } from '#root/config/path';
import path from 'path';
import upload from '#root/middleware/upload';
import Users from '#root/model/user/users';
import Resources from '#root/model/resource';

const monitor = asyncWrapper(async (req, res) => {
  // const { id } = req.query;
  const files = await fs.promises.readdir(path.join(resourcePath));
  return res.status(200).json(files);
});

const test = asyncWrapper(async (req, res) => {
  const { quantity } = req.query;
  const { destination, originalname, mimetype, size } = req.file;

  //Config path of file uploaded to server
  const newPath = destination.split(`/`).slice(-1)[0] + '/' + originalname;
  console.log(newPath);

  const foundUsers = await Users.find({});

  for (let index = 0; index < quantity; index++) {
    const randomNumber = Math.ceil(Math.random() * (foundUsers.length - 1));
    const foundUser = foundUsers[randomNumber];

    const foundAvatar = await Resources.findOne({ userId: foundUser._id });
    //Create new Resource document
    !foundAvatar &&
      (await Resources.create({
        name: originalname,
        type: mimetype,
        size: size,
        path: newPath,
        userId: foundUser._id,
        ref: [{ model: 'users', field: 'avatar', _id: foundUser._id }],
      }));
  }
  return res.status(200).json('Done');
});

const clean = asyncWrapper(async (req, res) => {
  const deleteAll = await Resources.deleteMany();
  return res.status(200).json(deleteAll);
});

router.route('/').get(monitor).post(upload.single('avatar'), test).delete(clean);

export default router;
