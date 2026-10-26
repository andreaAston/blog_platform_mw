// Fills the database with demo data.  Usage: npm run seed
// Run `npm run db:schema` first (or paste database/schema.sql into the Supabase SQL editor).
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const { pool, withTransaction } = require('../src/db');

// Demo accounts. These passwords are for local/demo use only - change them for a real deployment.
const USERS = [
  { key: 'admin', name: 'Site Admin', email: 'admin@example.com', password: 'Admin12345', role: 'admin' },
  { key: 'chikondi', name: 'Chikondi Banda', email: 'chikondi@example.com', password: 'Password123', role: 'author' },
  { key: 'thandiwe', name: 'Thandiwe Phiri', email: 'thandiwe@example.com', password: 'Password123', role: 'author' },
  { key: 'mphatso', name: 'Mphatso Kamanga', email: 'mphatso@example.com', password: 'Password123', role: 'reader' },
  { key: 'tiyamike', name: 'Tiyamike Mwale', email: 'tiyamike@example.com', password: 'Password123', role: 'reader' },
];

// NOTE: these are placeholder posts so the app looks real on day one.
// Rewrite them in your own words before the demo - the markers say "sample" on purpose.
const POSTS = [
  {
    author: 'chikondi',
    title: 'Surviving load-shedding as a student in Blantyre',
    excerpt: 'Blackouts do not care about deadlines. Here is how I keep studying when the lights go off.',
    tags: ['load-shedding', 'energy', 'campus-life'],
    daysAgo: 2,
    content: `Power cuts are part of student life here. The schedule changes, the outage lasts longer than announced, and your assignment is still due on Friday. After a few painful semesters, this is what actually helps me.

## Plan around the power, not against it

- **Charge everything when the lights are on.** Phone, power bank, laptop, rechargeable lamp. Make it a habit, like brushing your teeth.
- **Do online work first.** Downloads, uploads and submissions need power *and* data, so do them while both are available.
- **Save often.** Turn on autosave and keep a copy on a flash drive or in cloud storage.

## When the lights go off

1. Switch to offline tasks: reading, handwritten problem solving, planning your report.
2. Move to the library or a friend's place if they have backup power.
3. Use a rechargeable lamp instead of candles. It is safer and your eyes will thank you.

> A small UPS for a desktop, or a laptop with a good battery, pays for itself in lost work avoided.

Check your electricity supplier's announcements for the latest information about schedules. What tricks do you use? Share them in the comments.`,
  },
  {
    author: 'thandiwe',
    title: 'Airtel Money vs TNM Mpamba: which one do I actually use?',
    excerpt: 'Two mobile wallets, one pocket. A practical look at agents, fees and everyday use.',
    tags: ['mobile-money', 'technology', 'students'],
    daysAgo: 4,
    content: `Most of my friends have both **Airtel Money** and **TNM Mpamba**, and we all argue about which is better. This is not a scientific review, just what I notice as an everyday user.

## Where they feel different

| Question | What to check |
| --- | --- |
| Is there an agent nearby? | Agent density differs by area. Count the kiosks on your own street. |
| What does it cost to send or withdraw? | Tariffs change. Always check the current rates on the provider's official channels. |
| Can I pay bills and school fees? | Both support many services, but not every merchant accepts both. |

## Habits that keep my money safe

- Never share your PIN, even with someone who says they work for the provider.
- Double-check the recipient number *before* you press send.
- Keep only what you need in the wallet. Move the rest to your bank account.
- Confirm "reversal" messages by calling the official helpline, not the number in the SMS.

Having both wallets means I can pay whoever I need to pay, but I use one as my main wallet so my transactions stay easy to track.`,
  },
  {
    author: 'chikondi',
    title: 'A week of life at MUBAS',
    excerpt: 'Lectures, labs, group work and the WhatsApp groups that hold it all together.',
    tags: ['campus-life', 'students'],
    daysAgo: 7,
    content: `People ask me what an engineering student's week looks like. Here is an honest version.

## Monday to Wednesday: lectures and labs

Mornings are for lectures. Afternoons are for labs where circuits do not behave the way the textbook said they would. Half of learning electronics is working out why your breadboard is lying to you.

## Thursday: the group project panic

Every group has the same cast: the planner, the coder, the person who writes the report at midnight, and the one who disappears until the demo. Be the teammate you would want.

## Friday and the weekend

- Catch up on reading and submit what is due.
- Test your project properly, not five minutes before the demo.
- Rest. Burnout is real, and a tired brain debugs badly.

## Things I wish I knew in first year

1. Start assignments the day you get them, even if you only write the outline.
2. Learn Git early. Your future self will thank you.
3. Ask lecturers questions. They usually enjoy them.

*This is a sample post. Replace it with your own story.*`,
  },
  {
    author: 'thandiwe',
    title: 'Blantyre or Lilongwe? Two cities, two paces',
    excerpt: 'Malawi\'s commercial centre and its capital feel very different. Here is how they compare day to day.',
    tags: ['cities', 'travel'],
    daysAgo: 10,
    content: `If you have lived in both, you know the two cities have different personalities.

## Blantyre

Blantyre is often described as the commercial heart of the country. It is hilly, busy and a bit chaotic, with markets, minibuses and old colonial buildings sharing the same streets. Things are close together, which makes walking and short minibus rides practical.

## Lilongwe

Lilongwe is the capital, so government offices, embassies and many organisations are based there. It is flatter and more spread out, which often means you depend more on transport to get between places.

## Choosing between them

- **Studying or doing business in trade and industry?** Blantyre has deep roots in both.
- **Working with government or international organisations?** Lilongwe is where many of them are.
- **Cost of living and rent** vary a lot by neighbourhood in both cities, so compare specific areas rather than the cities as a whole.

Whichever you pick, spend a weekend in the other one. You will see the country differently.`,
  },
  {
    author: 'chikondi',
    title: 'Smallholder farming: planning for the rainy season',
    excerpt: 'Small decisions before planting can change the whole harvest. A practical checklist.',
    tags: ['farming', 'agriculture'],
    daysAgo: 14,
    content: `For many Malawian families, the rainy season decides the year. Planning early gives smallholder farmers more control over a lot of things they cannot control, like the weather.

## Before the rains

- **Prepare the field early** so you can plant as soon as the rains are established.
- **Plan your inputs.** Seed and fertiliser prices rise when everyone buys at the same time.
- **Keep good seed.** Choose healthy cobs or pods and store them dry.

## In the field

1. **Mix crops.** Planting legumes such as groundnuts, beans or pigeon peas alongside maize can improve the soil and spread your risk.
2. **Scout for pests regularly.** Early action on pests like fall armyworm saves far more than late spraying.
3. **Weed early.** Weeds compete with young plants for water and nutrients.

## After harvest

- Dry grain and groundnuts properly before storing. Damp storage invites mould and aflatoxin.
- Prices are often lowest right after harvest. If you can store safely, selling later may pay better.

Talk to your local agricultural extension officer. They know what works in your area.`,
  },
  {
    author: 'thandiwe',
    title: 'Draft: why our team chose React',
    excerpt: 'Notes for the presentation. Not ready to publish yet.',
    tags: ['react', 'technology'],
    daysAgo: 0,
    status: 'draft',
    content: `## Outline

- What problem do frameworks solve?
- Why React suits an interactive blog
- When we would pick something else

*(Draft - only the author and admins can see this.)*`,
  },
];

