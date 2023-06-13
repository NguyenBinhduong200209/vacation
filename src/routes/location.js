import express from 'express';
import locationController from '#root/controller/location';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.route('/').get(locationController.getList).post(verifyJWT, locationController.addNew);
export default router;
