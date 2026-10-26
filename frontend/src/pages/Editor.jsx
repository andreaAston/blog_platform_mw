import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import MarkdownView from '../components/MarkdownView.jsx';
import { ErrorMessage, Loading } from '../components/Status.jsx';
import useAutosaveDraft from '../hooks/useAutosaveDraft.js';
import useDebounce from '../hooks/useDebounce.js';
import usePageTitle from '../hooks/usePageTitle.js';

const EMPTY = { title: '', excerpt: '', content: '', tagsText: '', coverImageUrl: '', status: 'draft' };
const parseTags = (text) => [...new Set(text.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean))];

export default function Editor() {
  const { id } = useParams(); // undefined when writing a new post
  const isEdit = Boolean(id);
  usePageTitle(isEdit ? 'Edit post' : 'New post');
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [serverForm, setServerForm] = useState(EMPTY); // the version stored on the server
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [restoredAt, setRestoredAt] = useState(null);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const autosave = useAutosaveDraft(`draft:${id || 'new'}`, form, ready, serverForm);
  const previewSource = useDebounce(form.content, 250); // do not re-render the preview on every keystroke

  // Load the post (when editing) and restore any unsaved local draft.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      let base = EMPTY;
      if (isEdit) {
        try {
          const { post } = await api.get(`/posts/${id}`);
          base = {
            title: post.title, excerpt: post.excerpt, content: post.content,
            tagsText: post.tags.join(', '), coverImageUrl: post.coverImageUrl || '', status: post.status,
          };
        } catch (err) {
          if (!cancelled) setLoadError(err);
          return;
        }
      }
      if (cancelled) return;
      setServerForm(base);
      const saved = autosave.load();
      if (saved && JSON.stringify(saved.value) !== JSON.stringify(base)) {
        setForm(saved.value);
        setRestoredAt(saved.savedAt);
      } else {
        setForm(base);
      }
      setReady(true);
    }
    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate(status) {
    const problems = [];
    const tags = parseTags(form.tagsText);
    if (form.title.trim().length < 3) problems.push('Title must be at least 3 characters.');
    if (form.excerpt.length > 300) problems.push('Excerpt must be 300 characters or fewer.');
    if (tags.length > 5) problems.push('Use at most 5 tags.');
    if (tags.some((t) => t.length < 2 || t.length > 30)) problems.push('Each tag must be 2 to 30 characters.');
    if (status === 'published' && !form.content.trim()) problems.push('Write some content before publishing.');
    return problems;
  }

  async function save(status) {
    const problems = validate(status);
    setErrors(problems);
    if (problems.length) return;

    setBusy(true);
    const body = {
      title: form.title.trim(), excerpt: form.excerpt.trim(), content: form.content,
      coverImageUrl: form.coverImageUrl || null, status, tags: parseTags(form.tagsText),
    };
    try {
      const { post } = isEdit ? await api.put(`/posts/${id}`, body) : await api.post('/posts', body);
      autosave.clear();
      navigate(status === 'published' ? `/post/${post.id}` : '/dashboard');
    } catch (err) {
      // The local draft is untouched, so nothing is lost if the network or server failed.
      setErrors(err.details?.length ? err.details.map((d) => d.message) : [err.message]);
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setErrors(['Choose a JPEG, PNG or WebP image.']);
    if (file.size > 5 * 1024 * 1024) return setErrors(['The image must be 5 MB or smaller.']);
    setUploading(true);
    setErrors([]);
    try {
      const { url } = await api.uploadCover(file);
      setForm((f) => ({ ...f, coverImageUrl: url }));
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setUploading(false);
    }
  }

  function discardLocalChanges() {
    autosave.clear();
    setForm(serverForm);
    setRestoredAt(null);
  }

  if (loadError) {
    return (
      <div className="container page">
        <ErrorMessage error={loadError} />
        <p><Link to="/dashboard">← Back to dashboard</Link></p>
      </div>
    );
  }
  if (!ready) return <div className="container page"><Loading label="Loading editor…" /></div>;

  return (
    <div className="container page">
      <h1>{isEdit ? 'Edit post' : 'Write a new post'}</h1>
      <p className="muted small">
        Status: <strong>{form.status}</strong> · Your work is saved on this device automatically while you type.
      </p>

      {restoredAt && (
        <p className="alert" role="status">
          We restored unsaved changes from {new Date(restoredAt).toLocaleTimeString()}.{' '}
          <button type="button" className="link-button" onClick={discardLocalChanges}>Discard them</button>
        </p>
      )}
      {errors.length > 0 && (
        <div className="alert alert-error" role="alert">
          <ul>{errors.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}

      <div className="form">
        <label htmlFor="title">Title</label>
        <input id="title" value={form.title} onChange={set('title')} maxLength={150} />

        <label htmlFor="excerpt">Short summary ({form.excerpt.length}/300)</label>
        <textarea id="excerpt" rows="2" value={form.excerpt} onChange={set('excerpt')} maxLength={300} />

        <label htmlFor="tags">Tags (comma separated, max 5)</label>
        <input id="tags" value={form.tagsText} onChange={set('tagsText')} placeholder="campus-life, energy" />

        <label htmlFor="cover">Cover image (JPEG, PNG or WebP, up to 5 MB)</label>
        <input id="cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} disabled={uploading} />
        {uploading && <Loading label="Uploading and compressing…" />}
        {form.coverImageUrl && (
          <div>
            <img className="cover cover-preview" src={form.coverImageUrl} alt="Cover preview" loading="lazy" width="800" height="450" />
            <button type="button" className="link-button danger" onClick={() => setForm((f) => ({ ...f, coverImageUrl: '' }))}>
              Remove image
            </button>
          </div>
        )}

        <div className="editor-grid">
          <div>
            <label htmlFor="content">Content (Markdown)</label>
            <textarea id="content" className="editor-textarea" value={form.content} onChange={set('content')} />
          </div>
          <div>
            <p className="label">Live preview</p>
            <div className="preview"><MarkdownView source={previewSource} /></div>
          </div>
        </div>

        <div className="actions-row">
          <button type="button" className="btn btn-outline" disabled={busy || uploading} onClick={() => save('draft')}>
            Save as draft
          </button>
          <button type="button" className="btn" disabled={busy || uploading} onClick={() => save('published')}>
            {busy ? 'Saving…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
