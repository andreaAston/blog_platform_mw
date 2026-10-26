import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const isWriter = user && (user.role === 'author' || user.role === 'admin');

  function handleLogout() {
    logout();
    close();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" onClick={close}>
          Malawi Blog
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Close' : 'Menu'}
        </button>

        <nav id="main-nav" className={`nav-links ${open ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/" end onClick={close}>Home</NavLink>
          {isWriter && <NavLink to="/dashboard" onClick={close}>Dashboard</NavLink>}
          {isWriter && <NavLink to="/write" onClick={close}>Write</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
          {user ? (
            <>
              <span className="nav-user">{user.name} <span className="badge">{user.role}</span></span>
              <button type="button" className="btn btn-outline btn-small" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Log in</NavLink>
              <Link to="/register" className="btn btn-small" onClick={close}>Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
