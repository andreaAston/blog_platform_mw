const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/posts - the logged-in author's posts with views / likes / comments
router.get('/posts', authenticate, requireRole('author', 'admin'), async (req, res) => {
  const { rows } = await db.query(
    `select p.id, p.title, p.cover_image_url as "coverImageUrl", p.status,
            p.published_at as "publishedAt", p.updated_at as "updatedAt",
            p.view_count as views,
            (select count(*)::int from likes l where l.post_id = p.id)    as likes,
            (select count(*)::int from comments c where c.post_id = p.id) as comments
       from posts p
      where p.author_id = $1
      order by p.updated_at desc`,
    [req.user.id]
  );
  const sum = (key) => rows.reduce((total, r) => total + r[key], 0);
  res.json({
    posts: rows,
    totals: { posts: rows.length, views: sum('views'), likes: sum('likes'), comments: sum('comments') },
  });
});

module.exports = router;
