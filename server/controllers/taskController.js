const Task = require('../models/Task');
const asyncHandler = require('../middleware/asyncHandler');

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'completed'];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Validates the fields that are present; `requireTitle` is true for create
function validate(body, requireTitle) {
  const errors = {};
  const str = (k, max) => {
    if (body[k] === undefined) return;
    if (typeof body[k] !== 'string') errors[k] = `${k} must be text.`;
    else if (body[k].trim().length > max) errors[k] = `${k} must be ${max} characters or fewer.`;
  };
  if (requireTitle || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) errors.title = 'Title is required.';
  }
  str('title', 120); str('description', 1000); str('subject', 60);
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) errors.priority = 'Priority must be low, medium or high.';
  if (body.status !== undefined && !STATUSES.includes(body.status)) errors.status = 'Status must be pending or completed.';
  if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== '' && Number.isNaN(new Date(body.dueDate).getTime())) {
    errors.dueDate = 'Due date is not a valid date.';
  }
  return errors;
}

// Copy only whitelisted fields (prevents users from setting `user`, `_id`, etc.)
function pick(body) {
  const out = {};
  ['title', 'description', 'subject', 'priority', 'status'].forEach((k) => {
    if (body[k] !== undefined) out[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
  });
  if (body.dueDate !== undefined) out.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  return out;
}

const bad = (res, errors) => res.status(400).json({ success: false, message: 'Please fix the highlighted fields.', errors });
const notFound = (res) => res.status(404).json({ success: false, message: 'Task not found.' });

// POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const errors = validate(req.body, true);
  if (Object.keys(errors).length) return bad(res, errors);
  const task = await Task.create({ ...pick(req.body), user: req.user._id });
  res.status(201).json({ success: true, data: { task } });
});

// GET /api/tasks?search=&status=&priority=&sort=dueDate|dueDate-desc|newest
exports.getTasks = asyncHandler(async (req, res) => {
  const { search, status, priority, sort } = req.query;
  const filter = { user: req.user._id };
  if (STATUSES.includes(status)) filter.status = status;
  if (PRIORITIES.includes(priority)) filter.priority = priority;
  if (typeof search === 'string' && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { subject: rx }];
  }
  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  if (sort === 'dueDate' || sort === 'dueDate-desc') {
    const dir = sort === 'dueDate' ? 1 : -1;
    // tasks without a due date always go last
    tasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return (a.dueDate - b.dueDate) * dir;
    });
  }
  res.json({ success: true, data: { count: tasks.length, tasks } });
});

// GET /api/tasks/:id   (always scoped to the logged-in user)
exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) return notFound(res);
  res.json({ success: true, data: { task } });
});

// PUT /api/tasks/:id
exports.updateTask = asyncHandler(async (req, res) => {
  const errors = validate(req.body, false);
  if (Object.keys(errors).length) return bad(res, errors);
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: pick(req.body) },
    { new: true, runValidators: true }
  );
  if (!task) return notFound(res);
  res.json({ success: true, data: { task } });
});

// PATCH /api/tasks/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  if (!STATUSES.includes(req.body.status)) {
    return bad(res, { status: 'Status must be pending or completed.' });
  }
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { status: req.body.status } },
    { new: true }
  );
  if (!task) return notFound(res);
  res.json({ success: true, data: { task } });
});

// DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) return notFound(res);
  res.json({ success: true, message: 'Task deleted.' });
});
