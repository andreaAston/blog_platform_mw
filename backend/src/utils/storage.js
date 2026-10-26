const fs = require('fs/promises');
const path = require('path');
const config = require('../config');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const useSupabase = Boolean(config.supabaseUrl && config.supabaseServiceKey);

let supabase = null;
if (useSupabase) {
  const { createClient } = require('@supabase/supabase-js');
  // The service-role key can do anything, so it lives ONLY on the server (never in the React app).
  supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, { auth: { persistSession: false } });
}

// Saves an image buffer and returns a public URL.
async function saveImage(buffer, filename, req) {
  if (supabase) {
    const { error } = await supabase.storage
      .from(config.supabaseBucket)
      .upload(filename, buffer, { contentType: 'image/webp', cacheControl: '31536000' });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    return supabase.storage.from(config.supabaseBucket).getPublicUrl(filename).data.publicUrl;
  }
  // Local fallback for development: write to ./uploads and serve it from /uploads.
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

async function deleteImage(url) {
  if (!url) return;

  const imageUrl = new URL(url);
  const filenamePattern = /^\d+-[0-9a-f-]+\.webp$/i;

  if (supabase) {
    const storageUrl = new URL(config.supabaseUrl);
    const bucketPrefix = `/storage/v1/object/public/${encodeURIComponent(config.supabaseBucket)}/`;
    if (imageUrl.origin !== storageUrl.origin || !imageUrl.pathname.startsWith(bucketPrefix)) return;

    const objectPath = decodeURIComponent(imageUrl.pathname.slice(bucketPrefix.length));
    if (!filenamePattern.test(objectPath)) return;

    const { error } = await supabase.storage.from(config.supabaseBucket).remove([objectPath]);
    if (error) throw new Error(`Supabase image deletion failed: ${error.message}`);
    return;
  }

  const localPrefix = '/uploads/';
  if (!imageUrl.pathname.startsWith(localPrefix)) return;

  const filename = decodeURIComponent(imageUrl.pathname.slice(localPrefix.length));
  if (!filenamePattern.test(filename)) return;
  await fs.unlink(path.join(UPLOAD_DIR, filename));
}

module.exports = { saveImage, deleteImage, UPLOAD_DIR };
