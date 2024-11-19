const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

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

const upload = multer({ storage: storage, limits:{fileSize: 1024 * 1024 * 1} }).single('image');

// Middleware pour optimiser les images
async function optimizeImageMiddleware(req, res, next) {
  if (!req.file) {
    return next();
  }

  const inputPath = path.join(__dirname, 'images', req.file.filename);
  const tempPath = path.join(__dirname, 'images', `temp_${req.file.filename}`);

  try {

    fs.mkdirSync('./images/optimized', { recursive: true });

    // Optimiser l'image
    await sharp(inputPath)
      .resize({ width: 463,
        height: 595 }) 
      .toFormat('webp', { quality: 80 }) 
      .toFile(tempPath);

    // Supprimer l'image originale et la remplacer par l'optimisée
    await fs.unlinkSync(inputPath);
    await fs.renameSync(tempPath, inputPath);

    
    next();
  } catch (error) {
    console.error("Erreur lors de l'optimisation de l'image :", error);
    res.status(500).json({ error: "Erreur lors du traitement de l'image" });
  }
}

module.exports = { upload, optimizeImageMiddleware };