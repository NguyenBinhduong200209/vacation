import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import { search } from '#root/config/pipeline';

const searchController = {
  searchMany: asyncWrapper(async (req, res) => {
    const { value } = req.query;
    const result = await search({
      models: ['vacation', 'user', 'location', 'album'],
      searchValue: value,
    });

    return res.status(200).json({ data: result, message: 'search successfully' });
  }),

  searchOne: asyncWrapper(async (req, res) => {
    const { type } = req.params,
      { value, page } = req.query;
    const result = await search({ models: [type], searchValue: value, page });

    return result.length === 0 ? res.sendStatus(204) : res.status(200).json(result[0]);
  }),
};

export default searchController;
