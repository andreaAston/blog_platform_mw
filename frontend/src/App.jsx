import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { Loading } from './components/Status.jsx';
import Feed from './pages/Feed.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Register from './pages/Register.jsx';

// Code splitting: these pages (and the Markdown libraries they use) are only downloaded
// when someone actually opens them. Good for readers on limited data.
const PostPage = lazy(() => import('./pages/PostPage.jsx'));
const Editor = lazy(() => import('./pages/Editor.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));

function Layout() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Navbar />
      <main id="main-content">
        <Suspense fallback={<div className="container page"><Loading /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="footer">
        <div className="container small muted">Blog platform 2026</div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Feed />} />
        <Route path="post/:id" element={<PostPage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute roles={['author', 'admin']} />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="write" element={<Editor />} />
          <Route path="write/:id" element={<Editor />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
