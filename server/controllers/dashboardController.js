const Task = require('../models/Task');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/dashboard/stats  -> computed live from the user's tasks in MongoDB
exports.getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const mine = { user: req.user._id };
  const [total, pending, completed, overdue, upcoming, recent] = await Promise.all([
    Task.countDocuments(mine),
    Task.countDocuments({ ...mine, status: 'pending' }),
    Task.countDocuments({ ...mine, status: 'completed' }),
    Task.countDocuments({ ...mine, status: 'pending', dueDate: { $lt: now } }),
    Task.find({ ...mine, status: 'pending', dueDate: { $gte: now } }).sort({ dueDate: 1 }).limit(5),
    Task.find(mine).sort({ createdAt: -1 }).limit(5),
  ]);
  res.json({ success: true, data: { stats: { total, pending, completed, overdue }, upcoming, recent } });
});
