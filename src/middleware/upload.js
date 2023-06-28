import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { resourcePath } from '#root/config/path';
import _throw from '#root/utils/_throw';

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    //Create random unique Suffix
    const maxLength = 6;
    const ranNumber = Math.round(Math.random() * (Math.pow(10, maxLength) - 1));
    const uniqueSuffix = Date.now() + '-' + String(ranNumber).padStart(6, '0');

    console.log(resourcePath);

    //Create folder if it does not exist
    const newFolder = path.join(resourcePath, uniqueSuffix);
    !fs.existsSync(newFolder) && fs.mkdirSync(newFolder);

    //Config new destination
    callback(null, newFolder);
  },

  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 7 * 1000 * 1000, fieldNameSize: 50, fieldSize: 20000 },
  fileFilter: (req, file, callback) => {
    //fieldname is avatar or cover only support image contentType
    if (['avatar', 'cover'].includes(file.fieldname)) {
      const contentType = ['image/png', 'image/jpg', 'image/jpeg'];
      contentType.includes(file.mimetype)
        ? callback(null, true)
        : callback({ code: 400, message: 'server does not support this type of file' });
    }

    //field name is post only support image and video contentType
    else if (file.fieldname === 'post') {
      const contentType = ['image/png', 'image/jpg', 'image/jpeg', 'video/mp4', 'video/mov'];
      !contentType.includes(file.mimetype)
        ? callback(null, true)
        : callback({ code: 400, message: 'server does not support this type of file' });
    }

    //Throw an error due to invalid fieldname support
    else callback({ code: 400, message: `server did not support upload for field ${file.fieldname}` });
  },
  onError: function (err, next) {
    console.log('error', err);
    next(err);
  },
});

export default upload;
