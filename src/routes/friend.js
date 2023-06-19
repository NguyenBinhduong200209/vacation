import express from "express";
import friendsController from "#root/controller/friend";
import verifyJWT from '#root/middleware/verifyJWT';


const router = express.Router();

router
    .post("/addfriend",verifyJWT, friendsController.addFriend)
    .get("/getfriendlist",verifyJWT,friendsController.getFriendList)
    .delete("/removefriend",verifyJWT, friendsController.removeFriend)


export default router;
