import express from 'express';
import vacationController from '#root/controller/vacation';
import verifyJWT from '#root/middleware/verifyJWT';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(vacationController.getMany).post(vacationController.addNew);
router.route('/user').get(vacationController.getManyByUser);
router.route('/:id').get(vacationController.getOne).put(vacationController.update).delete(vacationController.delete);

export default router;
