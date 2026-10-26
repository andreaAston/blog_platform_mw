const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { notFound, forbidden, parseId } = require('../errors');

const router = express.Router();

// DELETE /api/comments/:id  - the comment's owner, or an admin (moderation)
router.delete('/:id', authenticate, async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await db.query('select user_id from comments where id = $1', [id]);
  if (!rows[0]) throw notFound('Comment not found');
  if (req.user.role !== 'admin' && req.user.id !== rows[0].user_id) throw forbidden('You can only delete your own comments');
  await db.query('delete from comments where id = $1', [id]); // replies are removed by ON DELETE CASCADE
  res.status(204).end();
});

module.exports = router;
