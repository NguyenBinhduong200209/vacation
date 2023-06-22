import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { __publicPath } from '#root/app';

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 100000);

    //Create folder if it does not exist
    const newFolder = path.join(__publicPath, 'resource', uniqueSuffix);
    !fs.existsSync(newFolder) && fs.mkdirSync(newFolder);

    //Config new destination
    callback(null, newFolder);
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

export default upload;
