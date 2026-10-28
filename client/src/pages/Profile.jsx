import { useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate } from '../services/format.js';
import Field from '../components/Field.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name.');
    setError('');
    setSaving(true);
    try {
      setUser(await api.auth.updateProfile({ name }));
      notify('success', 'Profile updated.');
    } catch (err) {
      setError(err.errors?.name || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p className="muted">Your account details.</p>
        </div>
      </div>

      <div className="grid-cards">
        <section className="card">
          <h2>Account information</h2>
          <dl className="details">
            <dt>Name</dt><dd>{user.name}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Member since</dt><dd>{formatDate(user.createdAt)}</dd>
          </dl>
        </section>

        <section className="card">
          <h2>Change your name</h2>
          <form onSubmit={submit} noValidate>
            <Field label="Full name" id="profile-name" error={error}>
              <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </Field>
            <button className="btn btn-primary" disabled={saving || name.trim() === user.name}>
              {saving ? 'Saving…' : 'Save name'}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
