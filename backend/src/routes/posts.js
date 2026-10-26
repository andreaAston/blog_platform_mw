const express = require('express');
const db = require('../db');
const schemas = require('../schemas');
const validate = require('../middleware/validate');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const { notFound, forbidden, badRequest, parseId } = require('../errors');
const { postSelect, getPost, escapeLike, setPostTags } = require('../utils/posts');
const { deleteImage } = require('../utils/storage');

const router = express.Router();
const canWrite = [authenticate, requireRole('author', 'admin')];

// Authors may touch only their own posts; admins may touch any.
const isOwnerOrAdmin = (user, authorId) => user.role === 'admin' || user.id === authorId;

// ---------------------------------------------------------------- feed
// GET /api/posts?page=1&limit=6&q=blackout&tag=energy
router.get('/', optionalAuth, validate(schemas.listQuery, 'query'), async (req, res) => {
  const { page, limit, q, tag, author } = req.valid.query;

  const where = ["p.status = 'published'"];
  const params = [];
  if (q) {
    params.push(`%${escapeLike(q)}%`);
    const n = params.length;
    where.push(`(p.title ilike $${n} or p.excerpt ilike $${n} or p.content ilike $${n})`);
  }
  if (tag) {
    params.push(tag);
    where.push(`exists (select 1 from post_tags pt join tags t on t.id = pt.tag_id
                         where pt.post_id = p.id and t.name = $${params.length})`);
  }
  if (author) {
    params.push(author);
    where.push(`p.author_id = $${params.length}`);
  }
  const whereSql = where.join(' and ');

  const { rows: countRows } = await db.query(`select count(*)::int as n from posts p where ${whereSql}`, params);
  const total = countRows[0].n;

  const v = params.length + 1; // placeholder positions after the filter params
  const { rows } = await db.query(
    `${postSelect({ viewer: `$${v}` })}
      where ${whereSql}
      order by p.published_at desc, p.id desc
      limit $${v + 1} offset $${v + 2}`,
    [...params, req.user?.id ?? null, limit, (page - 1) * limit]
  );

  res.json({ data: rows, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

// ---------------------------------------------------------------- single post
// GET /api/posts/:id  (drafts are visible only to their author and admins)
router.get('/:id', optionalAuth, async (req, res) => {
  const id = parseId(req.params.id);
  const post = await getPost(id, req.user?.id);
  if (!post) throw notFound('Post not found');

  const isOwner = req.user?.id === post.author.id;
  if (post.status !== 'published' && !isOwner && req.user?.role !== 'admin') throw notFound('Post not found');

  if (post.status === 'published' && !isOwner) {
    await db.query('update posts set view_count = view_count + 1 where id = $1', [id]);
    post.viewCount += 1;
  }
  res.json({ post });
});

// ---------------------------------------------------------------- create / update / delete
// POST /api/posts
router.post('/', ...canWrite, validate(schemas.post), async (req, res) => {
  const { title, excerpt, content, coverImageUrl, status, tags } = req.valid.body;
  const id = await db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `insert into posts (author_id, title, excerpt, content, cover_image_url, status, published_at)
       values ($1, $2, $3, $4, $5, $6::post_status, case when $6::post_status = 'published' then now() end)
       returning id`,
      [req.user.id, title, excerpt, content, coverImageUrl ?? null, status]
    );
    await setPostTags(client, rows[0].id, tags);
    return rows[0].id;
  });
  res.status(201).json({ post: await getPost(id, req.user.id) });
});

// PUT /api/posts/:id  (full replace)
router.put('/:id', ...canWrite, validate(schemas.post), async (req, res) => {
  const id = parseId(req.params.id);
  const { title, excerpt, content, coverImageUrl, status, tags } = req.valid.body;

  await db.withTransaction(async (client) => {
    const { rows } = await client.query('select author_id from posts where id = $1 for update', [id]);
    if (!rows[0]) throw notFound('Post not found');
    // THE rule that matters: enforced here on the server, not just by hiding a button in React.
    if (!isOwnerOrAdmin(req.user, rows[0].author_id)) throw forbidden('You can only edit your own posts');

    await client.query(
      `update posts
          set title = $2, excerpt = $3, content = $4, cover_image_url = $5, status = $6::post_status,
              published_at = case when $6::post_status = 'published' then coalesce(published_at, now()) else published_at end
        where id = $1`,
      [id, title, excerpt, content, coverImageUrl ?? null, status]
    );
    await setPostTags(client, id, tags);
  });
  res.json({ post: await getPost(id, req.user.id) });
});

// DELETE /api/posts/:id
router.delete('/:id', ...canWrite, async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await db.query('select author_id, cover_image_url as "coverImageUrl" from posts where id = $1', [id]);
  if (!rows[0]) throw notFound('Post not found');
  if (!isOwnerOrAdmin(req.user, rows[0].author_id)) throw forbidden('You can only delete your own posts');
  const { rows: references } = await db.query(
    'select count(*)::int as count from posts where cover_image_url = $1 and id <> $2',
    [rows[0].coverImageUrl, id]
  );
  if (rows[0].coverImageUrl && references[0].count === 0) await deleteImage(rows[0].coverImageUrl);
  await db.query('delete from posts where id = $1', [id]);
  res.status(204).end();
});

