import multer from 'multer';
import _throw from '#root/utils/_throw';
import Resources from '#root/model/resource';

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage: storage,
  limits: { fileSize: 7 * 1000 * 1000 },
  fileFilter: async (req, file, callback) => {
    const { fieldname, originalname, mimetype, size } = file;

    const contentType = /(avatar|cover)/i.test(fieldname)
      ? ['image/png', 'image/jpg', 'image/jpeg']
      : fieldname === 'posts'
      ? ['image/png', 'image/jpg', 'image/jpeg', 'video/mp4', 'video/mov']
      : undefined;

    //Throw error if contentType did not include mimeType
    !contentType && callback({ code: 400, message: `server did not support upload for field ${fieldname}` });
    !contentType.includes(mimetype) && callback({ code: 400, message: 'server does not support this type of file' });

    const newResource = new Resources({
      name: originalname,
      type: mimetype,
      size: size,
      path: 'path',
      userId: req.userInfo._id,
      ref: [],
    });
    await newResource.validate();

    callback(null, true);
  },

  //Next Error if error occur
  onError: function (err, next) {
    next(err);
  },
});

const getFileUpload = async (req, res, next) => {
  const { field } = req.params;
  field === 'posts' ? multerUpload.array(field)(req, res, next) : multerUpload.single(field)(req, res, next);
};

export default getFileUpload;
