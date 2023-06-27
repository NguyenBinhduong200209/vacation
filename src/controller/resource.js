import Resources from '#root/model/resource';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';

const resourceController = {
  getMany: asyncWrapper(async (req, res) => {}),
  addNew: asyncWrapper(async (req, res, next) => {
    if (req.file) {
      const { fieldname, destination, originalname, mimetype, size } = req.file;

      let model;
      switch (fieldname) {
        case 'avatar':
          model = 'users';
          break;

        case 'cover':
          model = 'vacations';
          break;

        case 'post':
          model = 'posts';
          break;

        default:
          model = 'albums';
          break;
      }

      //Config path of file uploaded to server
      const newPath = destination.split(`/`).slice(-1)[0] + '/' + originalname;

      console.log(newPath);

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
    next();
  }),
};

export default resourceController;
