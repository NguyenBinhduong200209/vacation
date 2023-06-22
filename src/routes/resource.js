import express from 'express';
import resourceController from '#root/controller/resource';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.get('/', verifyJWT, resourceController.addNew);

export default router;
