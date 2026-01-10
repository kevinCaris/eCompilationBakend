const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ficheStorage } = require('../config/cloudinary');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

/**
 * Filtre pour valider le type de fichier
 */
const ficheFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Format non autorisé. Utilisez JPEG, PNG, WebP ou PDF.'), false);
};

/**
 * Middleware multer pour les fiches de collecte - Stockage Cloudinary
 */
const uploadFiche = multer({
  storage: ficheStorage,
  fileFilter: ficheFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * @route POST /api/uploads/fiche-collecte
 * @desc Upload d'une fiche de collecte (photo/PDF) vers Cloudinary
 * @access Private (AGENT, SA, ADMIN)
 */
router.post(
  '/fiche-collecte',
  authenticate,
  authorize('SUPER_ADMIN', 'SA', 'ADMIN', 'AGENT'),
  (req, res, next) => {
    uploadFiche.single('file')(req, res, (err) => {
      if (err) {
        console.error('Erreur Multer/Cloudinary:', err);
        return res.status(500).json({
          success: false,
          message: err.message || 'Erreur lors de l\'upload',
          error: err.name
        });
      }
      next();
    });
  },
  (req, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier fourni'
        });
      }

      // L'URL Cloudinary est dans file.path
      res.status(201).json({
        success: true,
        message: 'Fichier uploadé avec succès sur Cloudinary',
        data: {
          url: file.path, // URL Cloudinary
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          cloudinaryId: file.filename // Pour suppression future
        }
      });
    } catch (error) {
      console.error('Erreur upload fiche collecte:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'upload du fichier',
        error: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  }
);

/**
 * @route GET /api/uploads/info
 * @desc Obtenir les informations sur les uploads
 * @access Private
 */
router.get('/info', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      maxFileSize: '10 MB',
      allowedFormats: ['JPEG', 'PNG', 'WebP', 'PDF'],
      endpoint: '/api/uploads/fiche-collecte',
      storage: 'Cloudinary'
    }
  });
});

module.exports = router;
