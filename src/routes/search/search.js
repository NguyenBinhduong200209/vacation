import express from 'express';
import searchController from '#root/controller/search/search';
const router = express.Router();

router.route('/').get(searchController.searchMany);
router.route('/:type').get(searchController.searchOne);

export default router;
