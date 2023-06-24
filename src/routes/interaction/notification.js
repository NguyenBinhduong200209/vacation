import express from 'express';
import notiController from '#root/controller/interaction/notification';
import verifyJWT from '#root/middleware/verifyJWT';
const router = express.Router();

router.use(verifyJWT);
router.get('/', notiController.getMany);
router.put('/:type/:id', notiController.updateStatus);

export default router;
