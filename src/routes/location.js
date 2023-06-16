import express from 'express';
import locationController from '#root/controller/location';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.route('/').get(locationController.getListBasedOnLevel).post(verifyJWT, locationController.addNew);
router.get('/:quantity', locationController.getListBasedOnTrend);
export default router;
