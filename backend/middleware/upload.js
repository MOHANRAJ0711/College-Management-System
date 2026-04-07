const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${safeBase}`);
  },
});

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

/**
 * Single file upload. Default field name: `file`.
 * @param {string} [fieldName='file']
 */
const uploadSingle = (fieldName = 'file') => upload.single(fieldName);

/**
 * Multiple files upload. Default field name: `files`, max 10 files.
 * @param {string} [fieldName='files']
 * @param {number} [maxCount=10]
 */
const uploadMultiple = (fieldName = 'files', maxCount = 10) =>
  upload.array(fieldName, maxCount);

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
};
