const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier s'il n'existe pas
const uploadDir = path.join(__dirname, '../../uploads/partis');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configuration du storage pour multer
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const partiId = req.params.id;
    const ext = path.extname(file.originalname);
    const filename = `logo_${partiId}${ext}`;
    cb(null, filename);
  },
});

/**
 * Filtre pour valider le type de fichier
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/svg+xml'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou SVG.'), false);
  }
};

/**
 * Middleware d'upload
 * - Taille max : 5MB
 * - Types : JPG, PNG, SVG
 */
const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = uploadLogo;
