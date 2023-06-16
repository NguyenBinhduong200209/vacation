import _throw from '#root/utils/_throw';
import Locations from '#root/model/locations';
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';
import pipelineLookup from '#root/config/pipelineLookup';

const locationController = {
  addNew: asyncWrapper(async (req, res) => {
    const { parentId, title, description } = req.body;
    const foundUser = req.userInfo;

    //Throw an error if cannot find district based on parentId
    const foundDistrict = await Locations.findOne({ level: 2, _id: parentId });
    !foundDistrict &&
      _throw({
        code: 400,
        errors: [{ field: 'district', message: 'district not found' }],
        message: 'invalid district',
      });

    //Throw an error if location has already existed
    const foundLocation = await Locations.findOne({ parentId: parentId, title: title.trim(), level: 1 });
    foundLocation &&
      _throw({
        code: 400,
        errors: [{ field: 'location', message: 'location has already existed' }],
        message: 'location has already existed',
      });

    // Create new Location and save to database
    const newLocation = await Locations.create({
      parentId: parentId,
      level: 1,
      userId: foundUser._id,
      title,
      description,
    });

    //Send to front
    return res.status(201).json({ data: newLocation, meta: null, message: 'location created' });
  }),

  getListBasedOnLevel: asyncWrapper(async (req, res) => {
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

  getListBasedOnTrend: asyncWrapper(async (req, res) => {
    const { quantity } = req.params;

    //Throw an error if quantity received from params is not an positive integer
    (!Number(quantity) || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) &&
      _throw({
        code: 400,
        errors: [{ field: 'params', message: 'params must be a positive integer' }],
        message: 'invalid params',
      });

    //Get the result through aggregation
    const result = await Locations.aggregate([
      //Get all location matched level 1
      { $match: { level: 1 } },

      //Only get field title and _id
      { $project: { title: 1 } },

      //Lookup to posts model to get likes and comments
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'locationId',
          pipeline: [{ $project: { _id: 1 } }, ...pipelineLookup.countLikesAndComments({ level: 1 })],
          as: 'postInfo',
        },
      },

      //Add new field is the summary of likes and comments
      {
        $addFields: {
          interactions: { $sum: [{ $sum: '$postInfo.totalLikes' }, { $sum: '$postInfo.totalComments' }] },
        },
      },

      //Only firstN elements in array based on params
      { $limit: Number(quantity) },

      //unset field postInfo
      { $unset: 'postInfo' },
    ]);
    return res.status(200).json({ data: result, message: 'get trending list successfully' });
  }),
};

export default locationController;
