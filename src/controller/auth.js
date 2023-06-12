import _throw from '#root/utils/_throw';
import Users from '#root/model/users';
import asyncWrapper from '#root/middleware/asyncWrapper';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sendMail from '#root/utils/email/sendEmail';
import mongoose from 'mongoose';
import Vacations from '#root/model/vacations';

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
      const accessToken = jwt.sign(
        { username: foundUser.username },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
        }
      );

      //Generate new refreshToken
      const refreshToken = jwt.sign(
        { username: foundUser.username },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
        }
      );

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
        message: 'login successfully',
      });
    } else _throw({ code: 400, message: 'no username or email' });
  }),

  logOut: asyncWrapper(async (req, res) => {
    const foundUser = await Users.findOneAndUpdate(
      { username: req.username },
      { accessToken: '', refreshToken: '', lastActiveAt: new Date() },
      { runValidators: true }
    ).lean();
    return foundUser
      ? res.status(200).json({ message: 'log out successfully' })
      : _throw({ code: 403, message: 'Invalid refreshToken' });
  }),

  register: asyncWrapper(async (req, res) => {
    const { username, password } = req.body;

    //Check for duplicate username in database
    const dupUsername = await Users.findOne({ username }).lean();
    dupUsername &&
      _throw({ code: 400, message: 'username has already been existed' });

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
    const { email } = req.query;
    const foundUser = await Users.findOne({ email });
    !foundUser &&
      _throw({
        code: 400,
        errors: { field: 'email', message: 'email is not register in server' },
        message: 'invalid email',
      });

    const passwordToken = new mongoose.Types.ObjectId();
    foundUser.passwordToken = passwordToken;

    await sendMail({ email, token: passwordToken });
    await foundUser.save();

    return res
      .status(200)
      .json({ data: '', message: 'send reset password email successfully' });
  }),

  reset: asyncWrapper(async (req, res) => {
    const { password, passwordToken } = req.body;
    const foundUser = await Users.findOne({ passwordToken });
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
    return res
      .status(200)
      .json({ data: '', message: 'user reset password successfully' });
  }),

  refresh: asyncWrapper(async (req, res) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    console.log(authHeader);

    // If the authorization header doesn't start with "Bearer ", throw an error
    !authHeader && _throw({ code: 401, message: 'auth header not found' });

    if (authHeader?.startsWith('Bearer ')) {
      const refreshToken = authHeader.split(' ')[1];

      //verify Token
      await jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async err => {
          err &&
            _throw({
              code: 403,
              errrors: [{ field: 'refreshToken', message: 'invalid' }],
              message: 'invalid token',
            });
        }
      );

      //Find User have refreshToken in database
      const foundUser = await Users.findOne({ refreshToken });
      !foundUser && _throw({ code: 400, message: 'invalid token' });

      //Create new accessToken
      const accessToken = jwt.sign(
        { username: foundUser.username },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
        }
      );

      //Save new accessToken to db
      foundUser.accessToken = accessToken;
      await foundUser.save();

      //Send new accessToken to front
      return res.status(200).json({
        data: { accessToken },
        message: 'refresh successfully',
      });
    }
  }),

  test: asyncWrapper(async (req, res) => {
    const list = [
      {
        title:
          'Destruction of chorioretinal lesion by photocoagulation of unspecified type',
        description:
          'Decreased fetal movements, unspecified trimester, fetus 4',
        memberList: null,
        shareStatus: 'public',
        shareList: null,
        startingTime: '2023-05-02',
        endingTime: '2023-05-29',
      },
      {
        title:
          'Microscopic examination of peritoneal and retroperitoneal specimen, culture',
        description: 'Coccidioidomycosis',
        memberList: null,
        shareStatus: 'public',
        shareList: null,
        startingTime: '2023-05-08',
        endingTime: '2023-05-31',
      },
      {
        title: 'Suture of laceration of urethra',
        description: 'Skeletal fluorosis, ankle and foot',
        memberList: null,
        shareStatus: 'public',
        shareList: null,
        startingTime: '2023-05-08',
        endingTime: '2023-05-21',
      },
      {
        title: 'Transposition of extraocular muscles',
        description: 'Maternal care for high head at term, fetus 3',
        memberList: null,
        shareStatus: 'public',
        shareList: null,
        startingTime: '2023-05-06',
        endingTime: '2023-06-06',
      },
      {
        title: 'Other cervical biopsy',
        description:
          'Unspecified injury of muscle, fascia and tendon of the posterior muscle group at thigh level, right thigh, initial encounter',
        memberList: null,
        shareStatus: 'public',
        shareList: null,
        startingTime: '2023-05-02',
        endingTime: '2023-05-18',
      },
      {
        title: 'Vaginal construction with graft or prosthesis',
        description: 'Central subluxation of unspecified hip, sequela',
        memberList: null,
        shareStatus: 'public',
        shareList: null,
        startingTime: '2023-05-03',
        endingTime: '2023-05-25',
      },
      {
        title:
          'Microscopic examination of specimen from kidney, ureter, perirenal and periureteral tissue, culture and sensitivity',
        description: 'Iridodialysis',
        memberList: null,
        shareStatus: 'public',
        shareList: null,
        startingTime: '2023-05-03',
        endingTime: '2023-06-06',
      },
      {
        title: 'Ligation of vas deferens',
        description: 'Retinopathy of prematurity, stage 4, unspecified eye',
        memberList: null,
        shareStatus: 'public',
        shareList: null,
        startingTime: '2023-05-08',
        endingTime: '2023-06-07',
      },
      {
        title: 'Biopsy of fallopian tube',
        description:
          'Nondisplaced intertrochanteric fracture of left femur, subsequent encounter for open fracture type IIIA, IIIB, or IIIC with malunion',
        memberList: null,
        shareStatus: 'public',
        shareList: null,
        startingTime: '2023-05-08',
        endingTime: '2023-06-03',
      },
      {
        title: 'Total wrist replacement',
        description:
          'Displaced comminuted fracture of shaft of left tibia, subsequent encounter for closed fracture with routine healing',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-09',
        endingTime: '2023-06-02',
      },
      {
        title: 'Stereotactic radiosurgery, not otherwise specified',
        description:
          'Nondisplaced spiral fracture of shaft of radius, unspecified arm, subsequent encounter for open fracture type IIIA, IIIB, or IIIC with routine healing',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-12',
        endingTime: '2023-06-03',
      },
      {
        title: 'Fitting and dispensing of spectacles',
        description:
          'Pathological fracture in other disease, unspecified site, sequela',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-01',
        endingTime: '2023-05-17',
      },
      {
        title: 'Other excision or destruction of lesion or tissue of cervix',
        description:
          'Nondisplaced subtrochanteric fracture of unspecified femur, subsequent encounter for open fracture type IIIA, IIIB, or IIIC with routine healing',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-09',
        endingTime: '2023-05-30',
      },
      {
        title: 'Synovectomy, wrist',
        description:
          'Traumatic rupture of collateral ligament of other finger at metacarpophalangeal and interphalangeal joint, sequela',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-13',
        endingTime: '2023-05-25',
      },
      {
        title: 'Other excision of vessels, thoracic vessels',
        description:
          'Sprain of interphalangeal joint of unspecified thumb, subsequent encounter',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-06',
        endingTime: '2023-05-26',
      },
      {
        title: 'Local excision or destruction of other lesion of nose',
        description:
          'Unspecified superficial injury of right ring finger, initial encounter',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-02',
        endingTime: '2023-05-19',
      },
      {
        title: 'Teleradiotherapy using photons',
        description:
          'Stress fracture, left ulna, subsequent encounter for fracture with nonunion',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-04',
        endingTime: '2023-05-17',
      },
      {
        title: 'Other operations on muscle, tendon, fascia, and bursa',
        description: 'Stress fracture, pelvis',
        memberList: null,
        shareStatus: 'onlyme',
        shareList: null,
        startingTime: '2023-05-10',
        endingTime: '2023-06-01',
      },
      {
        title: 'Other perfusion',
        description: 'Persistent postprocedural fistula, sequela',
        memberList: null,
        shareStatus: 'onlyme',
        shareList: null,
        startingTime: '2023-05-09',
        endingTime: '2023-05-22',
      },
      {
        title: 'Resection of vessel with replacement, upper limb vessels',
        description:
          'Other extraarticular fracture of lower end of right radius, subsequent encounter for open fracture type IIIA, IIIB, or IIIC with routine healing',
        memberList: null,
        shareStatus: 'onlyme',
        shareList: null,
        startingTime: '2023-05-07',
        endingTime: '2023-06-07',
      },
      {
        title: 'Other removal of both ovaries at same operative episode',
        description: 'Metaphyseal dysplasia',
        memberList: null,
        shareStatus: 'onlyme',
        shareList: null,
        startingTime: '2023-05-12',
        endingTime: '2023-06-08',
      },
      {
        title:
          'Open reduction of fracture with internal fixation, carpals and metacarpals',
        description:
          'Epidural hemorrhage with loss of consciousness greater than 24 hours with return to pre-existing conscious level, initial encounter',
        memberList: null,
        shareStatus: 'onlyme',
        shareList: null,
        startingTime: '2023-05-01',
        endingTime: '2023-05-17',
      },
      {
        title: 'Thoracentesis',
        description: 'Contusion of left forearm, sequela',
        memberList: null,
        shareStatus: 'onlyme',
        shareList: null,
        startingTime: '2023-05-07',
        endingTime: '2023-06-10',
      },
      {
        title: 'Other partial resection of small intestine',
        description:
          'Open bite of left front wall of thorax without penetration into thoracic cavity, subsequent encounter',
        memberList: null,
        shareStatus: 'onlyme',
        shareList: null,
        startingTime: '2023-05-05',
        endingTime: '2023-05-18',
      },
      {
        title: 'Urethral meatotomy',
        description: 'Allergic rhinitis due to food',
        memberList: null,
        shareStatus: 'onlyme',
        shareList: null,
        startingTime: '2023-05-08',
        endingTime: '2023-06-03',
      },
      {
        title: 'Removal of nasal packing',
        description:
          'Laceration without foreign body of right thumb without damage to nail, sequela',
        memberList: null,
        shareStatus: 'onlyme',
        shareList: null,
        startingTime: '2023-05-11',
        endingTime: '2023-05-18',
      },
      {
        title: 'Open reduction of dislocation of shoulder',
        description:
          'Bus occupant (driver) (passenger) injured in other specified transport accidents, subsequent encounter',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-01',
        endingTime: '2023-06-04',
      },
      {
        title: 'Other repair of rectum',
        description:
          'Nondisplaced oblique fracture of shaft of right radius, subsequent encounter for open fracture type I or II with malunion',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-03',
        endingTime: '2023-05-28',
      },
      {
        title: 'Other evisceration of eyeball',
        description:
          'Poisoning by appetite depressants, accidental (unintentional)',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-04',
        endingTime: '2023-06-08',
      },
      {
        title:
          'Insertion of implantable pressure sensor without lead for intracardiac or great vessel hemodynamic monitoring',
        description:
          'Other rheumatoid arthritis with rheumatoid factor of left ankle and foot',
        memberList: null,
        shareStatus: 'protected',
        shareList: null,
        startingTime: '2023-05-01',
        endingTime: '2023-05-21',
      },
    ];
    const foundUsers = await Users.find();

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const author = foundUsers[i];
      item.userId = author._id;
      item.memberList = [author._id];
      for (let j = 0; j < 2; j++) {
        const userList = foundUsers.filter(user => user._id !== author._id);
        const random = Math.ceil(Math.random() * (userList.length - 1));

        item.memberList.push(userList[random]._id);
      }

      item.shareStatus === 'protected' && (item.shareList = item.memberList);
      item.createdAt = new Date();
    }

    const listAdd = await Vacations.insertMany(list);

    return res.status(200).json({ data: listAdd, message: 'add successfully' });
  }),
};

export default usersController;
