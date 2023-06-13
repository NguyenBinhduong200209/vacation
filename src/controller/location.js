import _throw from '#root/utils/_throw';
import Locations from '#root/model/Locations';
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';

const locationController = {
  addNew: asyncWrapper(async (req, res) => {
    const { districtId, title, description } = req.body;
    const foundUser = req.userInfo;

    const foundDistrict = await Locations.findOne({
      level: 2,
      _id: districtId,
    });

    !foundDistrict &&
      _throw({
        code: 400,
        errors: [{ field: 'district', message: 'invalid district' }],
        message: 'invalid district',
      });

    const foundLocation = await Locations.findOne({
      parentId: districtId,
      title: title.trim(),
      level: 1,
    });
    foundLocation &&
      _throw({
        code: 400,
        errors: [{ field: 'location', message: 'location has already existed' }],
        message: 'location has already existed',
      });

    const newLocation = await Locations.create({
      parentId: districtId,
      level: 1,
      userId: foundUser._id,
      title,
      description,
    });

    return res.status(201).json({ data: newLocation, meta: null, message: 'location created' });
  }),

  getList: asyncWrapper(async (req, res) => {
    const level = Math.round(req.query.level);

    //Throw an error if level is not number type or greater than 3 or lower than 1
    (!level || level > 3 || level < 1) &&
      _throw({
        code: 400,
        errors: [
          {
            field: 'level',
            message: !level
              ? 'level is not a number'
              : level > 3
              ? 'level cannot be greater than 3'
              : level < 1
              ? 'level cannot be lower than 1'
              : '',
          },
        ],
        message: 'invalid level field',
      });

    let list = [];
    switch (level) {
      case 3:
        //Get list based on level and parentId
        list = await Locations.aggregate([{ $match: { level: 3 } }, { $project: { _id: 1, title: 1 } }]);
        break;

      default:
        const { parentId } = req.query;
        //Throw an error if there is no parentId
        !parentId &&
          _throw({
            code: 400,
            errors: [{ field: 'parentId', message: 'required' }],
            message: 'parentId field required',
          });

        //Get list based on level and parentId
        list = await Locations.aggregate([
          { $match: { level: level, parentId: new mongoose.Types.ObjectId(parentId) } },
          { $project: { _id: 1, title: 1 } },
        ]);
        break;
    }

    //Send to front
    return list.length === 0
      ? res.sendStatus(204)
      : res.status(200).json({
          data: list,
          meta: { total: list.length },
          message: 'get list successfully',
        });
  }),
};

export default locationController;
