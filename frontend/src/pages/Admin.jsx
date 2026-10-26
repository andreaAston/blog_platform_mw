import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { ErrorMessage, Loading } from '../components/Status.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useFetch from '../hooks/useFetch.js';
import usePageTitle from '../hooks/usePageTitle.js';
import { errorText, formatDate } from '../utils.js';

function UsersTab() {
  const { user: me } = useAuth();
  const { data, loading, error, reload, setData } = useFetch(() => api.get('/admin/users'), []);
  const [message, setMessage] = useState('');

  async function changeRole(u, role) {
    setMessage('');
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role });
      setData((d) => ({ data: d.data.map((x) => (x.id === u.id ? { ...x, role } : x)) }));
    } catch (err) {
      setMessage(errorText(err));
      reload();
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  return (
    <>
      {message && <p className="alert alert-error" role="alert">{message}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Posts</th><th>Joined</th><th>Role</th></tr></thead>
          <tbody>
            {data.data.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td><td>{u.email}</td><td>{u.postCount}</td><td>{formatDate(u.createdAt)}</td>
                <td>
                  <label className="sr-only" htmlFor={`role-${u.id}`}>Role for {u.name}</label>
                  <select id={`role-${u.id}`} value={u.role} disabled={u.id === me.id} onChange={(e) => changeRole(u, e.target.value)}>
                    <option value="reader">reader</option>
                    <option value="author">author</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PostsTab() {
  const { data, loading, error, reload, setData } = useFetch(() => api.get('/admin/posts'), []);
  const [message, setMessage] = useState('');
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      await api.del(`/posts/${postToDelete.id}`);
      setData((d) => ({ data: d.data.filter((x) => x.id !== postToDelete.id) }));
      setPostToDelete(null);
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  return (
    <>
      {message && <p className="alert alert-error" role="alert">{message}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Author</th><th>Status</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {data.data.map((p) => (
              <tr key={p.id}>
                <td><Link to={`/post/${p.id}`}>{p.title}</Link></td>
                <td>{p.author.name}</td>
                <td><span className="badge">{p.status}</span></td>
                <td>{formatDate(p.createdAt)}</td>
                <td className="nowrap">
                  <Link className="btn btn-outline btn-small" to={`/write/${p.id}`}>Edit</Link>{' '}
                  <button type="button" className="btn btn-outline btn-small danger" onClick={() => setPostToDelete(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {postToDelete && (
        <ConfirmDialog
          title="Delete post?"
          message={`Delete "${postToDelete.title}" by ${postToDelete.author.name} and its cover image? This cannot be undone.`}
          confirmLabel="Delete post"
          busy={deleting}
          onConfirm={remove}
          onCancel={() => setPostToDelete(null)}
        />
      )}
    </>
  );
}

function CommentsTab() {
  const { data, loading, error, reload, setData } = useFetch(() => api.get('/admin/comments'), []);
  const [message, setMessage] = useState('');

  async function remove(c) {
    if (!window.confirm('Delete this comment (and any replies)?')) return;
    try {
      await api.del(`/comments/${c.id}`);
      setData((d) => ({ data: d.data.filter((x) => x.id !== c.id && x.parentId !== c.id) }));
    } catch (err) {
      setMessage(errorText(err));
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} onRetry={reload} />;
  return (
    <>
      {message && <p className="alert alert-error" role="alert">{message}</p>}
      <ul className="comment-list">
        {data.data.map((c) => (
          <li key={c.id} className="comment">
            <p className="small"><strong>{c.author.name}</strong> on <Link to={`/post/${c.postId}`}>{c.postTitle}</Link> · {formatDate(c.createdAt)}</p>
            <p className="comment-body">{c.body}</p>
            <button type="button" className="link-button danger small" onClick={() => remove(c)}>Delete</button>
          </li>
        ))}
      </ul>
    </>
  );
}

const TABS = { users: ['Users', UsersTab], posts: ['All posts', PostsTab], comments: ['Recent comments', CommentsTab] };

export default function Admin() {
  usePageTitle('Admin');
  const [tab, setTab] = useState('users');
  const Active = TABS[tab][1];
  return (
    <div className="container page">
      <h1>Admin</h1>
      <div className="tab-row" role="tablist" aria-label="Admin sections">
        {Object.entries(TABS).map(([key, [label]]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={`tag ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  );
}
