import express from 'express';
import vacationController from '#root/controller/vacation/vacation';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(vacationController.getMany).post(vacationController.addNew);

router
  .route('/:id')
  .get(checkPermission('vacation'), vacationController.getOne)
  .put(checkAuthor('vacation'), vacationController.update)
  .delete(checkAuthor('vacation'), vacationController.delete);

export default router;
