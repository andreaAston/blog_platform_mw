const express = require('express');
const db = require('../db');
const schemas = require('../schemas');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { notFound, badRequest, parseId } = require('../errors');
const { postSelect } = require('../utils/posts');

const router = express.Router();
router.use(authenticate, requireRole('admin')); // every route in this file is admin-only

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { rows } = await db.query(
    `select u.id, u.name, u.email, u.role, u.created_at as "createdAt",
            (select count(*)::int from posts p where p.author_id = u.id) as "postCount"
       from users u order by u.id`
  );
  res.json({ data: rows });
});

// PATCH /api/admin/users/:id/role  { role }
router.patch('/users/:id/role', validate(schemas.roleChange), async (req, res) => {
  const id = parseId(req.params.id);
  const { role } = req.valid.body;
  if (id === req.user.id && role !== 'admin') throw badRequest('You cannot remove your own admin role');
  const { rows } = await db.query(
    'update users set role = $2 where id = $1 returning id, name, email, role',
    [id, role]
  );
  if (!rows[0]) throw notFound('User not found');
  res.json({ user: rows[0] });
});

// GET /api/admin/posts - every post, including drafts (delete via DELETE /api/posts/:id)
router.get('/posts', async (req, res) => {
  const { rows } = await db.query(
    `${postSelect({ viewer: '$1' })} order by p.created_at desc limit 100`,
    [req.user.id]
  );
  res.json({ data: rows });
});

// GET /api/admin/comments - latest 50 comments (delete via DELETE /api/comments/:id)
router.get('/comments', async (req, res) => {
  const { rows } = await db.query(
    `select c.id, c.body, c.created_at as "createdAt", c.parent_id as "parentId",
            p.id as "postId", p.title as "postTitle",
            json_build_object('id', u.id, 'name', u.name) as author
       from comments c
       join posts p on p.id = c.post_id
       join users u on u.id = c.user_id
      order by c.created_at desc limit 50`
  );
  res.json({ data: rows });
});

module.exports = router;
