import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import LikeButton from '../components/LikeButton.jsx';
import MarkdownView from '../components/MarkdownView.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { api } from '../api.js';

// Fake the logged-in user so we can test each component on its own.
let mockAuth = { user: null, loading: false };
vi.mock('../context/AuthContext.jsx', () => ({ useAuth: () => mockAuth }));

beforeEach(() => {
  mockAuth = { user: { id: 1, name: 'Tester', role: 'reader' }, loading: false };
  vi.restoreAllMocks();
});

describe('MarkdownView', () => {
  test('renders Markdown but strips scripts and inline event handlers (XSS defence)', () => {
    const evil = '# Title\n\n<script>window.hacked = true</script>\n\n<img src=x onerror="window.hacked = true">\n\n[click](javascript:alert(1))';
    const { container } = render(<MarkdownView source={evil} />);

    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.innerHTML).not.toContain('javascript:');
    expect(window.hacked).toBeUndefined();
  });
});

describe('LikeButton (optimistic update)', () => {
  const renderButton = () =>
    render(
      <MemoryRouter>
        <LikeButton postId={7} initialLiked={false} initialCount={3} />
      </MemoryRouter>
    );

  test('updates the screen immediately and keeps the server answer', async () => {
    let resolveRequest;
    vi.spyOn(api, 'post').mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    renderButton();

    await userEvent.click(screen.getByRole('button', { name: /like/i }));
    // The request has NOT finished yet, but the UI already shows the new count.
    expect(screen.getByRole('button')).toHaveTextContent('Liked · 4');

    resolveRequest({ liked: true, likeCount: 4 });
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Liked · 4'));
  });

  test('rolls back and shows an error when the request fails', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new Error('network down'));
    renderButton();

    await userEvent.click(screen.getByRole('button', { name: /like/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/could not save your like/i));
    expect(screen.getByRole('button')).toHaveTextContent('Like · 3'); // back to the original
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('ProtectedRoute', () => {
  const renderAt = () =>
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<p>Secret admin page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

  test('sends anonymous visitors to the login page', () => {
    mockAuth = { user: null, loading: false };
    renderAt();
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('blocks a reader from an admin page, but lets an admin in', () => {
    renderAt();
    expect(screen.getByText(/cannot open this page/i)).toBeInTheDocument();
    expect(screen.queryByText('Secret admin page')).toBeNull();
  });

  test('lets an admin in', () => {
    mockAuth = { user: { id: 2, name: 'Boss', role: 'admin' }, loading: false };
    renderAt();
    expect(screen.getByText('Secret admin page')).toBeInTheDocument();
  });
});
