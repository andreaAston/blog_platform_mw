// API tests - run with:  npm test
// They talk to the real database in DATABASE_URL (or TEST_DATABASE_URL) but only ever create and
// delete rows whose email starts with "test-", so your seeded demo data is left alone.
process.env.NODE_ENV = 'test';
process.env.LOGIN_RATE_LIMIT = '5';

const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/db');

const RUN = Date.now().toString(36); // makes titles/tags unique per test run
let counter = 0;
const PASSWORD = 'Passw0rdTest';

async function signUp(role = 'reader') {
  counter += 1;
  const email = `test-${RUN}-${counter}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ name: `Tester ${counter}`, email, password: PASSWORD, role });
  expect(res.status).toBe(201);
  return { ...res.body.user, email, token: res.body.token, auth: { Authorization: `Bearer ${res.body.token}` } };
}

async function makePost(user, overrides = {}) {
  const res = await request(app)
    .post('/api/posts')
    .set(user.auth)
    .send({ title: `Post ${RUN} ${++counter}`, excerpt: 'excerpt', content: '# Hi', status: 'published', tags: [], ...overrides });
  expect(res.status).toBe(201);
  return res.body.post;
}

afterAll(async () => {
  await pool.query("delete from users where email like 'test-%@example.com'"); // cascades to posts, comments, likes
  await pool.end();
});

describe('health + auth', () => {
  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('register creates a reader, returns a token and never returns the password', async () => {
    const user = await signUp('reader');
    expect(user.role).toBe('reader');
    expect(user.token).toEqual(expect.any(String));
    const row = await pool.query('select password_hash from users where id = $1', [user.id]);
    expect(row.rows[0].password_hash).toMatch(/^\$2[aby]\$/); // stored as a bcrypt hash
    expect(row.rows[0].password_hash).not.toContain(PASSWORD);
  });

  test('register rejects weak passwords and self-assigned admin role with useful messages', async () => {
    const weak = await request(app).post('/api/auth/register').send({ name: 'Weak', email: `test-${RUN}-weak@example.com`, password: 'short' });
    expect(weak.status).toBe(400);
    expect(weak.body.error.details.map((d) => d.field)).toContain('password');

    const admin = await request(app).post('/api/auth/register').send({ name: 'Sneaky', email: `test-${RUN}-sneaky@example.com`, password: PASSWORD, role: 'admin' });
    expect(admin.status).toBe(400);
  });

  test('duplicate email returns 409', async () => {
    const user = await signUp();
    const res = await request(app).post('/api/auth/register').send({ name: 'Copy', email: user.email.toUpperCase(), password: PASSWORD });
    expect(res.status).toBe(409);
  });

  test('login works, and a wrong password gives the same generic 401 as an unknown email', async () => {
    const user = await signUp();
    const ok = await request(app).post('/api/auth/login').send({ email: user.email, password: PASSWORD });
    expect(ok.status).toBe(200);

    const wrong = await request(app).post('/api/auth/login').send({ email: user.email, password: 'WrongPass1' });
    const unknown = await request(app).post('/api/auth/login').send({ email: `test-${RUN}-nobody@example.com`, password: 'WrongPass1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  test('GET /api/auth/me needs a valid token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.token')).status).toBe(401);
    const user = await signUp();
    const res = await request(app).get('/api/auth/me').set(user.auth);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });
});

describe('roles and post ownership (enforced by the server)', () => {
  test('a reader cannot create a post, an author can', async () => {
    const reader = await signUp('reader');
    const author = await signUp('author');
    const denied = await request(app).post('/api/posts').set(reader.auth).send({ title: 'Nope nope', status: 'published' });
    expect(denied.status).toBe(403);
    const created = await makePost(author);
    expect(created.author.id).toBe(author.id);
  });

  test("an author cannot edit or delete another author's post, but an admin can", async () => {
    const owner = await signUp('author');
    const other = await signUp('author');
    const admin = await signUp('author');
    await pool.query("update users set role = 'admin' where id = $1", [admin.id]);
    const post = await makePost(owner);
    const body = { title: 'Edited title', excerpt: 'x', content: 'y', status: 'published', tags: [] };

    expect((await request(app).put(`/api/posts/${post.id}`).set(other.auth).send(body)).status).toBe(403);
    expect((await request(app).delete(`/api/posts/${post.id}`).set(other.auth)).status).toBe(403);
    expect((await request(app).put(`/api/posts/${post.id}`).set(owner.auth).send(body)).status).toBe(200);

    const adminEdit = await request(app).put(`/api/posts/${post.id}`).set(admin.auth).send({ ...body, title: 'Moderated title' });
    expect(adminEdit.status).toBe(200);
    expect(adminEdit.body.post.title).toBe('Moderated title');
    expect((await request(app).delete(`/api/posts/${post.id}`).set(admin.auth)).status).toBe(204);
  });

  test('drafts are hidden from the public and from other users, visible to the owner', async () => {
    const owner = await signUp('author');
    const stranger = await signUp('reader');
    const draft = await makePost(owner, { status: 'draft' });

    expect((await request(app).get(`/api/posts/${draft.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/posts/${draft.id}`).set(stranger.auth)).status).toBe(404);
    expect((await request(app).get(`/api/posts/${draft.id}`).set(owner.auth)).status).toBe(200);
    const feed = await request(app).get(`/api/posts?q=${encodeURIComponent(draft.title)}`);
    expect(feed.body.data).toHaveLength(0);
  });
});

describe('feed: pagination, search, tag filter', () => {
  test('paginates and filters by tag and search text', async () => {
    const author = await signUp('author');
    const tag = `tag${RUN}`.slice(0, 30);
    await makePost(author, { title: `Alpha ${RUN} cat`, tags: [tag] });
    await makePost(author, { title: `Beta ${RUN} dog`, tags: [tag] });
    await makePost(author, { title: `Gamma ${RUN} cat`, tags: [tag] });

    const page1 = await request(app).get(`/api/posts?tag=${tag}&limit=2&page=1`);
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.pagination).toMatchObject({ total: 3, totalPages: 2, page: 1, limit: 2 });
    const page2 = await request(app).get(`/api/posts?tag=${tag}&limit=2&page=2`);
    expect(page2.body.data).toHaveLength(1);

    const search = await request(app).get(`/api/posts?tag=${tag}&q=${RUN}%20cat`);
    expect(search.body.pagination.total).toBe(2);

    expect((await request(app).get('/api/posts?limit=500')).status).toBe(400); // limit is capped at 20
  });
});

describe('likes and comments', () => {
  test('a user can like a post only once (database primary key), and can unlike', async () => {
    const author = await signUp('author');
    const reader = await signUp('reader');
    const post = await makePost(author);

    expect((await request(app).post(`/api/posts/${post.id}/like`)).status).toBe(401);
    const first = await request(app).post(`/api/posts/${post.id}/like`).set(reader.auth);
    const second = await request(app).post(`/api/posts/${post.id}/like`).set(reader.auth);
    expect(first.body).toEqual({ likeCount: 1, liked: true });
    expect(second.body).toEqual({ likeCount: 1, liked: true });
    const rows = await pool.query('select count(*)::int as n from likes where post_id = $1', [post.id]);
    expect(rows.rows[0].n).toBe(1);

    const unlike = await request(app).delete(`/api/posts/${post.id}/like`).set(reader.auth);
    expect(unlike.body).toEqual({ likeCount: 0, liked: false });
  });

  test('replies are allowed one level deep only; a reply to a reply is rejected', async () => {
    const author = await signUp('author');
    const reader = await signUp('reader');
    const post = await makePost(author);

    const top = await request(app).post(`/api/posts/${post.id}/comments`).set(reader.auth).send({ body: 'Top comment' });
    expect(top.status).toBe(201);
    const reply = await request(app).post(`/api/posts/${post.id}/comments`).set(author.auth).send({ body: 'A reply', parentId: top.body.comment.id });
    expect(reply.status).toBe(201);
    const nested = await request(app).post(`/api/posts/${post.id}/comments`).set(reader.auth).send({ body: 'Too deep', parentId: reply.body.comment.id });
    expect(nested.status).toBe(400);

    const list = await request(app).get(`/api/posts/${post.id}/comments`);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].replies).toHaveLength(1);
  });

  test('only the owner or an admin can delete a comment', async () => {
    const author = await signUp('author');
    const writer = await signUp('reader');
    const bystander = await signUp('reader');
    const admin = await signUp('reader');
    await pool.query("update users set role = 'admin' where id = $1", [admin.id]);
    const post = await makePost(author);
    const c1 = (await request(app).post(`/api/posts/${post.id}/comments`).set(writer.auth).send({ body: 'one' })).body.comment;
    const c2 = (await request(app).post(`/api/posts/${post.id}/comments`).set(writer.auth).send({ body: 'two' })).body.comment;

    expect((await request(app).delete(`/api/comments/${c1.id}`).set(bystander.auth)).status).toBe(403);
    expect((await request(app).delete(`/api/comments/${c1.id}`).set(writer.auth)).status).toBe(204);
    expect((await request(app).delete(`/api/comments/${c2.id}`).set(admin.auth)).status).toBe(204);
  });
});

describe('dashboard and admin', () => {
  test("dashboard shows an author's own views, likes and comments; readers are refused", async () => {
    const author = await signUp('author');
    const reader = await signUp('reader');
    const post = await makePost(author);
    await request(app).get(`/api/posts/${post.id}`).set(reader.auth); // a view
    await request(app).post(`/api/posts/${post.id}/like`).set(reader.auth);
    await request(app).post(`/api/posts/${post.id}/comments`).set(reader.auth).send({ body: 'nice' });

    const res = await request(app).get('/api/dashboard/posts').set(author.auth);
    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({ posts: 1, views: 1, likes: 1, comments: 1 });
    expect((await request(app).get('/api/dashboard/posts').set(reader.auth)).status).toBe(403);
  });

  test('admin endpoints are admin-only', async () => {
    const author = await signUp('author');
    expect((await request(app).get('/api/admin/users').set(author.auth)).status).toBe(403);
    expect((await request(app).get('/api/admin/users')).status).toBe(401);
  });
});

describe('security', () => {
  test('login is rate limited after too many failed attempts', async () => {
    const user = await signUp();
    let last;
    for (let i = 0; i < 7; i += 1) {
      last = await request(app).post('/api/auth/login').send({ email: user.email, password: 'WrongPass1' });
    }
    expect(last.status).toBe(429);
  });
});
