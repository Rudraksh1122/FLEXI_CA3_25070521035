import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Field from '../components/Field.jsx';
import { Logo } from '../components/Icon.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter your full name.';
    if (!form.email.trim()) errs.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address, like name@college.edu.';
    if (form.password.length < 6) errs.password = 'Use at least 6 characters.';
    if (form.confirmPassword !== form.password) errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    setFormError('');
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      notify('success', 'Account created. Welcome to Studyboard!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors(err.errors || {}); // e.g. "Email already registered."
      setFormError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/"><Logo /></Link>
        <h1>Create your account</h1>
        <p className="muted">It takes under a minute.</p>
        <form onSubmit={submit} noValidate>
          {formError && <div className="alert alert-error" role="alert">{formError}</div>}
          <Field label="Full name" id="name" error={errors.name}>
            <input id="name" autoComplete="name" value={form.name} onChange={set('name')} maxLength={60} />
          </Field>
          <Field label="Email address" id="email" error={errors.email}>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Password" id="password" error={errors.password} hint="At least 6 characters.">
            <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
          </Field>
          <Field label="Confirm password" id="confirmPassword" error={errors.confirmPassword}>
            <input id="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} />
          </Field>
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
