import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import CommentSection from '../components/CommentSection.jsx';
import LikeButton from '../components/LikeButton.jsx';
import MarkdownView from '../components/MarkdownView.jsx';
import { ErrorMessage, Loading } from '../components/Status.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useFetch from '../hooks/useFetch.js';
import usePageTitle from '../hooks/usePageTitle.js';
import { formatDate } from '../utils.js';

export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => api.get(`/posts/${id}`), [id, user?.id]);
  const post = data?.post;
  usePageTitle(post?.title);

  if (loading) return <div className="container page"><Loading label="Loading post…" /></div>;
  if (error) {
    return (
      <div className="container page">
        <ErrorMessage error={error} onRetry={error.status === 404 ? undefined : reload} />
        <p><Link to="/">← Back to all posts</Link></p>
      </div>
    );
  }

  const canEdit = user && (user.id === post.author.id || user.role === 'admin');

  return (
    <article className="container page narrow">
      <p><Link to="/">← All posts</Link></p>
      {post.status === 'draft' && <p className="alert">This is a draft. Only you (and admins) can see it.</p>}
      <h1>{post.title}</h1>
      <p className="muted small">
        By {post.author.name} · {formatDate(post.publishedAt || post.createdAt)} · {post.viewCount} views
      </p>
      {post.coverImageUrl && (
        <img className="cover cover-large" src={post.coverImageUrl} alt="" decoding="async" width="1200" height="675" />
      )}
      <MarkdownView source={post.content} />
      <p className="meta small">
        {post.tags.map((t) => <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="tag">#{t}</Link>)}
      </p>
      <div className="actions-row">
        {post.status === 'published' && (
          <LikeButton key={`${post.id}-${user?.id}`} postId={post.id} initialLiked={post.likedByMe} initialCount={post.likeCount} />
        )}
        {canEdit && <Link className="btn btn-outline btn-small" to={`/write/${post.id}`}>Edit post</Link>}
      </div>
      {post.status === 'published' && <CommentSection postId={post.id} />}
    </article>
  );
}
