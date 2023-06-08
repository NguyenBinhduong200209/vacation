import _throw from "#root/utils/_throw";
import Users from "#root/model/users";
import asyncWrapper from "#root/middleware/asyncWrapper";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const usersController = {
  logIn: asyncWrapper(async (req, res) => {
    const { username, email, password } = req.body;

    if (username || email) {
      const value = username ? { username } : { email };

      //Get User from database
      const foundUser = await Users.findOne(value);
      !foundUser && _throw({ code: 404, message: "user not found" });

      // Evaluate password
      const match = await bcrypt.compare(password, foundUser.password);
      !match && _throw({ code: 400, message: "password not match" });

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
          username: foundUser.username,
          accessToken,
          refreshToken,
        },
        message: "login successfully",
      });
    } else _throw({ code: 400, message: "no username or email" });
  }),

  logOut: asyncWrapper(async (req, res) => {
    const foundUser = await Users.findOneAndUpdate(
      { username: req.username },
      { accessToken: "", refreshToken: "", lastActiveAt: new Date() },
      { runValidators: true }
    ).lean();
    return foundUser
      ? res.status(200).json({ message: "log out successfully" })
      : _throw({ code: 403, message: "Invalid refreshToken" });
  }),

  register: asyncWrapper(async (req, res) => {
    const { username, password } = req.body;

    //Check for duplicate username in database
    const dupUsername = await Users.findOne({ username }).lean();
    dupUsername && _throw({ code: 400, message: "username has already been existed" });

    //Create new user and validate infor
    const newUser = new Users(req.body);
    await newUser.validate();

    //Save hashedPwd
    const hashedPwd = await bcrypt.hash(password, 10);
    newUser.password = hashedPwd;

    //Save to database
    await newUser.save();

    //Send result to frontend
    res.status(201).json({ data: newUser, message: `New user ${username} has been created` });
  }),

  update: asyncWrapper(async (req, res) => {
    //Find User by username get from accessToken
    const foundUser = req.userInfo;

    //Get schema User
    const templateUser = await Users.schema.obj;
    //Update User
    for (const key of Object.keys(templateUser)) {
      const val = req.body[key];
      //Only processing update if has any value
      if (val) {
        switch (key) {
          case "username":
            //Check username is already existed or not
            const checkDup = await Users.findOne({ username: val });
            checkDup
              ? _throw({ code: 400, message: "username has already existed" })
              : (foundUser.username = val);
            break;

          case "password":
            //Hash the new password
            const newPassword = await bcrypt.hash(val, 10);
            foundUser.password = newPassword;
            break;

          case "lastUpdateAt":
            foundUser.lastUpdateAt = new Date();
            break;

          case "lastActiveAt":
            foundUser.lastActiveAt = new Date();
            break;

          case "email":
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
    return res
      .status(200)
      .json({ data: foundUser, message: `user ${foundUser.username} update successfully` });
  }),

  refresh: asyncWrapper(async (req, res) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    console.log(authHeader);

    // If the authorization header doesn't start with "Bearer ", throw an error
    !authHeader && _throw({ code: 401, message: "auth header not found" });

    if (authHeader?.startsWith("Bearer ")) {
      const refreshToken = authHeader.split(" ")[1];

      //verify Token
      await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
        err && _throw({ code: 403, message: "invalid token" });
      });

      //Find User have refreshToken in database
      const foundUser = await Users.findOne({ refreshToken });
      !foundUser && _throw({ code: 400, message: "invalid token" });

      //Create new accessToken
      const accessToken = jwt.sign({ username: foundUser.username }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
      });

      //Save new accessToken to db
      foundUser.accessToken = accessToken;
      await foundUser.save();

      //Send new accessToken to front
      return res.status(200).json({ data: accessToken, message: "refresh successfully" });
    }
  }),
};

export default usersController;
