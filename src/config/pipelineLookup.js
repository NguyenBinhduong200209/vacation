const pipelineLookup = {
  getUserInfo: [
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        pipeline: [{ $project: { username: 1, avatar: 1 } }],
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

  countLikesAndComments: [
    //Get total like by looking up to likes model
    {
      $lookup: {
        from: 'likes',
        pipeline: [{ $count: 'total' }],
        localField: '_id',
        foreignField: 'postId',
        as: 'totalLikes',
      },
    },
    { $unwind: '$totalLikes' },
    { $addFields: { totalLikes: '$totalLikes.total' } },

    //Get total comment by looking up to comment model
    {
      $lookup: {
        from: 'comments',
        pipeline: [{ $count: 'total' }],
        localField: '_id',
        foreignField: 'postId',
        as: 'totalComments',
      },
    },
    { $unwind: '$totalComments' },
    { $addFields: { totalComments: '$totalComments.total' } },
  ],
};

export default pipelineLookup;
