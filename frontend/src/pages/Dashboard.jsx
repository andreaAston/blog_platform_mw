import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { ErrorMessage, Empty, Loading } from '../components/Status.jsx';
import useFetch from '../hooks/useFetch.js';
import usePageTitle from '../hooks/usePageTitle.js';
import { errorText, formatDate } from '../utils.js';

export default function Dashboard() {
  usePageTitle('Dashboard');
  const { data, loading, error, reload, setData } = useFetch(() => api.get('/dashboard/posts'), []);
  const [actionError, setActionError] = useState('');
  const [postToDelete, setPostToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!postToDelete) return;
    setActionError('');
    setDeleting(true);
    try {
      await api.del(`/posts/${postToDelete.id}`);
      setData((d) => ({ ...d, posts: d.posts.filter((p) => p.id !== postToDelete.id) }));
      setPostToDelete(null);
      reload(); // refresh the totals from the server
    } catch (err) {
      setActionError(errorText(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container page">
      <div className="actions-row between">
        <h1>Author dashboard</h1>
        <Link to="/write" className="btn">New post</Link>
      </div>

      {loading && !data && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {actionError && <p className="alert alert-error" role="alert">{actionError}</p>}

      {data && (
        <>
          <ul className="stats">
            <li><strong>{data.totals.posts}</strong> posts</li>
            <li><strong>{data.totals.views}</strong> views</li>
            <li><strong>{data.totals.likes}</strong> likes</li>
            <li><strong>{data.totals.comments}</strong> comments</li>
          </ul>

          {data.posts.length === 0 ? (
            <Empty>You have not written anything yet. Click "New post" to start.</Empty>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Title</th><th>Cover</th><th>Status</th><th>Views</th><th>Likes</th><th>Comments</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr>
                </thead>
                <tbody>
                  {data.posts.map((p) => (
                    <tr key={p.id}>
                      <td><Link to={`/post/${p.id}`}>{p.title}</Link></td>
                      <td>
                        {p.coverImageUrl
                          ? <img className="dashboard-cover" src={p.coverImageUrl} alt={`Cover for ${p.title}`} loading="lazy" />
                          : <span className="muted">None</span>}
                      </td>
                      <td><span className="badge">{p.status}</span></td>
                      <td>{p.views}</td>
                      <td>{p.likes}</td>
                      <td>{p.comments}</td>
                      <td>{formatDate(p.updatedAt)}</td>
                      <td className="nowrap">
                        <Link className="btn btn-outline btn-small" to={`/write/${p.id}`}>Edit</Link>{' '}
                        <button type="button" className="btn btn-outline btn-small danger" onClick={() => setPostToDelete(p)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {postToDelete && (
        <ConfirmDialog
          title="Delete post?"
          message={`Delete "${postToDelete.title}" and its cover image? This cannot be undone.`}
          confirmLabel="Delete post"
          busy={deleting}
          onConfirm={remove}
          onCancel={() => setPostToDelete(null)}
        />
      )}
    </div>
  );
}
