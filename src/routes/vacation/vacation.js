import express from 'express';
import vacationController from '#root/controller/vacation/vacation';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';
import viewController from '#root/controller/interaction/views';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(vacationController.getMany).post(vacationController.addNew);

router
  .route('/:id')
  .get(
    checkPermission({ modelType: 'vacations', listType: 'shareList' }),
    viewController.update('vacations'),
    vacationController.getOne
  )
  .put(checkAuthor({ modelType: 'vacations' }), vacationController.update)
  .delete(checkAuthor({ modelType: 'vacations' }), vacationController.delete);

export default router;
