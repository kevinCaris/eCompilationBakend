const express = require('express');
const router = express.Router();
const centreController = require('../controllers/centreDeVoteController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post(
    '/',
    authenticate,
    authorize('SUPER_ADMIN'),
    centreController.createCentreDeVote
);

router.get(
    '/',
    authenticate,
    centreController.getAllCentresDeVote
);

router.get(
    '/stats',
    authenticate,
    centreController.getCentresStatistics
);

router.get(
    '/:id',
    authenticate,
    centreController.getCentreDeVoteById
);

// READ BY QUARTIER - Récupérer les centres d'un quartier
router.get(
    '/quartier/:quartierId',
    authenticate,
    centreController.getCentresByQuartier
);

// UPDATE - Mettre à jour un centre
router.put(
    '/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    centreController.updateCentreDeVote
);

// DELETE - Supprimer un centre
router.delete(
    '/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    centreController.deleteCentreDeVote
);

module.exports = router;
