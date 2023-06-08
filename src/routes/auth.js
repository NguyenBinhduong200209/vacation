import express from "express";
import usersController from "#root/controller/auth";
import verifyJWT from "#root/middleware/verifyJWT";

const router = express.Router();

router
  .post("/login", usersController.logIn)
  .post("/logout", verifyJWT, usersController.logOut)
  .post("/register", usersController.register)
  .post("/refresh", usersController.getAccessfromRefresh)
  .put("/update", verifyJWT, usersController.update);

export default router;
