import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Field from '../components/Field.jsx';
import { Logo } from '../components/Icon.jsx';

export default function Login() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Enter your email address.';
    if (!form.password) errs.password = 'Enter your password.';
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      notify('success', 'Welcome back!');
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/"><Logo /></Link>
        <h1>Log in</h1>
        <p className="muted">Pick up where you left off.</p>
        <form onSubmit={submit} noValidate>
          {formError && <div className="alert alert-error" role="alert">{formError}</div>}
          <Field label="Email address" id="email" error={errors.email}>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Password" id="password" error={errors.password}>
            <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} />
          </Field>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        </form>
        <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
