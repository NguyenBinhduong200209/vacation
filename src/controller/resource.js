import Resources from '#root/model/resource';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';

const resourceController = {
  getMany: asyncWrapper(async (req, res) => {}),
  addNew: asyncWrapper(async (req, res) => {
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
      const newResource = await Resources.create({
        name: originalname,
        type: mimetype,
        size: size,
        path: newPath,
        userId: req.userInfo._id,
        ref: [{ model: model, field: fieldname, _id: foundUser._id }],
      });
      return res.status(201).json({ data: newResource, message: 'add successfully' });
    }
  }),

  delete: asyncWrapper(async (req, res) => {
    //Get document from previous middleware
    const foundAvatar = req.doc;

    //Config path and delete files
    const path = path.join(resourcePath, foundAvatar.path);
    fs.unlinkSync(path);

    //Send to front
    return res.status(200).json({ message: 'delete successfully' });
  }),
};

export default resourceController;
