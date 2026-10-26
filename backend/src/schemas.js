const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(120);
const tagName = z.string().trim().toLowerCase().min(2, 'Tags need at least 2 characters').max(30);
const httpUrl = z
  .string()
  .max(500)
  .refine((u) => /^https?:\/\//i.test(u), 'Must be an http(s) URL');

const register = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email,
  // bcrypt only looks at the first 72 bytes, so cap the length there.
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72)
    .regex(/[A-Za-z]/, 'Password needs at least one letter')
    .regex(/[0-9]/, 'Password needs at least one number'),
  // Self-service sign-up can only create readers or authors. Admins are promoted by an admin.
  role: z.enum(['reader', 'author']).default('reader'),
});

const login = z.object({ email, password: z.string().min(1, 'Password is required') });

const post = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  excerpt: z.string().trim().max(300).default(''),
  content: z.string().max(50000).default(''),
  coverImageUrl: httpUrl.nullable().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(tagName).max(5, 'Use at most 5 tags').default([]),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(6),
  q: z.string().trim().max(80).optional(),
  tag: z.string().trim().toLowerCase().max(30).optional(),
  author: z.coerce.number().int().min(1).optional(),
});

const comment = z.object({
  body: z.string().trim().min(1, 'Comment cannot be empty').max(1000),
  parentId: z.number().int().min(1).optional(),
});

const roleChange = z.object({ role: z.enum(['reader', 'author', 'admin']) });

module.exports = { register, login, post, listQuery, comment, roleChange };
