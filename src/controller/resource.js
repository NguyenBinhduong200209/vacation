import Resources from '#root/model/resource';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import mongoose from 'mongoose';
import Vacations from '#root/model/vacation/vacations';
import { addTotalPageFields, facet } from '#root/config/pipeline';

const resourceController = {
  //Use this function to get list picture of avatar, cover of vacation or pictures of album
  getMany: asyncWrapper(async (req, res) => {
    const { field, id, page } = req.query;

    let searchRef;
    switch (field) {
      case 'avatar':
        const userId = req.userInfo._id;
        searchRef = { model: 'users', field: field, _id: new mongoose.Types.ObjectId(userId) };
        break;

      case 'cover':
        searchRef = { model: 'vacations', field: field, _id: new mongoose.Types.ObjectId(id) };
        break;

      case 'album':
        searchRef = { model: 'albums', field: field, _id: new mongoose.Types.ObjectId(id) };
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

  //Only apply when upload avatar user or cover vacation
  addNewOne: asyncWrapper(async (req, res) => {
    const { fieldname, originalname, mimetype, size } = req.file;

    let newResource;
    switch (fieldname) {
      //If user wanna add new avatar
      case 'avatar':
        newResource = await Resources.create({
          name: originalname,
          type: mimetype,
          size: size,
          path: req.url[0],
          userId: req.userInfo._id,
          ref: [{ model: 'users', field: fieldname, _id: req.userInfo._id }],
        });
        break;

      //If user wanna add new cover for vacation
      case 'cover':
        newResource = await Resources.create({
          name: originalname,
          type: mimetype,
          size: size,
          path: req.url,
          userId: req.doc.userId,
          ref: [{ model: 'vacations', field: fieldname, _id: req.doc._id }],
        });
        break;

      default:
        _throw({
          code: 400,
          errors: [{ field: 'fieldname', message: 'invalid' }],
          message: 'fieldname can only be avatar or cover',
        });
        break;
    }

    //Send to front
    return res.status(201).json({ data: newResource, message: 'add successfully' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Delete path in DB
    const deleteResource = await Resources.findByIdAndDelete(id);

    // Create a reference to the file to delete
    const storage = getStorage();
    const desertRef = ref(storage, deleteResource.path);

    // Delete the file
    await deleteObject(desertRef);

    //Send to front
    return res.status(200).json({ data: deleteResource, message: 'delete successfully' });
  }),
};

export default resourceController;
