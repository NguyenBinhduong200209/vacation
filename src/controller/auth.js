import _throw from '#root/utils/_throw';
import Users from '#root/model/users';
import asyncWrapper from '#root/middleware/asyncWrapper';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sendMail from '#root/utils/email/sendEmail';
import mongoose from 'mongoose';

const usersController = {
  logIn: asyncWrapper(async (req, res) => {
    const { username, email, password } = req.body;

    if (username || email) {
      const value = username ? { username } : { email };

      //Get User from database
      const foundUser = await Users.findOne(value);
      !foundUser && _throw({ code: 404, message: 'user not found' });

      // Evaluate password
      const match = await bcrypt.compare(password, foundUser.password);
      !match && _throw({ code: 400, message: 'password not match' });

      //Generate new accessToken
      const accessToken = jwt.sign({ username: foundUser.username }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
      });

      //Generate new refreshToken
      const refreshToken = jwt.sign({ username: foundUser.username }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
      });

      //Save token to database to prevent previousToken still take effect
      foundUser.accessToken = accessToken;
      foundUser.refreshToken = refreshToken;
      foundUser.createdAt = new Date();
      await foundUser.save();

      //Return result
      return res.status(200).json({
        data: {
          _id: foundUser._id,
          username: foundUser.username,
          avatar: foundUser.avatar,
          accessToken,
          refreshToken,
        },
        message: 'login successfully',
      });
    } else _throw({ code: 400, message: 'no username or email' });
  }),

  logOut: asyncWrapper(async (req, res) => {
    //Get user from database
    const foundUser = await Users.findOneAndUpdate(
      { username: req.username },
      //Reset all token
      { accessToken: '', refreshToken: '', lastActiveAt: new Date() },
      //Run validator
      { runValidators: true }
    ).lean();

    //Send to front
    return foundUser
      ? res.status(200).json({ message: 'log out successfully' })
      : _throw({ code: 403, message: 'Invalid refreshToken' });
  }),

  register: asyncWrapper(async (req, res) => {
    //Get username and password from req.body
    const { email, username } = req.body;

    //Check for duplicate username in database
    const duplicate = await Users.findOne({ $or: [{ username }, { email }] }).lean();
    duplicate && _throw({ code: 400, message: 'username or email has already been existed' });

    //Send email
    await sendMail({ type: 'verify', email, url: 'http://localhost:3100/auth/verify', body: req.body });

    //Send to front
    return res
      .status(200)
      .json({ message: `an email has been send to ${email} account. Please check your email account` });
  }),

  verify: asyncWrapper(async (req, res) => {
    //Get username and password from req.body
    const { email, username, password } = req.body;

    //Check for duplicate username in database
    const duplicate = await Users.findOne({ $or: [{ username }, { email }] }).lean();
    duplicate && _throw({ code: 400, message: 'username or email has already been registerred' });

    //Create new user and validate infor
    const newUser = new Users(req.body);
    await newUser.validate();

    //Save hashedPwd
    const hashedPwd = await bcrypt.hash(password, 10);
    newUser.password = hashedPwd;

    //Save to database
    await newUser.save();

    //Send result to frontend
    res.status(201).json({
      data: newUser,
      message: `New user ${username} has been created`,
    });
  }),

  update: asyncWrapper(async (req, res) => {
    //Find User by username get from accessToken
    const foundUser = req.userInfo;
    console.log(req.body);
    //Get schema User
    const templateUser = await Users.schema.obj;
    //Update User
    for (const key of Object.keys(templateUser)) {
      const val = req.body[key];
      //Only processing update if has any value
      if (val) {
        switch (key) {
          case 'username':
            if (foundUser.username !== val) {
              //Check username is already existed or not
              const checkDup = await Users.findOne({
                username: val,
              });
              checkDup
                ? _throw({
                    code: 400,
                    message: 'username has already existed',
                  })
                : (foundUser.username = val);
            }
            break;

          case 'avatar':
            const { path } = req.file,
              resource = fs.readFileSync(path).toString('base64');
            foundUser.avatar = resource;
            break;

          case 'password':
            //Hash the new password
            const newPassword = await bcrypt.hash(val, 10);
            foundUser.password = newPassword;
            break;

          case 'lastUpdateAt':
            foundUser.lastUpdateAt = new Date();
            break;

          case 'lastActiveAt':
            foundUser.lastActiveAt = new Date();
            break;

          case 'email':
            //Do not update email
            break;

          default:
            foundUser[key] = val;
            break;
        }
      }
    }

    //Save new Infor
    await foundUser.save();

    //Send to front
    return res.status(200).json({
      data: { userInfo: foundUser },
      message: `user ${foundUser.username} update successfully`,
    });
  }),

  forgot: asyncWrapper(async (req, res) => {
    //Get email from req.query
    const { email } = req.params;

    //Found user based on email
    const foundUser = await Users.findOne({ email });

    //Throw an error if cannot find matched user
    !foundUser &&
      _throw({
        code: 400,
        errors: { field: 'email', message: 'email is not register in server' },
        message: 'invalid email',
      });

    //Get new passwordToken and save to foundUser
    const passwordToken = new mongoose.Types.ObjectId();
    foundUser.passwordToken = passwordToken;

    //Send passwordToken to email got from req.query
    await sendMail({ email, token: passwordToken });

    //Save new info of foundUser to database
    await foundUser.save();

    //Send to front
    return res.status(200).json({ data: '', message: 'send reset password email successfully' });
  }),

  reset: asyncWrapper(async (req, res) => {
    //Get new Password and secretToken from req.body
    const { password, passwordToken } = req.body;

    //Find user based on secretToken
    const foundUser = await Users.findOne({ passwordToken });

    //Throw an error if cannot find user
    !foundUser &&
      _throw({
        code: 400,
        errors: { field: 'passwordToken', message: 'invalid passwordToken' },
        message: 'invalid passwordToken',
      });

    // Get new hash password and save it to database
    const hashNewPwd = await bcrypt.hash(password, 10);
    foundUser.password = hashNewPwd;
    await foundUser.save();

    // Send to front
    return res.status(200).json({ data: '', message: 'user reset password successfully' });
  }),

  refresh: asyncWrapper(async (req, res) => {
    //Get token from headers.authorization
    const authHeader = req.headers.authorization || req.headers.Authorization;

    //Log token
    console.log(authHeader);

    // If the authorization header doesn't start with "Bearer ", throw an error
    !authHeader && _throw({ code: 401, message: 'auth header not found' });

    //In case token startWith Bearer
    if (authHeader?.startsWith('Bearer ')) {
      //Get token without "Bearer"
      const refreshToken = authHeader.split(' ')[1];

      //verify Token
      await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async err => {
        err &&
          _throw({
            code: 403,
            errrors: [{ field: 'refreshToken', message: 'invalid' }],
            message: 'invalid token',
          });
      });

      //Find User have refreshToken in database
      const foundUser = await Users.findOne({ refreshToken });
      !foundUser && _throw({ code: 400, message: 'invalid token' });

      //Create new accessToken
      const accessToken = jwt.sign({ username: foundUser.username }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
      });

      //Save new accessToken to db
      foundUser.accessToken = accessToken;
      await foundUser.save();

      //Send new accessToken to front
      return res.status(200).json({
        data: { accessToken },
        message: 'refresh successfully',
      });
    }
    //Throw an error if token do not start with "Bearer"
    else
      _throw({
        code: 403,
        errrors: [{ field: 'refreshToken', message: 'invalid' }],
        message: 'invalid token',
      });
  }),
};

export default usersController;
