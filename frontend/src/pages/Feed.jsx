import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import PostCard from '../components/PostCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { Empty, ErrorMessage, Loading } from '../components/Status.jsx';
import useDebounce from '../hooks/useDebounce.js';
import useFetch from '../hooks/useFetch.js';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Feed() {
  usePageTitle('');
  // The URL is the single source of truth for page / search / tag, so links are shareable
  // and the back button works.
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const q = params.get('q') || '';
  const tag = params.get('tag') || '';

  const [text, setText] = useState(q);
  const debouncedText = useDebounce(text, 400);

  useEffect(() => {
    if (debouncedText.trim() === q) return;
    const next = new URLSearchParams(params);
    if (debouncedText.trim()) next.set('q', debouncedText.trim()); else next.delete('q');
    next.delete('page'); // a new search starts on page 1
    setParams(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText]);

  const query = new URLSearchParams({ page, limit: 6, ...(q && { q }), ...(tag && { tag }) }).toString();
  const feed = useFetch(() => api.get(`/posts?${query}`), [query]);
  const tags = useFetch(() => api.get('/tags'), []);

  function update(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="container page">
      <h1>Stories from Malawi</h1>
      <p className="muted">Campus life, mobile money, load-shedding, farming and more.</p>

      <div className="search-row">
        <label htmlFor="search" className="sr-only">Search posts</label>
        <input id="search" type="search" placeholder="Search posts…" value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div className="tag-row" role="group" aria-label="Filter by tag">
        <button type="button" className={`tag ${tag ? '' : 'active'}`} onClick={() => update({ tag: '', page: '' })}>All</button>
        {(tags.data?.data ?? []).map((t) => (
          <button key={t.name} type="button" className={`tag ${tag === t.name ? 'active' : ''}`} aria-pressed={tag === t.name} onClick={() => update({ tag: t.name, page: '' })}>
            #{t.name} <span className="muted">({t.postCount})</span>
          </button>
        ))}
      </div>

      {feed.loading && <Loading label="Loading posts…" />}
      {feed.error && <ErrorMessage error={feed.error} onRetry={feed.reload} />}
      {feed.data && feed.data.data.length === 0 && <Empty>No posts found. Try a different search or tag.</Empty>}

      <div className="grid">
        {feed.data?.data.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      {feed.data && (
        <Pagination page={feed.data.pagination.page} totalPages={feed.data.pagination.totalPages} onChange={(p) => update({ page: p === 1 ? '' : String(p) })} />
      )}
    </div>
  );
}
