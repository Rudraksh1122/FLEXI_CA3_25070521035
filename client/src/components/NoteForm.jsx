import { useState } from 'react';
import Modal from './Modal.jsx';
import Field from './Field.jsx';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function NoteForm({ note, onClose, onSaved }) {
  const { notify } = useToast();
  const editing = Boolean(note?._id);
  const [form, setForm] = useState({ title: note?.title || '', subject: note?.subject || '', content: note?.content || '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Give the note a title.';
    if (!form.content.trim()) errs.content = 'Write something in the note.';
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const saved = editing ? await api.notes.update(note._id, form) : await api.notes.create(form);
      notify('success', editing ? 'Note updated.' : 'Note created.');
      onSaved(saved);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit note' : 'New note'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {formError && <div className="alert alert-error" role="alert">{formError}</div>}
        <Field label="Title" id="n-title" error={errors.title}>
          <input id="n-title" value={form.title} onChange={set('title')} maxLength={120} autoFocus />
        </Field>
        <Field label="Subject" id="n-subject" error={errors.subject}>
          <input id="n-subject" value={form.subject} onChange={set('subject')} maxLength={60} placeholder="e.g. Operating Systems" />
        </Field>
        <Field label="Content" id="n-content" error={errors.content}>
          <textarea id="n-content" rows={8} value={form.content} onChange={set('content')} maxLength={10000} />
        </Field>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create note'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
