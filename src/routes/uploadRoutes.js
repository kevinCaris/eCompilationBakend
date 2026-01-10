const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Middleware multer spécifique pour les fiches de collecte
const fichesDir = path.join(__dirname, '../../uploads/fiches-collecte');
if (!fs.existsSync(fichesDir)) {
  fs.mkdirSync(fichesDir, { recursive: true });
}

const ficheStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, fichesDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `fiche_${unique}${ext}`);
  }
});

const ficheFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Format non autorisé'), false);
};

const uploadFiche = multer({ storage: ficheStorage, fileFilter: ficheFileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const { authenticate, authorize } = require('../middlewares/authMiddleware');

/**
 * @route POST /api/uploads/fiche-collecte
 * @desc Upload d'une fiche de collecte (photo/PDF)
 * @access Private (AGENT, SA, ADMIN)
 */
router.post(
  '/fiche-collecte',
  authenticate,
  authorize('SUPER_ADMIN', 'SA', 'ADMIN', 'AGENT'),
  uploadFiche.single('file'),
  (req, res) => {
    try {
      const file = req.file;

      // Construire l'URL publique du fichier
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const fileUrl = `${baseUrl}/uploads/fiches-collecte/${file.filename}`;

      res.status(201).json({
        success: true,
        message: 'Fichier uploadé avec succès',
        data: {
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        }
      });
    } catch (error) {
      console.error('Erreur upload fiche collecte:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload du fichier'
      });
    }
  });

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
      endpoint: '/api/uploads/fiche-collecte'
    }
  });
});

module.exports = router;
