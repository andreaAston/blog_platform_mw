const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/tags - tags that have at least one published post, most used first
router.get('/', async (req, res) => {
  const { rows } = await db.query(
    `select t.name, count(*)::int as "postCount"
       from tags t
       join post_tags pt on pt.tag_id = t.id
       join posts p on p.id = pt.post_id and p.status = 'published'
      group by t.name
      order by "postCount" desc, t.name
      limit 30`
  );
  res.json({ data: rows });
});

module.exports = router;
