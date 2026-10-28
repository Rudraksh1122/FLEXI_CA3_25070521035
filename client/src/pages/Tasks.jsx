import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { dueLabel, isOverdue } from '../services/format.js';
import { Spinner, ErrorState, EmptyState } from '../components/States.jsx';
import { PriorityBadge } from '../components/Badges.jsx';
import { ConfirmDialog } from '../components/Modal.jsx';
import TaskForm from '../components/TaskForm.jsx';
import Icon from '../components/Icon.jsx';

export default function Tasks() {
  const { notify } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', sort: 'dueDate' });
  const [search, setSearch] = useState(''); // debounced copy of filters.search
  const [form, setForm] = useState(null); // null = closed, {} = new task, task = editing
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(filters.search), 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTasks(await api.tasks.list({ search, status: filters.status, priority: filters.priority, sort: filters.sort }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, filters.status, filters.priority, filters.sort]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const filtered = Boolean(search || filters.status || filters.priority);

  const toggle = async (task) => {
    const next = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await api.tasks.setStatus(task._id, next);
      notify('success', next === 'completed' ? 'Marked as completed.' : 'Marked as pending.');
      load();
    } catch (e) {
      notify('error', e.message);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.tasks.remove(toDelete._id);
      notify('success', 'Task deleted.');
      setToDelete(null);
      load();
    } catch (e) {
      notify('error', e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tasks</h1>
          <p className="muted">Assignments and to-dos, sorted by deadline.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({})}><Icon name="plus" /> New task</button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input type="search" aria-label="Search tasks" placeholder="Search tasks" value={filters.search} onChange={setFilter('search')} />
        </div>
        <select aria-label="Filter by status" value={filters.status} onChange={setFilter('status')}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <select aria-label="Filter by priority" value={filters.priority} onChange={setFilter('priority')}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select aria-label="Sort tasks" value={filters.sort} onChange={setFilter('sort')}>
          <option value="dueDate">Earliest deadline first</option>
          <option value="dueDate-desc">Latest deadline first</option>
          <option value="newest">Newest created</option>
        </select>
      </div>

      {loading && <Spinner label="Loading tasks" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && tasks.length === 0 && (
        <div className="card">
          {filtered ? (
            <EmptyState icon="search" title="No tasks match" text="Try a different search or clear the filters." />
          ) : (
            <EmptyState
              title="No tasks yet"
              text="Create a task to start tracking your deadlines."
              action={<button className="btn btn-primary" onClick={() => setForm({})}>Create your first task</button>}
            />
          )}
        </div>
      )}

      {!loading && !error && tasks.length > 0 && (
        <ul className="task-list">
          {tasks.map((t) => (
            <li key={t._id} className={`task ${t.status === 'completed' ? 'is-done' : ''}`}>
              <button
                className={`check ${t.status === 'completed' ? 'checked' : ''}`}
                onClick={() => toggle(t)}
                aria-label={t.status === 'completed' ? `Mark "${t.title}" as pending` : `Mark "${t.title}" as completed`}
                title={t.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
              >
                {t.status === 'completed' && <Icon name="check" size={14} />}
              </button>
              <div className="task-body">
                <strong>{t.title}</strong>
                {t.description && <p>{t.description}</p>}
                <div className="meta">
                  {t.subject && <span className="chip">{t.subject}</span>}
                  <PriorityBadge priority={t.priority} />
                  <span className={isOverdue(t) ? 'overdue-text' : 'muted'}><Icon name="calendar" size={14} /> {dueLabel(t)}</span>
                </div>
              </div>
              <div className="task-actions">
                <button className="icon-btn" onClick={() => setForm(t)} aria-label={`Edit "${t.title}"`}><Icon name="edit" /></button>
                <button className="icon-btn danger" onClick={() => setToDelete(t)} aria-label={`Delete "${t.title}"`}><Icon name="trash" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && <TaskForm task={form._id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
      {toDelete && (
        <ConfirmDialog
          title="Delete this task?"
          message={`"${toDelete.title}" will be permanently removed. This cannot be undone.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
