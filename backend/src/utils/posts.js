const db = require('../db');

// Builds the SELECT used by the feed, post page, and admin list.
// `viewer` is the SQL placeholder (like '$3') that holds the logged-in user's id (or null).
function postSelect({ withContent = false, viewer }) {
  return `
    select p.id, p.title, p.excerpt,
           ${withContent ? 'p.content,' : ''}
           p.cover_image_url as "coverImageUrl", p.status,
           p.view_count as "viewCount",
           p.published_at as "publishedAt", p.created_at as "createdAt", p.updated_at as "updatedAt",
           json_build_object('id', u.id, 'name', u.name) as author,
           coalesce((select json_agg(t.name order by t.name)
                       from post_tags pt join tags t on t.id = pt.tag_id
                      where pt.post_id = p.id), '[]'::json) as tags,
           (select count(*)::int from likes l where l.post_id = p.id) as "likeCount",
           (select count(*)::int from comments c where c.post_id = p.id) as "commentCount",
           exists (select 1 from likes l where l.post_id = p.id and l.user_id = ${viewer}::int) as "likedByMe"
      from posts p
      join users u on u.id = p.author_id`;
}

async function getPost(id, viewerId, client = db) {
  const { rows } = await client.query(`${postSelect({ withContent: true, viewer: '$2' })} where p.id = $1`, [
    id,
    viewerId ?? null,
  ]);
  return rows[0] || null;
}

// Escape % and _ so a user searching for "50%" does not accidentally use LIKE wildcards.
const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&');

// Replace a post's tags with the given list (creates missing tags). Run inside a transaction.
async function setPostTags(client, postId, tags) {
  await client.query('delete from post_tags where post_id = $1', [postId]);
  if (!tags.length) return;
  const unique = [...new Set(tags)];
  await client.query('insert into tags (name) select unnest($1::text[]) on conflict (name) do nothing', [unique]);
  await client.query(
    'insert into post_tags (post_id, tag_id) select $1, id from tags where name = any($2::text[])',
    [postId, unique]
  );
}

module.exports = { postSelect, getPost, escapeLike, setPostTags };
