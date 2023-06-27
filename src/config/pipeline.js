import mongoose from 'mongoose';
import _throw from '#root/utils/_throw';

export function getCountInfo({ field }) {
  return field.reduce((arr, item) => {
    switch (item) {
      case 'like':
        return arr.concat(
          {
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'modelId',
              as: 'likes',
            },
          },
          { $addFields: { likes: { $size: '$likes' } } }
        );

      case 'comment':
        return arr.concat(
          {
            $lookup: {
              from: 'comments',
              localField: '_id',
              foreignField: 'modelId',
              as: 'comments',
            },
          },
          { $addFields: { comments: { $size: '$comments' } } }
        );

      case 'view':
        return arr.concat([
          {
            $lookup: {
              from: 'views',
              localField: '_id',
              foreignField: 'modelId',
              as: 'views',
            },
          },
          { $addFields: { views: { $sum: '$views.quantity' } } },
        ]);

      case 'friend':
        return arr.concat([
          {
            $lookup: {
              from: 'friends',
              let: { user_id: { $toObjectId: '$_id' } },
              pipeline: [
                { $match: { $expr: { $or: [{ $eq: ['$userId1', '$$user_id'] }, { $eq: ['$userId2', '$$user_id'] }] } } },
              ],
              as: 'friends',
            },
          },
          { $addFields: { friends: { $size: '$friends' } } },
        ]);

      case 'memberList':
        return arr.concat([
          {
            $lookup: {
              from: 'users',
              localField: 'memberList',
              foreignField: '_id',
              as: 'members',
            },
          },
          { $addFields: { members: { $size: '$members' } } },
          { $project: { memberList: 0, __v: 0 } },
        ]);

      default:
        return arr;
    }
  }, []);
}

export function getUserInfo({ field, countFriend }) {
  const isGetAvatar = field.includes('avatar');
  return [].concat(
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        pipeline: [].concat(
          //Get avatar link if field params contain avatar
          isGetAvatar
            ? [
                {
                  $lookup: {
                    from: 'resources',
                    let: { userId: { $toObjectId: '$_id' } },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ['$userId', '$$userId'] },
                          ref: { $elemMatch: { model: 'users', field: 'avatar' } },
                        },
                      },
                      { $sort: { createdAt: -1 } },
                    ],
                    as: 'avatar',
                  },
                },
                //Get the first element in array
                { $addFields: { avatar: { $first: '$avatar.path' } } },
              ]
            : {},

          //Limit field pass to next stage based on field params
          { $project: field.reduce((obj, item) => Object.assign(obj, { [item]: 1 }), {}) },

          //Get totalFiend based on countTotalFriend params
          countFriend ? getCountInfo({ field: ['friend'] }) : []
        ),
        as: 'authorInfo',
      },
    },
    { $unset: 'userId' },
    { $unwind: '$authorInfo' }
  );
}

export function getLocation({ localField }) {
  return [
    {
      $lookup: {
        from: 'locations',
        localField: localField,
        foreignField: '_id',
        pipeline: [
          { $project: { title: 1, parentId: 1 } },
          {
            $lookup: {
              from: 'locations',
              localField: 'parentId',
              foreignField: '_id',
              pipeline: [
                { $project: { title: 1, parentId: 1, _id: 0 } },
                {
                  $lookup: {
                    from: 'locations',
                    localField: 'parentId',
                    foreignField: '_id',
                    pipeline: [{ $project: { title: 1, parentId: 1, _id: 0 } }],
                    as: 'city',
                  },
                },
                { $unwind: '$city' },
              ],
              as: 'district',
            },
          },
          { $unwind: '$district' },
          {
            $addFields: {
              detail: '$title',
              district: '$district.title',
              city: '$district.city.title',
            },
          },
          { $project: { parentId: 0, title: 0 } },
        ],
        as: 'location',
      },
    },
    { $unwind: '$location' },
  ];
}

export function addTotalPageFields({ page }) {
  const itemOfPage = Number(process.env.ITEM_OF_PAGE),
    validPage = page && page > 0 ? Number(page) : 1;

  return [
    //Add field total to calculate length of result of prev pipeline
    { $setWindowFields: { output: { total: { $count: {} } } } },

    // //Add 2 new fields with field page is current page user wanna get, and field pages is total pages divided by length of array and itemOfPage
    { $addFields: { page: validPage, pages: { $ceil: { $divide: ['$total', itemOfPage] } } } },

    //Remove some firstN element in array if page > 1 and get quantity of element equal to itemOfPage
    { $skip: (validPage - 1) * itemOfPage },
    { $limit: itemOfPage },
  ];
}

export function facet({ meta, data }) {
  return [
    {
      $facet: {
        meta: [
          {
            $group: Object.assign(
              { _id: null },
              meta.reduce((obj, item) => Object.assign(obj, { [item]: { $first: `$${item}` } }), {})
            ),
          },
          { $unset: '_id' },
        ],
        data: [{ $project: data.reduce((obj, item) => Object.assign(obj, { [item]: 1 }), {}) }],
      },
    },

    // Destructuring field
    { $unwind: '$meta' },
  ];
}

