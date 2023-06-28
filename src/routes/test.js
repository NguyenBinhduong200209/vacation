import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import fs from 'fs';
import { resourcePath } from '#root/config/path';
import path from 'path';
import upload from '#root/middleware/upload';
import Users from '#root/model/user/users';

const monitor = asyncWrapper(async (req, res) => {
  const { id } = req.query;
  const files = await fs.promises.readdir(path.join(resourcePath, id || ''));
  return res.status(200).json(files);
});

const test = asyncWrapper(async (req, res) => {
  const { fieldname, destination, originalname, mimetype, size } = req.file;

  //Config path of file uploaded to server
  const newPath = destination.split(`/`).slice(-1)[0] + '/' + originalname;
  console.log(newPath);

  const foundUsers = await Users.find({});

  for (let index = 0; index < foundUsers.length; index++) {
    const randomNumber = Math.ceil(Math.random() * foundUsers.length);
    const foundUser = foundUsers[randomNumber];

    //Create new Resource document
    await Resources.create({
      name: originalname,
      type: mimetype,
      size: size,
      path: newPath,
      userId: foundUser._id,
      ref: [{ model: model, field: fieldname, _id: foundUser._id }],
    });
  }
});

router.get('/', upload.single('avatar'), test);

export default router;
