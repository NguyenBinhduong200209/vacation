import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Vacations from '#root/model/vacations';

const vacationController = {
  getMany: asyncWrapper(async (req, res) => {
    const { page } = req.query,
      validPage = page && page > 0 ? Number(page) : 1,
      itemOfPage = Number(process.env.ITEM_OF_PAGE),
      foundUser = req.userInfo;

    const result = await Vacations.aggregate([
      //Filter only return vacation has shareStatus is public or vacation has shareStatus is protected and has shared to user
      {
        $match: { $or: [{ shareStatus: 'public' }, { shareStatus: 'protected', shareList: { $in: [foundUser._id] } }] },
      },

      //Sort in order to push the newest updated vacation to top
      { $sort: { lastUpdateAt: -1, createdAt: -1 } },

      //Add field total to calculate length of result of prev pipeline
      { $setWindowFields: { output: { total: { $count: {} } } } },

      //Add 2 new fields with field page is current page user wanna get, and field pages is total pages divided by length of array and itemOfPage
      {
        $addFields: {
          page: validPage,
          pages: { $ceil: { $divide: ['$total', itemOfPage] } },
        },
      },

      //Remove some firstN element in array if page >1
      { $skip: (validPage - 1) * itemOfPage },

      //   //Only get quantity of element equal to itemOfPage
      { $limit: itemOfPage },

      //Get images and videos by lookup to posts model by _id
      {
        $lookup: {
          from: 'posts',
          pipeline: [
            { $unwind: '$subAlbum' },
            { $group: { _id: '$subAlbum', subAlbum: { $push: '$subAlbum' } } },
            { $unset: '_id' },
          ],
          localField: '_id',
          foreignField: 'vacationId',
          as: 'subAlbum',
        },
      },

      //Get username of author by lookup to users model by userId
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          pipeline: [{ $project: { username: 1, _id: 0 } }],
          as: 'username',
        },
      },

      //Set up new array with total field is length of array and list field is array without __v field
      {
        $facet: {
          meta: [
            {
              $group: {
                _id: '$total',
                total: { $first: '$total' },
                page: { $first: '$page' },
                pages: { $first: '$pages' },
              },
            },
            { $project: { _id: 0 } },
          ],
          data: [
            {
              $project: {
                title: 1,
                shareStatus: 1,
                startingTime: 1,
                endingTIme: 1,
                lastUpdateAt: 1,
                subAlbum: 1,
                // userId: 1,
                username: 1,
              },
            },
            { $unwind: '$username' },
            { $unwind: '$subAlbum' },
            { $addFields: { username: '$username.username', subAlbum: '$subAlbum.subAlbum' } },
          ],
        },
      },

      // Destructuring field
      { $unwind: '$meta' },
    ]);

    return res.status(200).json(result[0]);
  }),

  getOne: asyncWrapper(async (req, res) => {
    //Get id from params
    const { id } = req.params;

    //Find vacation based on id
    const foundVacation = await Vacations.findById(id);

    //Send to front
    return foundVacation
      ? res.status(200).json({ data: foundVacation, message: 'get detail successfully' })
      : _throw({ code: 400, errors: [{ field: 'id', message: 'invalid' }], message: 'vacation did not exist' });
  }),

  addNew: asyncWrapper(async (req, res) => {
    //Get vital information from req.body
    const { title, description, memberList, shareStatus, shareList, startingTime, endingTime } = req.body;
    //Get userId from verifyJWT middleware
    const userId = req.userInfo._id.toString();

    //if memberList receive is not an array, then return memberlist contain only userId, otherwises, combine memberList and userId
    const newMemberList = Array.isArray(memberList) ? [...new Set([...memberList, userId])] : [userId];

    //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
    const newShareList =
      shareStatus === 'protected'
        ? Array.isArray(shareList)
          ? [...new Set(newMemberList.concat(shareList))]
          : newMemberList
        : null;

    //Create new Vacation and run validation when creating
    const newVacation = await Vacations.create({
      title,
      description,
      memberList: newMemberList,
      shareStatus,
      shareList: newShareList,
      startingTime,
      endingTime,
      userId,
    });

    //Send to front
    return res.status(201).json({ data: newVacation, message: 'vacation created' });
  }),

  update: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Throw an error if cannot find Vacation
    const foundVacation = await Vacations.findById(id);
    !foundVacation &&
      _throw({ code: 400, errors: [{ field: 'id', message: 'vacationId did not existed' }], message: 'invalid id' });

    //Throw an error if user is not author of vacation
    const userId = req.userInfo._id.toString();
    foundVacation.userId.toString() !== userId &&
      _throw({
        code: 400,
        errors: [{ field: 'userId', message: 'userId is not author of this vacation' }],
        message: 'invalid userId',
      });

    //Get vital information from req.body
    const { memberList, shareStatus, shareList } = req.body;
    const updateKeys = ['title', 'description', 'memberList', 'shareStatus', 'shareList', 'startingTime', 'endingTime'];

    //if memberList receive is not an array, then return memberlist contain only userId, otherwises, combine memberList and userId
    const newMemberList = Array.isArray(memberList) ? [...new Set([...memberList, userId])] : [userId];

    //If shareStatus is protected, and shareList is an array, then return combination of newMemberList and shareList, otherwise, return newMemberList, if shareStatus is not protected, then return null
    const newShareList =
      shareStatus === 'protected'
        ? Array.isArray(shareList)
          ? [...new Set(newMemberList.concat(shareList))]
          : newMemberList
        : null;

    //Save new info to foundVacation
    updateKeys.forEach(key => {
      switch (key) {
        case 'memberList':
          foundVacation.memberList = newMemberList;
          break;

        case 'shareList':
          foundVacation.shareList = newShareList;
          break;

        default:
          foundVacation[key] = req.body[key];
          break;
      }
    });

    //Save to databse
    await foundVacation.save();

    //Send to front
    return res.status(200).json({ data: foundVacation, meta: '', message: 'update successfully' });
  }),

  delete: asyncWrapper(async (req, res) => {
    const { id } = req.params;

    //Throw an error if cannot find Vacation
    const foundVacation = await Vacations.findById(id);
    !foundVacation &&
      _throw({ code: 400, errors: [{ field: 'id', message: 'vacationId did not existed' }], message: 'invalid id' });

    //Throw an error if user is not author of vacation
    const userId = req.userInfo._id.toString();
    foundVacation.userId.toString() !== userId &&
      _throw({
        code: 400,
        errors: [{ field: 'userId', message: 'userId is not author of this vacation' }],
        message: 'invalid userId',
      });

    const deleteVacation = await Vacations.findByIdAndDelete(id);
    return res.status(200).json({ data: deleteVacation, message: 'delete successfully' });
  }),
};

export default vacationController;
