import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate } from '../services/format.js';
import { Spinner, ErrorState, EmptyState } from '../components/States.jsx';
import { ConfirmDialog } from '../components/Modal.jsx';
import NoteForm from '../components/NoteForm.jsx';
import Icon from '../components/Icon.jsx';

export default function Notes() {
  const { notify } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setNotes(await api.notes.list({ search }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.notes.remove(toDelete._id);
      notify('success', 'Note deleted.');
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
          <h1>Notes</h1>
          <p className="muted">Lecture notes and revision points, by subject.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({})}><Icon name="plus" /> New note</button>
      </div>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input type="search" aria-label="Search notes" placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {loading && <Spinner label="Loading notes" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && notes.length === 0 && (
        <div className="card">
          {search ? (
            <EmptyState icon="search" title="No notes match" text="Try a different search term." />
          ) : (
            <EmptyState
              icon="notes"
              title="No notes yet"
              text="Write down what you learn in class so it is easy to find later."
              action={<button className="btn btn-primary" onClick={() => setForm({})}>Create your first note</button>}
            />
          )}
        </div>
      )}

      {!loading && !error && notes.length > 0 && (
        <div className="notes-grid">
          {notes.map((n) => (
            <article key={n._id} className="card note">
              <div className="card-head">
                <h2>{n.title}</h2>
                <div className="task-actions">
                  <button className="icon-btn" onClick={() => setForm(n)} aria-label={`Edit "${n.title}"`}><Icon name="edit" /></button>
                  <button className="icon-btn danger" onClick={() => setToDelete(n)} aria-label={`Delete "${n.title}"`}><Icon name="trash" /></button>
                </div>
              </div>
              {n.subject && <span className="chip">{n.subject}</span>}
              <p className="note-content">{n.content}</p>
              <small className="muted">Updated {formatDate(n.updatedAt)}</small>
            </article>
          ))}
        </div>
      )}

      {form && <NoteForm note={form._id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
      {toDelete && (
        <ConfirmDialog
          title="Delete this note?"
          message={`"${toDelete.title}" will be permanently removed. This cannot be undone.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
