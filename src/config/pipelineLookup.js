const pipelineLookup = {
  getUsername: [
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        pipeline: [{ $project: { username: 1 } }],
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
};

export default pipelineLookup;
