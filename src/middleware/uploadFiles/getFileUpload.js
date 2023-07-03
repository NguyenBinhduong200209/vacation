import multer from 'multer';
import _throw from '#root/utils/_throw';
import Resources from '#root/model/resource';

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage: storage,
  limits: { fileSize: 7 * 1000 * 1000 },
  fileFilter: async (req, file, callback) => {
    const { fieldname, originalname, mimetype, size } = file;

    //Validate before upload
    let contentType, newResource;
    switch (fieldname) {
      //In case user upload new avatar
      case 'avatar':
        contentType = ['image/png', 'image/jpg', 'image/jpeg'];
        newResource = new Resources({
          name: originalname,
          type: mimetype,
          size: size,
          path: 'path',
          userId: req.userInfo._id,
          ref: [{ model: 'users', _id: req.userInfo._id }],
        });
        break;

      //In case user upload new cover for vacation
      case 'cover':
        contentType = ['image/png', 'image/jpg', 'image/jpeg'];
        newResource = new Resources({
          name: originalname,
          type: mimetype,
          size: size,
          path: 'path',
          userId: req.doc.userId,
          ref: [{ model: 'vacations', _id: req.doc._id }],
        });
        break;

      //In case user upload new file for post
      case 'post':
        contentType = ['image/png', 'image/jpg', 'image/jpeg', 'video/mp4', 'video/mov'];
        newResource = new Resources({
          name: originalname,
          type: mimetype,
          size: size,
          path: 'path',
          userId: req.doc.userId,
          ref: [{ model: 'posts', _id: req.doc._id }],
        });
        break;

      default:
        callback({ code: 400, message: `server did not support upload for field ${fieldname}` });
        break;
    }
    await newResource.validate();

    //Throw error if contentType did not include mimeType
    !contentType.includes(mimetype) && callback({ code: 400, message: 'server does not support this type of file' });

    callback(null, true);
  },

  //Next Error if error occur
  onError: function (err, next) {
    next(err);
  },
});

const getFileUpload = async (req, res, next) => {
  const { type } = req.params;
  multerUpload.single(type)(req, res, next);
};

export default getFileUpload;