// ---------------------------------------------------------------- likes (1 per user per post: primary key)
async function likeSummary(postId, userId) {
  const { rows } = await db.query(
    `select (select count(*)::int from likes where post_id = $1) as "likeCount",
            exists (select 1 from likes where post_id = $1 and user_id = $2) as liked`,
    [postId, userId]
  );
  return rows[0];
}

async function requirePublished(id) {
  const { rows } = await db.query("select 1 from posts where id = $1 and status = 'published'", [id]);
  if (!rows[0]) throw notFound('Post not found');
}

// POST /api/posts/:id/like  (idempotent: liking twice is not an error and never double counts)
router.post('/:id/like', authenticate, async (req, res) => {
  const id = parseId(req.params.id);
  await requirePublished(id);
  await db.query('insert into likes (user_id, post_id) values ($1, $2) on conflict do nothing', [req.user.id, id]);
  res.json(await likeSummary(id, req.user.id));
});

// DELETE /api/posts/:id/like
router.delete('/:id/like', authenticate, async (req, res) => {
  const id = parseId(req.params.id);
  await requirePublished(id);
  await db.query('delete from likes where user_id = $1 and post_id = $2', [req.user.id, id]);
  res.json(await likeSummary(id, req.user.id));
});

// ---------------------------------------------------------------- comments (one level of replies)
// GET /api/posts/:id/comments
router.get('/:id/comments', async (req, res) => {
  const id = parseId(req.params.id);
  await requirePublished(id);
  const { rows } = await db.query(
    `select c.id, c.parent_id as "parentId", c.body, c.created_at as "createdAt",
            json_build_object('id', u.id, 'name', u.name, 'role', u.role) as author
       from comments c join users u on u.id = c.user_id
      where c.post_id = $1
      order by c.created_at asc, c.id asc`,
    [id]
  );
  const data = rows
    .filter((c) => c.parentId === null)
    .map((c) => ({ ...c, replies: rows.filter((r) => r.parentId === c.id) }));
  res.json({ data });
});

// POST /api/posts/:id/comments  { body, parentId? }
router.post('/:id/comments', authenticate, validate(schemas.comment), async (req, res) => {
  const id = parseId(req.params.id);
  const { body, parentId } = req.valid.body;
  await requirePublished(id);

  if (parentId) {
    const { rows } = await db.query('select post_id, parent_id from comments where id = $1', [parentId]);
    if (!rows[0] || rows[0].post_id !== id) throw badRequest('Parent comment not found on this post');
    if (rows[0].parent_id !== null) throw badRequest('Replies can only be one level deep');
  }

  const { rows } = await db.query(
    `with new_comment as (
       insert into comments (post_id, user_id, parent_id, body) values ($1, $2, $3, $4) returning *
     )
     select c.id, c.parent_id as "parentId", c.body, c.created_at as "createdAt",
            json_build_object('id', u.id, 'name', u.name, 'role', u.role) as author
       from new_comment c join users u on u.id = c.user_id`,
    [id, req.user.id, parentId ?? null, body]
  );
  res.status(201).json({ comment: { ...rows[0], replies: [] } });
});

module.exports = router;
