import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { dueLabel, greeting, isOverdue } from '../services/format.js';
import { Spinner, ErrorState, EmptyState } from '../components/States.jsx';
import { PriorityBadge } from '../components/Badges.jsx';
import TaskForm from '../components/TaskForm.jsx';
import Icon from '../components/Icon.jsx';

function TaskLine({ task }) {
  return (
    <li className="line">
      <div>
        <strong className={task.status === 'completed' ? 'done' : ''}>{task.title}</strong>
        <small className={isOverdue(task) ? 'overdue-text' : 'muted'}>
          {task.subject ? `${task.subject} · ` : ''}{dueLabel(task)}
        </small>
      </div>
      <PriorityBadge priority={task.priority} />
    </li>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await api.dashboard.stats());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const firstName = user.name.split(' ')[0];
  const s = data?.stats;
  const pct = s && s.total ? Math.round((s.completed / s.total) * 100) : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{greeting()}, {firstName}</h1>
          <p className="muted">Here is where your work stands right now.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Icon name="plus" /> Quick add task</button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !data && <Spinner label="Loading your dashboard" />}

      {data && (
        <>
          <section className="stats" aria-label="Task statistics">
            <div className="stat"><span>Total tasks</span><strong>{s.total}</strong></div>
            <div className="stat"><span>Pending</span><strong>{s.pending}</strong></div>
            <div className="stat stat-ok"><span>Completed</span><strong>{s.completed}</strong></div>
            <div className={`stat ${s.overdue ? 'stat-bad' : ''}`}><span>Overdue</span><strong>{s.overdue}</strong></div>
          </section>

          {s.total === 0 ? (
            <div className="card">
              <EmptyState
                title="No tasks yet"
                text="Add your first assignment and it will show up here with its deadline."
                action={<button className="btn btn-primary" onClick={() => setAdding(true)}>Add a task</button>}
              />
            </div>
          ) : (
            <>
              <section className="card progress-card">
                <div className="progress-text">
                  <strong>{pct}% of your tasks are done</strong>
                  <span className="muted">{s.completed} of {s.total} completed</span>
                </div>
                <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                  <div style={{ width: `${pct}%` }} />
                </div>
              </section>

              <div className="grid-cards">
                <section className="card">
                  <div className="card-head"><h2>Upcoming deadlines</h2><Link to="/tasks">All tasks</Link></div>
                  {data.upcoming.length === 0
                    ? <p className="muted">Nothing pending with a future deadline.</p>
                    : <ul className="lines">{data.upcoming.map((t) => <TaskLine key={t._id} task={t} />)}</ul>}
                </section>
                <section className="card">
                  <div className="card-head"><h2>Recent tasks</h2><Link to="/tasks">Manage</Link></div>
                  <ul className="lines">{data.recent.map((t) => <TaskLine key={t._id} task={t} />)}</ul>
                </section>
              </div>
            </>
          )}
        </>
      )}

      {adding && <TaskForm onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
    </>
  );
}
