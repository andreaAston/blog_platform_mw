import { Link } from 'react-router-dom';
import { formatDate } from '../utils.js';

export default function PostCard({ post }) {
  return (
    <article className="card post-card">
      {post.coverImageUrl && (
        <Link to={`/post/${post.id}`} tabIndex={-1} aria-hidden="true">
          <img
            className="cover"
            src={post.coverImageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            width="800"
            height="450"
          />
        </Link>
      )}
      <div className="card-body">
        <h2 className="card-title">
          <Link to={`/post/${post.id}`}>{post.title}</Link>
        </h2>
        <p className="muted small">
          {post.author.name} · {formatDate(post.publishedAt)}
        </p>
        <p>{post.excerpt}</p>
        <p className="meta small">
          <span>♥ {post.likeCount}</span>
          <span>💬 {post.commentCount}</span>
          {post.tags.map((t) => (
            <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="tag">#{t}</Link>
          ))}
        </p>
      </div>
    </article>
  );
}
