import express from "express";
import usersinforController from "#root/controller/userinfo";


const router = express.Router();

router
    .get("/login", usersinforController.userprofile)


export default router;
