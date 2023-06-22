import Resources from '#root/model/resource';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';

const resourceController = {
  getMany: asyncWrapper(async (req, res) => {}),
  addNew: asyncWrapper(async (req, res) => {
    const newResource = await Resources.create(Object.assign(req.body, { userId: req.userInfo._id }));
    return res.json(newResource);
  }),
};

export default resourceController;
