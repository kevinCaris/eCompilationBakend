const multer = require('multer');
const { logoStorage } = require('../config/cloudinary');

/**
 * Filtre pour valider le type de fichier
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG, SVG ou WebP.'), false);
  }
};

/**
 * Middleware d'upload pour les logos de partis
 * - Stockage: Cloudinary
 * - Taille max : 5MB
 * - Types : JPG, PNG, SVG, WebP
 */
const uploadLogo = multer({
  storage: logoStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = uploadLogo;
