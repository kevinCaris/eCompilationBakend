const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Storage pour les logos des partis
 */
const logoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecompilation/partis',
    allowed_formats: ['jpg', 'jpeg', 'png', 'svg', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'limit' }],
    public_id: (req, file) => {
      const partiId = req.params.id;
      return `logo_${partiId}_${Date.now()}`;
    },
  },
});

/**
 * Storage pour les fiches de collecte
 */
const ficheStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecompilation/fiches-collecte',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    resource_type: 'auto', // Permet PDF et images
    public_id: (req, file) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `fiche_${unique}`;
    },
  },
});

/**
 * Storage pour les images statiques (armoiries, etc.)
 */
const staticStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecompilation/static',
    allowed_formats: ['jpg', 'jpeg', 'png', 'svg', 'webp'],
  },
});

/**
 * Supprimer une image de Cloudinary
 * @param {string} publicId - L'ID public de l'image
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
    throw error;
  }
};

/**
 * Extraire le public_id d'une URL Cloudinary
 * @param {string} url - URL Cloudinary
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  
  // Format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/filename.ext
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  
  // Prendre tout après 'upload/vXXX/' et enlever l'extension
  const pathParts = parts.slice(uploadIndex + 2);
  const publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
  return publicId;
};

module.exports = {
  cloudinary,
  logoStorage,
  ficheStorage,
  staticStorage,
  deleteImage,
  getPublicIdFromUrl,
};
