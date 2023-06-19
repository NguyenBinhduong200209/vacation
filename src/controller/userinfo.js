import _throw from '#root/utils/_throw';
import Users from '#root/model/users';
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
          username: foundUser.username,
          firstname: foundUser.firstname,
          lastname: foundUser.lastname,
          email: foundUser.email,
          avatar: foundUser.avatar,
          dateOfBirth: foundUser.dateOfBirth,
          gender: foundUser.gender,
          description: foundUser.description,
        },
        message: 'Get info successfully',
      });
    } else _throw({ code: 400, message: 'Username not provided' });
  }),

  getfriendprofile: asyncWrapper(async (req, res) => {
    const { userid } = req.body;
    const value = { userid };
    if (userid) {
      //Get User Information from database
      console.log(userid);
      const foundUser = await Users.findById(userid);
      if (!foundUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({
        data: {
          id: foundUser._id,
          firstname: foundUser.firstname,
          lastname: foundUser.lastname,
          avatar: foundUser.avatar,
          dateOfBirth: foundUser.dateOfBirth,
          gender: foundUser.gender,
          description: foundUser.description,
        },
        message: 'Get infor successfully',
      });
    } else _throw({ code: 404, message: 'Username not provided' });
  }),
};
export default usersinforController;
