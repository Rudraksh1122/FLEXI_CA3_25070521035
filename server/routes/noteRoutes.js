const router = require('express').Router();
const c = require('../controllers/noteController');
const { protect, validateIdParam } = require('../middleware/auth');

router.use(protect);
router.param('id', validateIdParam);

router.route('/').get(c.getNotes).post(c.createNote);
router.route('/:id').get(c.getNote).put(c.updateNote).delete(c.deleteNote);

module.exports = router;
