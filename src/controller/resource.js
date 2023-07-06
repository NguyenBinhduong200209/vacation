import Resources from '#root/model/resource';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';
import { addTotalPageFields, facet } from '#root/config/pipeline';

const resourceController = {
  getMany: asyncWrapper(async (req, res) => {
    const { id, page, field } = req.query;

    let searchRef;
    switch (field) {
      case 'avatar':
        const userId = req.userInfo._id;
        searchRef = { model: 'users', field: 'avatar', _id: new mongoose.Types.ObjectId(userId) };
        break;

      case 'cover':
        searchRef = { model: 'vacations', field: 'cover', _id: new mongoose.Types.ObjectId(id) };
        break;

      case 'albums':
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

  addNew: asyncWrapper(async (req, res) => {
    const { field, vacationId } = req.query,
      isAvatar = field === 'avatar',
      isPost = field === 'post';

    //Create new document and save to DB without validation because validation has run in fileFilter in getFileUpload middleware
    let result = [];
    for (const file of req.filesArr) {
      const { originalname, mimetype, size, url } = file;

      //Only create value for ref field when user upload file for new cover vacation or new avatar, there is no ref for new post yet. Using updateRef for set up ref for post
      const newResource = await Resources.create({
        name: originalname,
        type: mimetype,
        size: size,
        path: url,
        userId: isAvatar ? req.userInfo._id : req.doc.userId,
        ref: isPost
          ? []
          : isAvatar
          ? [{ model: 'users', field: field, _id: req.userInfo._id }]
          : [{ model: 'vacations', field: field, _id: vacationId }],
      });

      result.push(newResource);
    }

    //Send to front
    return res.status(201).json({ data: result, message: 'add successfully' });
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
