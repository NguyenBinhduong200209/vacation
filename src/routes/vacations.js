import express from "express";
import vacationController from "#root/controller/userinfo";
import verifyJWT from "#root/middleware/verifyJWT";

const router = express.Router();

router

    .get("/", vacationController.getuservacation)



export default router;
