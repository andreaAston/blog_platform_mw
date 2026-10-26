import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loading } from './Status.jsx';

// Wraps a group of routes. This is a convenience for the USER (nobody sees a broken page).
// The real protection is on the API, which re-checks the token and role on every request.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container page">
        <h1>Not allowed</h1>
        <p>Your account ({user.role}) cannot open this page.</p>
      </div>
    );
  }
  return <Outlet />;
}
