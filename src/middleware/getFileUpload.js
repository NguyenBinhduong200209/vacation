import multer from 'multer';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';

const storage = multer.memoryStorage();

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

const getFileUpload = {
  single: field => upload.single(field),
  multiple: () => upload.array('post'),
};

export default getFileUpload;
