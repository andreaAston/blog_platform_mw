import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import usePageTitle from '../hooks/usePageTitle.js';
import { errorText } from '../utils.js';

export default function Register() {
  usePageTitle('Sign up');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'reader' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function validate() {
    const found = {};
    if (form.name.trim().length < 2) found.name = 'Name must be at least 2 characters.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Enter a valid email address.';
    if (form.password.length < 8) found.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) found.password = 'Use at least one letter and one number.';
    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(errorText(err)); // includes "An account with that email already exists"
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container page narrow">
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit} noValidate className="form">
        {formError && <p className="alert alert-error" role="alert">{formError}</p>}
        <label htmlFor="name">Name</label>
        <input id="name" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} />
        {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} />
        {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} aria-invalid={Boolean(errors.password)} />
        {errors.password && <p className="field-error" role="alert">{errors.password}</p>}
        <label htmlFor="role">I want to</label>
        <select id="role" value={form.role} onChange={set('role')}>
          <option value="reader">Read and comment</option>
          <option value="author">Write posts (author)</option>
        </select>
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Creating account…' : 'Sign up'}</button>
      </form>
      <p>Already registered? <Link to="/login">Log in</Link></p>
    </div>
  );
}
