const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});
const upload = multer({ storage, limits:{fileSize: 1024 * 1024 * 1}}).single('image');

// Middleware pour optimiser les images
const optimizeImageMiddleware = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const inputPath = (req.file.path);
  const webpImageName = `optimized_${path.basename(req.file.filename, path.extname(req.file.filename))}.webp`;
  const tempPath = path.join('images', webpImageName);

  try {
    await sharp(inputPath).webp({ quality: 80 }).resize({ width: 463, height: 595 }).toFile(tempPath);

    req.file.filename = webpImageName;

    // Suppr image initiale
    fs.unlink(inputPath, error => {
      if (error) {
        console.error("Impossible de supprimer l'image originale :", error);
        return next(error);
      }
      next();
    })
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, optimizeImageMiddleware };