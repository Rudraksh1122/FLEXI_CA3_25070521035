const Note = require('../models/Note');
const asyncHandler = require('../middleware/asyncHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (k) => k[0].toUpperCase() + k.slice(1);

function validate(body, isCreate) {
  const errors = {};
  const check = (k, max, required) => {
    const v = body[k];
    if (v === undefined) { if (required && isCreate) errors[k] = `${label(k)} is required.`; return; }
    if (typeof v !== 'string') errors[k] = `${label(k)} must be text.`;
    else if (required && !v.trim()) errors[k] = `${label(k)} is required.`;
    else if (v.trim().length > max) errors[k] = `${label(k)} must be ${max} characters or fewer.`;
  };
  check('title', 120, true);
  check('content', 10000, true);
  check('subject', 60, false);
  return errors;
}

const pick = (body) => {
  const out = {};
  ['title', 'content', 'subject'].forEach((k) => { if (body[k] !== undefined) out[k] = body[k].trim(); });
  return out;
};
const bad = (res, errors) => res.status(400).json({ success: false, message: 'Please fix the highlighted fields.', errors });
const notFound = (res) => res.status(404).json({ success: false, message: 'Note not found.' });

// POST /api/notes
exports.createNote = asyncHandler(async (req, res) => {
  const errors = validate(req.body, true);
  if (Object.keys(errors).length) return bad(res, errors);
  const note = await Note.create({ ...pick(req.body), user: req.user._id });
  res.status(201).json({ success: true, data: { note } });
});

// GET /api/notes?search=
exports.getNotes = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  const { search } = req.query;
  if (typeof search === 'string' && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: rx }, { content: rx }, { subject: rx }];
  }
  const notes = await Note.find(filter).sort({ updatedAt: -1 });
  res.json({ success: true, data: { count: notes.length, notes } });
});

// GET /api/notes/:id
exports.getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) return notFound(res);
  res.json({ success: true, data: { note } });
});

// PUT /api/notes/:id
exports.updateNote = asyncHandler(async (req, res) => {
  const errors = validate(req.body, false);
  if (Object.keys(errors).length) return bad(res, errors);
  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: pick(req.body) },
    { new: true, runValidators: true }
  );
  if (!note) return notFound(res);
  res.json({ success: true, data: { note } });
});

// DELETE /api/notes/:id
exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!note) return notFound(res);
  res.json({ success: true, message: 'Note deleted.' });
});
