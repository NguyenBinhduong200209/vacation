import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';

const postController = {
  getOne: asyncWrapper(async (req, res) => {}),
  addNew: asyncWrapper(async (req, res) => {}),
  update: asyncWrapper(async (req, res) => {}),
  delete: asyncWrapper(async (req, res) => {}),
};

export default postController;
