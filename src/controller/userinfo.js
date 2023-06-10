import _throw from '#root/utils/_throw';
import Users from '#root/model/users';
import asyncWrapper from '#root/middleware/asyncWrapper';

const usersinforController = {
    userprofile: asyncWrapper(async (req, res) => {
        const { username } = req.body;
        const value = username;
        if (username) {
            //Get User Information from database
            const foundUser = await Users.findOne(value);
            if (!foundUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({
                data: {
                    username: foundUser.username,
                    firstname: foundUser.firstname,
                    lastname: foundUser.lastname,
                    email: foundUser.email,
                    avatar: foundUser.avatar,
                    dateOfBirth: foundUser.dateOfBirth,
                    gender: foundUser.gender,
                    description: foundUser.description,
                },
                message: 'Get infor successfully',
            });
        } else _throw({ code: 400, message: 'Username not provided' });
    }),
};
export default usersinforController;
