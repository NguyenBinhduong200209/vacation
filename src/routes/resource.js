import express from 'express';
import resourceController from '#root/controller/resource';
import verifyJWT from '#root/middleware/verifyJWT';
import checkAuthor from '#root/middleware/checkForbidden/checkAuthor';
import checkPermission from '#root/middleware/checkForbidden/checkPermission';

const router = express.Router();

router.use(verifyJWT);
router.route('/').get(checkPermission(), resourceController.getMany);

router.route('/:id').delete(checkAuthor('resource'), resourceController.deleteOne);

export default router;
