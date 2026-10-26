const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { authenticate, requireRole } = require('../middleware/auth');
const { badRequest } = require('../errors');
const { saveImage } = require('../utils/storage');

const router = express.Router();

// Keep the upload in memory (max 5 MB, one file) - we resize it before saving anyway.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
      ? cb(null, true)
      : cb(badRequest('Only JPEG, PNG or WebP images are allowed')),
});

// POST /api/uploads/cover  (multipart/form-data, field name: "image")
router.post('/cover', authenticate, requireRole('author', 'admin'), upload.single('image'), async (req, res) => {
  if (!req.file) throw badRequest('Attach an image in the "image" field');

  let compressed;
  try {
    // Readers are often on limited data: shrink to max 1200px wide and convert to WebP.
    compressed = await sharp(req.file.buffer)
      .rotate() // respect the phone's EXIF orientation
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
  } catch {
    throw badRequest('That file is not a valid image'); // sharp reads the real bytes, not just the extension
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}.webp`;
  const url = await saveImage(compressed, filename, req);
  res.status(201).json({ url, bytes: compressed.length });
});

module.exports = router;
