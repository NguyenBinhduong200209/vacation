import Resources from '#root/model/resource';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';

const resourceController = {
  getOne: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const foundResource = await Resources.findById(id);
    !foundResource && _throw({ code: 404, errors: [{ field: 'id', message: 'not found' }], message: 'id not found' });

    return res.status(200).json({
      data: `https://vacation-backend.onrender.com/static/resource/${foundResource.path}`,
      message: 'get successfully',
    });
  }),

  addNew: asyncWrapper(async (req, res) => {
    const { id } = req.query;

    if (req.file) {
      const { fieldname, destination, originalname, mimetype, size } = req.file;

      let model;
      switch (fieldname) {
        case 'avatar':
          model = 'Users';
          break;

        case 'cover':
          model = 'Vacations';
          break;

        case 'post':
          model = 'Posts';
          break;

        default:
          model = 'Albums';
          break;
      }

      //Find document contain uploaded file
      const foundDoc = model === 'Users' ? req.userInfo : await mongoose.model(model).findById(id);

      //Config path of file uploaded to server
      const newPath = destination.split(`/`).slice(-1)[0] + '/' + originalname;
      console.log(newPath);

      //Create new Resource document
      const newResource = await Resources.create({
        name: originalname,
        type: mimetype,
        size: size,
        path: newPath,
        userId: foundDoc._id,
        ref: [{ model: model.toLowerCase(), field: fieldname, _id: foundDoc._id }],
      });

      //Send to front
      return res.status(201).json({ data: newResource, message: 'add successfully' });
    }
    //Throw an error if user did not upload any file
    else _throw({ code: 400, message: 'user did not upload any file' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Config path and delete file in server
    await fs.unlinkSync(path.join(resourcePath, req.doc.path));

    //Delete path in DB
    const deleteResource = await Resources.findByIdAndDelete(id);

    //Send to front
    return res.status(200).json({ data: deleteResource, message: 'delete successfully' });
  }),
};

export default resourceController;
