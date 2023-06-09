import jwt from "jsonwebtoken";
import Users from "#root/model/users";
import _throw from "#root/utils/_throw";
import dbConnect from "#root/config/dbConnect";

const verifyJWT = async (req, res, next) => {
  // Get the authorization header from the request
  const authHeader = req.headers.authorization || req.headers.Authorization;

  console.log(authHeader); // Log the authorization header to the console

  // If the authorization header doesn't start with "Bearer ", throw an error
  !authHeader && _throw(401, "auth header not found");

  if (authHeader?.startsWith("Bearer ")) {
    const accessToken = authHeader.split(" ")[1];

    // Verify the access token using the secret key
    await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      err && _throw({ code: 403, message: "invalid token" });
      req.username = decoded.username;
    });

    // Find the token in the database, if the token is not found in the database, return a 403 Forbidden status code
    await dbConnect();
    const foundUser = await Users.findOne({ accessToken });
    !foundUser && _throw({ code: 403, message: "outdated token" });
    req.userInfo = foundUser;

    // Call the next middleware function
    next();
  }
};

export default verifyJWT;