const COMMENTS = [
  { post: 0, user: 'mphatso', body: 'The power bank and rechargeable lamp tip saved my exam week. Thank you!' },
  { post: 0, user: 'tiyamike', body: 'Do you know if the library keeps its power on during outages?' },
  { post: 1, user: 'tiyamike', body: 'Using one main wallet is such a good idea. I always lose track.' },
  { post: 2, user: 'mphatso', body: 'The breadboard lying to you is painfully accurate.' },
  { post: 4, user: 'mphatso', body: 'Intercropping worked really well for my family last season.' },
];
const REPLIES = [
  { parentIndex: 1, post: 0, user: 'chikondi', body: 'Not always, so I keep a charged laptop as a backup. Ask the librarian!' },
  { parentIndex: 4, post: 4, user: 'chikondi', body: 'Great to hear! Which legume did you pair with the maize?' },
];
const LIKES = [
  ['mphatso', 0], ['tiyamike', 0], ['admin', 0], ['mphatso', 1], ['tiyamike', 2], ['mphatso', 2], ['admin', 4],
];

(async () => {
  if (config.isProd && !process.argv.includes('--force')) {
    console.error('Refusing to wipe a production database. Re-run with --force if you really mean it.');
    process.exit(1);
  }

  await withTransaction(async (db) => {
    await db.query('truncate likes, comments, post_tags, tags, posts, users restart identity cascade');

    const ids = {};
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      const { rows } = await db.query(
        'insert into users (name, email, password_hash, role) values ($1, $2, $3, $4) returning id',
        [u.name, u.email, hash, u.role]
      );
      ids[u.key] = rows[0].id;
    }

    const postIds = [];
    for (const p of POSTS) {
      const status = p.status || 'published';
      const { rows } = await db.query(
        `insert into posts (author_id, title, excerpt, content, status, published_at, view_count, created_at)
         values ($1, $2, $3, $4, $5::post_status, case when $5 = 'published' then now() - ($6 || ' days')::interval end,
                 $7, now() - ($6 || ' days')::interval)
         returning id`,
        [ids[p.author], p.title, p.excerpt, p.content, status, String(p.daysAgo), status === 'published' ? 20 + p.daysAgo * 7 : 0]
      );
      postIds.push(rows[0].id);
      for (const tag of p.tags) {
        await db.query('insert into tags (name) values ($1) on conflict (name) do nothing', [tag]);
        await db.query('insert into post_tags (post_id, tag_id) select $1, id from tags where name = $2', [rows[0].id, tag]);
      }
    }

    const commentIds = [];
    for (const c of COMMENTS) {
      const { rows } = await db.query(
        'insert into comments (post_id, user_id, body) values ($1, $2, $3) returning id',
        [postIds[c.post], ids[c.user], c.body]
      );
      commentIds.push(rows[0].id);
    }
    for (const r of REPLIES) {
      await db.query('insert into comments (post_id, user_id, parent_id, body) values ($1, $2, $3, $4)', [
        postIds[r.post], ids[r.user], commentIds[r.parentIndex], r.body,
      ]);
    }
    for (const [user, post] of LIKES) {
      await db.query('insert into likes (user_id, post_id) values ($1, $2)', [ids[user], postIds[post]]);
    }
  });

  console.log('Seeded. Demo logins:');
  USERS.forEach((u) => console.log(`  ${u.role.padEnd(7)} ${u.email.padEnd(24)} ${u.password}`));
  await pool.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
