import express from 'express';
import locationController from '#root/controller/location';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.route('/').get(locationController.getMany).post(verifyJWT, locationController.addNew);
router.get('/:id', locationController.getOne);
export default router;
