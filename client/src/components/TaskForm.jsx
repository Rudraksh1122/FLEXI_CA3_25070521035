import { useState } from 'react';
import Modal from './Modal.jsx';
import Field from './Field.jsx';
import { api } from '../services/api.js';
import { fromInputDate, toInputDate } from '../services/format.js';
import { useToast } from '../context/ToastContext.jsx';

// Create (no `task` prop) or edit (with `task`) a task. Talks to the API itself.
export default function TaskForm({ task, onClose, onSaved }) {
  const { notify } = useToast();
  const editing = Boolean(task?._id);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    subject: task?.subject || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    dueDate: toInputDate(task?.dueDate),
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Give the task a title.';
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;

    const payload = { ...form, dueDate: fromInputDate(form.dueDate) };
    setSaving(true);
    try {
      const saved = editing ? await api.tasks.update(task._id, payload) : await api.tasks.create(payload);
      notify('success', editing ? 'Task updated.' : 'Task created.');
      onSaved(saved);
    } catch (err) {
      setErrors(err.errors || {});
      setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {formError && <div className="alert alert-error" role="alert">{formError}</div>}
        <Field label="Title" id="t-title" error={errors.title}>
          <input id="t-title" value={form.title} onChange={set('title')} maxLength={120} autoFocus placeholder="e.g. Finish DBMS assignment" />
        </Field>
        <Field label="Description" id="t-desc" error={errors.description}>
          <textarea id="t-desc" rows={3} value={form.description} onChange={set('description')} maxLength={1000} />
        </Field>
        <div className="grid-2">
          <Field label="Subject" id="t-subject" error={errors.subject}>
            <input id="t-subject" value={form.subject} onChange={set('subject')} maxLength={60} placeholder="e.g. Mathematics" />
          </Field>
          <Field label="Due date" id="t-due" error={errors.dueDate}>
            <input id="t-due" type="date" value={form.dueDate} onChange={set('dueDate')} />
          </Field>
          <Field label="Priority" id="t-priority" error={errors.priority}>
            <select id="t-priority" value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
          <Field label="Status" id="t-status" error={errors.status}>
            <select id="t-status" value={form.status} onChange={set('status')}>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
