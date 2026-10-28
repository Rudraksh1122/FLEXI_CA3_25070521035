const router = require('express').Router();
const c = require('../controllers/taskController');
const { protect, validateIdParam } = require('../middleware/auth');

router.use(protect);
router.param('id', validateIdParam);

router.route('/').get(c.getTasks).post(c.createTask);
router.route('/:id').get(c.getTask).put(c.updateTask).delete(c.deleteTask);
router.patch('/:id/status', c.updateStatus);

module.exports = router;
