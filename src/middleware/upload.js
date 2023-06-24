import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { __publicPath } from '#root/app';
import _throw from '#root/utils/_throw';

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    //Throw an error if contentType of file upload is not in array
    const contentType = ['image/png', 'image/jpg', 'image/jpeg', 'video/mp4', 'video/mov'];
    !contentType.includes(file.mimetype) && callback({ code: 400, message: 'server does not support this type of file' });

    //Create folder if it does not exist
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 100000);
    const newFolder = path.join(__publicPath, 'resource', uniqueSuffix);
    !fs.existsSync(newFolder) && fs.mkdirSync(newFolder);

    //Config new destination
    callback(null, newFolder);
  },

  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const maxSize = 7 * 1000 * 1000;
const upload = multer({ storage: storage, limits: { fileSize: maxSize } });

export default upload;
