import jwt from "jsonwebtoken";
import Users from "#root/model/users";
import _throw from "#root/utils/_throw";

const verifyJWT = (req, res, next) => {
  // Get the authorization header from the request
  const authHeader = req.headers.authorization || req.headers.Authorization;

  console.log(authHeader); // Log the authorization header to the console

  // If the authorization header doesn't start with "Bearer ", throw an error
  !authHeader && _throw(401, "auth header not found");

  if (authHeader?.startsWith("Bearer ")) {
    const accessToken = authHeader.split(" ")[1];

    // Verify the access token using the secret key
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      // If there is an error verifying the token, return a 403 Forbidden status code
      if (err) return res.sendStatus(403);

      // Find the token in the database, if the token is not found in the database, return a 403 Forbidden status code
      const foundUser = await Users.findOne({ accessToken });
      if (!foundUser) return res.sendStatus(403);

      // Set the user properties of the request object to the values from the decoded token
      req.username = decoded.username;
      req.userInfo = foundUser;

      // Call the next middleware function
      next();
    });
  }
};

export default verifyJWT;
