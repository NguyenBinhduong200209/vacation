import _throw from '#root/utils/_throw';
import Locations from '#root/model/vacation/locations';
import asyncWrapper from '#root/middleware/asyncWrapper';
import mongoose from 'mongoose';
import { getUserInfo, getCountInfo, getLocation } from '#root/config/pipeline';

const locationController = {
  getMany: asyncWrapper(async (req, res) => {
    const { type } = req.query;
    const number = Math.round(req.query.number);

    //Throw an error if number received from query is not an positive integer
    (!number || number <= 0) &&
      _throw({
        code: 400,
        errors: [{ field: 'query', message: 'number query must be a positive integer' }],
        message: 'invalid query',
      });

    switch (type) {
      //If type is level, meaning user want to get city List, districtList or
      case 'level':
        const { parentId } = req.query;
        let list = [];
        switch (number) {
          case 4:
            list = await Locations.aggregate([{ $match: { level: 4 } }, { $project: { _id: 1, title: 1 } }]);
            break;

          case 3:
            list = await Locations.aggregate([{ $match: { level: 3 } }, { $project: { _id: 1, title: 1 } }]);
            break;

          case 2:
            //Throw an error if there is no parentId
            !parentId &&
              _throw({
                code: 400,
                errors: [{ field: 'parentId', message: 'required' }],
                message: 'parentId field required',
              });

            //Get list based on level and parentId
            list = await Locations.aggregate([
              { $match: { level: number, parentId: new mongoose.Types.ObjectId(parentId) } },
              { $project: { _id: 1, title: 1 } },
            ]);
            break;

          //Throw an error if type is level number greater than 3 or lower than 2
          default:
            _throw({
              code: 400,
              errors: [{ field: 'query', message: 'level can be in range from 2 to 4' }],
              message: 'invalid level field',
            });
        }

        //Send to front
        return list.length === 0
          ? res.sendStatus(204)
          : res.status(200).json({
              meta: { total: list.length },
              data: list,
              message: 'get list successfully',
            });

      //If type is trending, meaning user want to get top trending list at the moment
      case 'trending':
        const result = await Locations.aggregate([
          //Get all location matched level 1
          { $match: { level: 1 } },

          //Lookup to posts model to get likes and comments
          {
            $lookup: {
              from: 'posts',
              localField: '_id',
              foreignField: 'locationId',
              pipeline: [{ $project: { _id: 1 } }].concat(getCountInfo({ field: ['like', 'comment'] })),
              as: 'postInfo',
            },
          },

          //Add new field is the summary of likes and comments
          {
            $addFields: {
              interactions: { $sum: [{ $sum: '$postInfo.totalLikes' }, { $sum: '$postInfo.totalComments' }] },
            },
          },

          //Only get field title and _id
          { $project: { title: 1, interactions: 1 } },

          //Sort from the highest to the lowest interacation
          { $sort: { interactions: -1, title: 1 } },

          //Only firstN elements in array based on params
          { $limit: number },
        ]);
        return res
          .status(200)
          .json({ meta: { total: result.length }, data: result, message: 'get trending list successfully' });

      default:
        _throw({
          code: 400,
          errors: [{ field: 'params', message: 'params can only be level or trending' }],
          message: 'invalid params',
        });
    }
  }),

  getOne: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    const result = await Locations.aggregate(
      //Filter based on id
      [{ $match: { _id: new mongoose.Types.ObjectId(id) } }].concat(
        //Get user and location infor by lookup to model
        getUserInfo({ field: ['username', 'avatar'] }),
        getLocation({ localField: '_id' }),

        //Get specific fields
        [{ $project: { level: 0, title: 0, userId: 0, parentId: 0 } }]
      )
    );

    return res.status(200).json({ data: result[0], message: 'get detail successfully' });
  }),

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
};

export default locationController;
