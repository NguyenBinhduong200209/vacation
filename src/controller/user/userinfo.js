import _throw from '#root/utils/_throw';
import Users from '#root/model/user/users';
import asyncWrapper from '#root/middleware/asyncWrapper';

const usersinforController = {
  getprofile: asyncWrapper(async (req, res) => {
    //Get User Information from database
    const username = req.userInfo.username;
    const value = { username };

    if (username) {
      //Get User Information from database
      const foundUser = await Users.findOne(value);
      if (!foundUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({
        data: {
          id: foundUser._id,
          avatar: foundUser.avatar,
          username: foundUser.username,
          firstname: foundUser.firstname,
          lastname: foundUser.lastname,
          email: foundUser.email,
          avatar: foundUser.avatar,
          dateOfBirth: foundUser.dateOfBirth,
          gender: foundUser.gender,
          description: foundUser.description,
          national: foundUser.national,
        },
        message: 'Get info successfully',
      });
    } else _throw({ code: 400, message: 'Username not provided' });
  }),

  getfriendprofile: asyncWrapper(async (req, res) => {
    const { id } = req.params;
    console.log(id);
    if (!id) {
      return res.status(404).json({ message: 'User ID not provided' });
    }

    // Get User Information from database

    const foundUser = await Users.findById(id);
    if (!foundUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      data: {
        id: foundUser._id,
        avatar: foundUser.avatar,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        avatar: foundUser.avatar,
        dateOfBirth: foundUser.dateOfBirth,
        gender: foundUser.gender,
        description: foundUser.description,
        national: foundUser.national,
      },
      message: 'Get info successfully',
    });
  }),
};
export default usersinforController;
