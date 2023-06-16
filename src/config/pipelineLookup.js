const pipelineLookup = {
  getUserInfo: ({ field }) => [
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
  ],

  location: [
    {
      $lookup: {
        from: 'locations',
        pipeline: [
          { $project: { title: 1, parentId: 1 } },
          {
            $lookup: {
              from: 'locations',
              pipeline: [
                { $project: { title: 1, parentId: 1, _id: 0 } },
                {
                  $lookup: {
                    from: 'locations',
                    pipeline: [{ $project: { title: 1, parentId: 1, _id: 0 } }],
                    localField: 'parentId',
                    foreignField: '_id',
                    as: 'city',
                  },
                },
                { $unwind: '$city' },
              ],
              localField: 'parentId',
              foreignField: '_id',
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
        localField: 'locationId',
        foreignField: '_id',
        as: 'location',
      },
    },
    { $unwind: '$location' },
  ],

  countLikesAndComments: ({ level }) => [
    { $project: { _id: 1 } },
    //Get total like by looking up to likes model
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'parentId',
        pipeline: level === 1 ? [{ $match: { level } }, { $count: 'total' }] : [{ $count: 'total' }],
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
        foreignField: 'parentId',
        pipeline: level === 1 ? [{ $match: { level } }, { $count: 'total' }] : [{ $count: 'total' }],
        as: 'totalComments',
      },
    },
    { $unwind: '$totalComments' },
    { $addFields: { totalComments: '$totalComments.total' } },
  ],
};

export default pipelineLookup;
