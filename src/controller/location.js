import _throw from '#root/utils/_throw';
import Locations from '#root/model/Locations';
import asyncWrapper from '#root/middleware/asyncWrapper';

const locationController = {
  addNew: asyncWrapper(async (req, res) => {
    const { parentId, title, description, longitude, latitude } = req.body;
    const foundUser = req.userInfo;
  }),
};

export default locationController;
