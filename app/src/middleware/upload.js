const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomUUID();
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF."));
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por imagen
    files: 4
  }
});

module.exports = { upload, UPLOAD_DIR };
