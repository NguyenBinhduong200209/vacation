import multer from 'multer';
import _throw from '#root/utils/_throw';
import Resources from '#root/model/resource/resource';

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage: storage,
  limits: { fileSize: 7 * 1000 * 1000 },
  fileFilter: async (req, file, callback) => {
    const { field } = req.query;

    //Destruturing file upload
    const { originalname, mimetype, size } = file;

    //Get contentType array based on value of field params
    const contentType = /(avatar|cover)/i.test(field)
      ? ['image/png', 'image/jpg', 'image/jpeg']
      : field === 'post'
      ? ['image/png', 'image/jpg', 'image/jpeg', 'video/mp4', 'video/mov']
      : undefined;

    //Throw an error if field params value is not one of those values avatar, cover and posts
    if (!contentType) return callback({ code: 400, message: `server did not support upload for field ${field}` });
    //Throw an error if mimetype of file upload did not in contentType config array
    else if (!contentType.includes(mimetype))
      return callback({ code: 400, message: 'server does not support this type of file' });
    //Validate data about to save in DB
    else {
      const newResource = new Resources({
        name: originalname,
        type: mimetype,
        size: size,
        path: 'path',
        userId: req.userInfo._id,
        ref: [],
      });
      await newResource.validate();
    }

    return callback(null, true);
  },

  //Next Error if error occur
  onError: function (err, next) {
    next(err);
  },
});

const getFileUpload = async (req, res, next) => {
  const { field } = req.query;
  field === 'post' ? multerUpload.array('file', 10)(req, res, next) : multerUpload.single('file')(req, res, next);
};

export default getFileUpload;
