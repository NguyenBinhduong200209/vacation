import express from 'express';
import locationController from '#root/controller/location';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.get('/', locationController.getList);
router.post('/add', verifyJWT, locationController.addNew);
export default router;
