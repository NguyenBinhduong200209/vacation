import Resources from '#root/model/resource';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';

const resourceController = {
  getMany: asyncWrapper(async (req, res) => {
    const userId = req.userInfo._id;

    const foundResource = await Resources.aggregate(
      [].concat(
        { $match: { ref: { $elemMatch: { model: 'users', field: 'avatar', _id: new mongoose.Types.ObjectId(userId) } } } },
        { $group: { _id: null, data: { $push: { path: '$path', createdAt: '$createdAt' } } } }
      )
    );

    return res.status(200).json(foundResource[0]);
  }),

  addNew: asyncWrapper(async (req, res) => {
    const { id } = req.query;

    if (req.file) {
      const { fieldname, originalname, mimetype, size } = req.file;

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

      //Create new Resource document
      const newResource = await Resources.create({
        name: originalname,
        type: mimetype,
        size: size,
        path: req.url,
        userId: foundDoc._id,
        ref: [{ model: model.toLowerCase(), field: fieldname, _id: foundDoc._id }],
      });

      //Send to front
      return res.status(201).json({ data: newResource, message: 'add successfully' });
    }
    //Throw an error if user did not upload any file
    else _throw({ code: 400, message: 'user did not upload any file' });
  }),

  update: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    const { type, model } = req.query;

    const foundResource = await Resources.findById(id);
    !foundResource && _throw({ code: 404, message: 'not found resource' });

    switch (type) {
      case 'add':
        break;

      default:
        break;
    }
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
