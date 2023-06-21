const pipeline = {
  getUserInfo: function ({ field }) {
    return [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          pipeline: [{ $project: field.reduce((obj, item) => Object.assign(obj, { [item]: 1 }), {}) }],
          as: 'authorInfo',
        },
      },
      { $unwind: '$authorInfo' },
    ];
  },

  getLocation: function ({ localField }) {
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
  },

  countLikesAndComments: function ({ modelType }) {
    return [
      //Get total like by looking up to likes model
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'modelId',
          pipeline: [{ $match: { modelType } }, { $count: 'total' }],
          as: 'totalLikes',
        },
      },
      { $unwind: '$totalLikes' },
      { $addFields: { totalLikes: '$totalLikes.total' } },

      //Get total comment by looking up to comment model
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'modelId',
          pipeline: [{ $match: { modelType } }, { $count: 'total' }],
          as: 'totalComments',
        },
      },
      { $unwind: '$totalComments' },
      { $addFields: { totalComments: '$totalComments.total' } },
    ];
  },

  getLikesInfo: function ({ field }) {
    return [
      {
        $lookup: {
          from: 'likes',
          pipeline: [
            { $project: field.reduce((obj, item) => Object.assign(obj, { [item]: 1 }), { userId: 1 }) },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [{ $project: { username: 1, _id: 0 } }],
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            { $addFields: { username: '$userInfo.username' } },
            { $unset: 'userInfo' },
          ],
          localField: '_id',
          foreignField: 'parentId',
          as: 'likesInfo',
        },
      },
    ];
  },

  getCommentsInfo: function ({ field }) {
    return [
      {
        $lookup: {
          from: 'comments',
          pipeline: [
            { $project: field.reduce((obj, item) => Object.assign(obj, { [item]: 1 }), { userId: 1 }) },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                pipeline: [{ $project: { username: 1, _id: 0 } }],
                as: 'userInfo',
              },
            },
            { $unwind: '$userInfo' },
            { $addFields: { username: '$userInfo.username' } },
            { $project: { userInfo: 0 } },
          ],
          localField: '_id',
          foreignField: 'parentId',
          as: 'commentsInfo',
        },
      },
    ];
  },

  addTotalPageFields: function ({ page }) {
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
  },
};

export default pipeline;
