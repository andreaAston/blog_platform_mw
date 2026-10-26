import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import { errorText } from '../utils.js';

export default function Login() {
  usePageTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Enter a valid email address.';
    if (!form.password) found.password = 'Enter your password.';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setFormError(errorText(err)); // e.g. "Invalid email or password" or "Too many failed login attempts…"
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container page narrow">
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} noValidate className="form">
        {formError && <p className="alert alert-error" role="alert">{formError}</p>}
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} />
        {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} aria-invalid={Boolean(errors.password)} />
        {errors.password && <p className="field-error" role="alert">{errors.password}</p>}
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}
