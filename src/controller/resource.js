import Resources from '#root/model/resource';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';
import { addTotalPageFields, facet } from '#root/config/pipeline';

const resourceController = {
  //Use this function to get list picture of avatar, cover of vacation or pictures of album
  getMany: asyncWrapper(async (req, res) => {
    const { id, page, type } = req.query;

    let searchRef;
    switch (type) {
      case 'user':
        const userId = req.userInfo._id;
        searchRef = { model: 'users', field: 'avatar', _id: new mongoose.Types.ObjectId(userId) };
        break;

      case 'vacation':
        searchRef = { model: 'vacations', field: 'cover', _id: new mongoose.Types.ObjectId(id) };
        break;

      case 'album':
        searchRef = { model: 'albums', _id: new mongoose.Types.ObjectId(id) };
        break;

      default:
        _throw({ code: 400, errors: [{ field: 'field', message: 'invalid' }], message: 'invalid field' });
        break;
    }

    const foundResource = await Resources.aggregate(
      [].concat(
        { $match: { ref: { $elemMatch: searchRef } } },
        { $sort: { createdAt: -1 } },
        addTotalPageFields({ page }),
        facet({ meta: ['total', 'page', 'pages'], data: ['path', 'createdAt'] })
      )
    );

    return foundResource.length === 0 ? res.sendStatus(204) : res.status(200).json(foundResource[0]);
  }),

  addNewOne: asyncWrapper(async (req, res) => {
    const { field } = req.params,
      isAvatar = field === 'avatar';

    //Create new document and save to DB without validation because validation has run in fileFilter in getFileUpload middleware
    const { fieldname, originalname, mimetype, size, url } = req.file;

    const newResource = await Resources.create({
      name: originalname,
      type: mimetype,
      size: size,
      path: url,
      userId: isAvatar ? req.userInfo._id : req.doc.userId,
      ref: [
        {
          model: isAvatar ? 'users' : field === 'cover' ? 'vacations' : 'posts',
          field: fieldname,
          _id: isAvatar ? req.userInfo._id : req.doc._id,
        },
      ],
    });

    //Send to front
    return res.status(201).json({ data: newResource, message: 'add successfully' });
  }),

  deleteOne: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Delete path in DB
    const deleteResource = await Resources.findByIdAndDelete(id);

    //Send to front
    return res.status(200).json({ data: deleteResource, message: 'delete successfully' });
  }),
};

export default resourceController;
