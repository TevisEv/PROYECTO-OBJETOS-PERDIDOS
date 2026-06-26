const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const sharp = require("sharp");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF."));
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por imagen (se comprime después)
    files: 4
  }
});

// Normaliza cada imagen subida: corrige orientación, limita el ancho máximo
// y la comprime, para que todas se vean nítidas y con un peso consistente
// sin importar el tamaño original del archivo.
async function saveProcessedImages(files) {
  if (!files || !files.length) return [];

  const filenames = [];
  for (const file of files) {
    const filename = `${crypto.randomUUID()}.jpg`;
    const outputPath = path.join(UPLOAD_DIR, filename);

    await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toFile(outputPath);

    filenames.push(filename);
  }
  return filenames;
}

function deleteImageFile(filename) {
  fs.unlink(path.join(UPLOAD_DIR, filename), () => {});
}

module.exports = { upload, UPLOAD_DIR, saveProcessedImages, deleteImageFile };