export async function search({ models, searchValue, page }) {
  const itemOfPage = Number(process.env.ITEM_OF_PAGE);

  function aggregateFlow(model) {
    let newItem = [];
    switch (model) {
      case 'vacation':
        newItem = [].concat(
          //Filter to get documents has title contain searchValue
          { $match: { title: { $regex: searchValue, $options: 'i' } } },

          //Sort from the most views, latest update to the least
          { $sort: { views: -1, lastUpdateAt: -1, createdAt: -1 } },

          //If page exists, meaning search for one, then add 3 fields: total, page and pages, otherwise, limit the document pass this stage
          page ? addTotalPageFields({ page }) : { $limit: itemOfPage },

          //Lookup to user model to get info
          getUserInfo({ field: ['username', 'avatar'] }),

          //If page exists, meangin search for one, then restructure result by facet and limit fields could pass, otherwise, just limit fields could pass
          page
            ? facet({
                meta: ['total', 'page', 'pages'],
                data: ['title', 'startingTime', 'endingTime', 'lastUpdateAt', 'cover', 'views', 'authorInfo'],
              })
            : { $project: { title: 1, startingTime: 1, endingTime: 1, lastUpdateAt: 1, cover: 1, views: 1, authorInfo: 1 } }
        );
        return { model: 'Vacations', newItem };

      case 'user':
        newItem = [].concat(
          //Filter to get documents has username, firstname, lastname or email contain searchValue
          {
            $match: {
              $or: [
                { username: { $regex: searchValue, $options: 'i' } },
                { firstname: { $regex: searchValue, $options: 'i' } },
                { lastname: { $regex: searchValue, $options: 'i' } },
                { email: { $regex: searchValue, $options: 'i' } },
              ],
            },
          },

          //If page exists, meaning search for one, then add 3 fields: total, page and pages, otherwise, limit the document pass this stage
          page ? addTotalPageFields({ page }) : { $limit: itemOfPage },

          //If page exists, meangin search for one, then restructure result by facet and limit fields could pass, otherwise, just limit fields could pass
          page
            ? facet({
                meta: ['total', 'page', 'pages'],
                data: ['firstname', 'lastname', 'username', 'email', 'avatar'],
              })
            : { $project: { firstname: 1, lastname: 1, username: 1, email: 1, avatar: 1 } }
        );
        return { model: 'Users', newItem };

      case 'location':
        newItem = [].concat(
          //Filter to get documents has title contain searchValue and level is 1
          { $match: { title: { $regex: searchValue, $options: 'i' }, level: 1 } },

          //If page exists, meaning search for one, then add 3 fields: total, page and pages, otherwise, limit the document pass this stage
          page ? addTotalPageFields({ page }) : { $limit: itemOfPage },

          //Lookup to location model to district and city
          getLocation({ localField: '_id' }),
          { $addFields: { district: '$location.district', city: '$location.city' } },

          //If page exists, meangin search for one, then restructure result by facet and limit fields could pass, otherwise, just limit fields could pass
          page
            ? facet({ meta: ['total', 'page', 'pages'], data: ['title', 'district', 'city'] })
            : { $project: { title: 1, district: 1, city: 1 } }
        );
        return { model: 'Locations', newItem };

      case 'album':
        newItem = [].concat(
          //Filter to get documents has title contain searchValue
          { $match: { title: { $regex: searchValue, $options: 'i' } } },

          //If page exists, meaning search for one, then add 3 fields: total, page and pages, otherwise, limit the document pass this stage
          page ? addTotalPageFields({ page }) : { $limit: itemOfPage },

          //If page exists, meangin search for one, then restructure result by facet and limit fields could pass, otherwise, just limit fields could pass
          page
            ? facet({
                meta: ['total', 'page', 'pages'],
                data: ['title', 'createdAt', 'lastUpdateAt'],
              })
            : { $project: { title: 1, createdAt: 1, lastUpdateAt: 1 } }
        );
        return { model: 'Albums', newItem };

      default:
        _throw({
          code: 400,
          errors: [{ field: 'model', message: 'invalid model can be used for searching' }],
          message: 'invalid model',
        });
    }
  }

  //In case models has only one model
  if (models.length === 1) {
    const { model, newItem } = aggregateFlow(models[0]);
    return await mongoose.model(model).aggregate(newItem);
  }

  //In case models has more than one model
  else {
    //Use promise all to reduce time in server
    const searchResult = await Promise.all(
      models.reduce((arr, item) => {
        const { model, newItem } = aggregateFlow(item);
        return arr.concat(mongoose.model(model).aggregate(newItem));
      }, [])
    );

    //Convert array to object
    return searchResult.reduce((obj, item, index) => Object.assign(obj, { [models[index]]: item }), {});
  }
}
