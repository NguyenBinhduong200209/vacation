import asyncWrapper from '#root/middleware/asyncWrapper';
import _throw from '#root/utils/_throw';
import mongoose from 'mongoose';
import { getUserInfo, addTotalPageFields, facet } from '#root/config/pipeline';

const statusListController = {
  getStatusList: asyncWrapper(async (req, res) => {
    const { listType, type, id, page } = req.query;

    if (/(public|onlyme)/.test(req.doc.shareStatus) && listType === 'shareList') return res.sendStatus(204);

    const result = await mongoose.model(type).aggregate(
      [].concat(
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        getUserInfo({
          localField: listType,
          field: ['avatar', 'username', 'firstname', 'lastname'],
          as: listType,
          isFriend: req.userInfo._id,
        }),
        addTotalPageFields({ page }),
        {
          $group: {
            _id: null,
            meta: { $first: { total: '$total', page: '$page', pages: '$pages' } },
            data: { $push: `$${listType}` },
          },
        },
        { $unset: '_id' }
      )
    );
    return res.json(result[0]);
  }),
};

export default statusListController;
