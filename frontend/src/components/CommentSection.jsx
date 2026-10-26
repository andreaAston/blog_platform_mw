import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import useFetch from '../hooks/useFetch.js';
import { errorText, formatDate } from '../utils.js';
import { ErrorMessage, Loading } from './Status.jsx';

function CommentForm({ onSubmit, placeholder, autoFocus = false, onDone }) {
  const id = useId(); // unique, valid id for the label/textarea pair
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return setError('Write something before posting.');
    if (body.length > 1000) return setError('Comments can be at most 1000 characters.');
    setError('');
    setText(''); // clear immediately: the comment appears instantly (optimistic)
    const ok = await onSubmit(body);
    if (!ok) setText(body); // it failed and was rolled back, so give the text back to the user
    else onDone?.();
  }

  return (
    <form onSubmit={handleSubmit} className="comment-form" noValidate>
      <label className="sr-only" htmlFor={id}>{placeholder}</label>
      <textarea id={id} rows="3" value={text} placeholder={placeholder} autoFocus={autoFocus} onChange={(e) => setText(e.target.value)} />
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-small">Post</button>
    </form>
  );
}

function Comment({ comment, canReply, onReply, onDelete, user }) {
  const [replying, setReplying] = useState(false);
  const mine = user && (user.id === comment.author.id || user.role === 'admin');

  return (
    <li className={`comment ${comment.pending ? 'pending' : ''}`}>
      <p className="small">
        <strong>{comment.author.name}</strong>
        {comment.author.role !== 'reader' && <span className="badge">{comment.author.role}</span>}
        <span className="muted"> · {comment.pending ? 'sending…' : formatDate(comment.createdAt)}</span>
      </p>
      <p className="comment-body">{comment.body}</p>
      <p className="small actions">
        {canReply && user && !comment.pending && (
          <button type="button" className="link-button" onClick={() => setReplying((r) => !r)}>Reply</button>
        )}
        {mine && !comment.pending && (
          <button type="button" className="link-button danger" onClick={() => onDelete(comment)}>Delete</button>
        )}
      </p>
      {replying && (
        <CommentForm
          autoFocus
          placeholder={`Reply to ${comment.author.name}`}
          onSubmit={(body) => onReply(comment.id, body)}
          onDone={() => setReplying(false)}
        />
      )}
      {comment.replies?.length > 0 && (
        <ul className="replies">
          {comment.replies.map((r) => (
            <Comment key={r.id} comment={r} canReply={false} onDelete={onDelete} user={user} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const { data, loading, error, reload, setData } = useFetch(() => api.get(`/posts/${postId}/comments`), [postId]);
  const [actionError, setActionError] = useState('');
  const comments = data?.data ?? [];
  const setComments = (fn) => setData((d) => ({ data: fn(d?.data ?? []) }));

  // Optimistic add: show a temporary comment now, swap in the real one when the server answers.
  async function add(body, parentId) {
    const temp = {
      id: `temp-${Date.now()}`,
      parentId: parentId ?? null,
      body,
      createdAt: new Date().toISOString(),
      author: { id: user.id, name: user.name, role: user.role },
      replies: [],
      pending: true,
    };
    setActionError('');
    setComments((list) =>
      parentId ? list.map((c) => (c.id === parentId ? { ...c, replies: [...c.replies, temp] } : c)) : [...list, temp]
    );

    try {
      const { comment } = await api.post(`/posts/${postId}/comments`, { body, ...(parentId ? { parentId } : {}) });
      const swap = (c) => (c.id === temp.id ? comment : c);
      setComments((list) => list.map((c) => ({ ...swap(c), replies: c.replies.map(swap) })));
      return true;
    } catch (err) {
      const drop = (c) => c.id !== temp.id; // roll back: remove the temporary comment
      setComments((list) => list.filter(drop).map((c) => ({ ...c, replies: c.replies.filter(drop) })));
      setActionError(`Your comment was not posted. ${errorText(err)}`);
      return false;
    }
  }

  async function remove(comment) {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.del(`/comments/${comment.id}`);
      const keep = (c) => c.id !== comment.id; // deleting a top-level comment removes its replies too
      setComments((list) => list.filter(keep).map((c) => ({ ...c, replies: c.replies.filter(keep) })));
    } catch (err) {
      setActionError(errorText(err));
    }
  }

  const total = comments.reduce((n, c) => n + 1 + c.replies.length, 0);

  return (
    <section aria-labelledby="comments-heading" className="comments">
      <h2 id="comments-heading">Comments ({total})</h2>
      {user ? (
        <CommentForm placeholder="Add a comment" onSubmit={(body) => add(body)} />
      ) : (
        <p><Link to="/login" state={{ from: { pathname: `/post/${postId}` } }}>Log in</Link> to join the conversation.</p>
      )}
      {actionError && <p className="alert alert-error" role="alert">{actionError}</p>}
      {loading && <Loading label="Loading comments…" />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      <ul className="comment-list">
        {comments.map((c) => (
          <Comment key={c.id} comment={c} canReply onReply={(parentId, body) => add(body, parentId)} onDelete={remove} user={user} />
        ))}
      </ul>
    </section>
  );
}
