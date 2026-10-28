const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    content: { type: String, required: [true, 'Content is required'], trim: true, maxlength: 10000 },
    subject: { type: String, trim: true, maxlength: 60, default: '' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
