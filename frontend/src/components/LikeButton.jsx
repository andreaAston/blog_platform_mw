import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

// OPTIMISTIC UPDATE: change the screen first, then tell the server.
// If the server says no, roll back to what we remembered.
export default function LikeButton({ postId, initialLiked, initialCount }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [like, setLike] = useState({ liked: initialLiked, count: initialCount });
  const [error, setError] = useState('');
  const busy = useRef(false); // ref, not state: changing it must not cause a re-render

  async function toggle() {
    if (!user) return navigate('/login', { state: { from: location } });
    if (busy.current) return; // ignore double clicks while a request is in flight
    busy.current = true;

    const previous = like; // 1. remember how things were
    setLike({ liked: !previous.liked, count: previous.count + (previous.liked ? -1 : 1) }); // 2. update UI now
    setError('');

    try {
      const res = previous.liked ? await api.del(`/posts/${postId}/like`) : await api.post(`/posts/${postId}/like`);
      setLike({ liked: res.liked, count: res.likeCount }); // 3. the server's answer is the truth
    } catch {
      setLike(previous); // 4. roll back
      setError('Could not save your like. Check your connection and try again.');
    } finally {
      busy.current = false;
    }
  }

  return (
    <div>
      <button type="button" className={`btn btn-small ${like.liked ? '' : 'btn-outline'}`} aria-pressed={like.liked} onClick={toggle}>
        {like.liked ? '♥ Liked' : '♡ Like'} · {like.count}
      </button>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
