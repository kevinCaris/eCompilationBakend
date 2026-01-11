const express = require('express');
const router = express.Router();
const recapElectoralController = require('../controllers/recapElectoralController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// ============ CHECK STATUS - SA vérifie s'il a déjà un récap ============
router.get(
    '/recapitulatifs-electoraux/check-status',
    authenticate,
    authorize('SA'),
    recapElectoralController.checkRecapStatus
);

// ============ GET ME - Récapitulatif du SA connecté ============
router.get(
    '/recapitulatifs-electoraux/me',
    authenticate,
    authorize('SA'),
    recapElectoralController.getMyRecapitulatif
);

router.post(
    '/recapitulatifs-electoraux',
    authenticate,
    authorize('SA'),
    recapElectoralController.createRecapitulatifElectoral
);

router.get(
    '/recapitulatifs-electoraux',
    authenticate,
    recapElectoralController.getAllRecapitulatifsElectoraux
);

router.get(
    '/recapitulatifs-electoraux/election/:electionId',
    authenticate,
    recapElectoralController.getRecapitulatifsElectorauxByElection
);

router.get(
    '/recapitulatifs-electoraux/election/:electionId/rapport',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    recapElectoralController.getRapportHierarchiqueByElection
);


router.get(
    '/recapitulatifs-electoraux/election/:electionId/commune/:communeId/export-pdf',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    recapElectoralController.exportTableauMatricielPDF
);

router.get(
    '/expoarrondissementIdrts/centre/:electionId/:centreId/pdf',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    recapElectoralController.exportCentreDetailPDF
);


router.get(
    '/exports/circonscription/:electionId/:circonscriptionId/pdf',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    recapElectoralController.exportCirconscriptionPDF
);

// ============ EXPORT CENTRES PAR ARRONDISSEMENT - Pour SA (téléchargement auto de son arrondissement) ============
router.get(
    '/exports/arrondissement/:electionId/me/pdf',
    authenticate,
    authorize('SA'),
    recapElectoralController.exportCentresParArrondissementPDFForSA
);

// ============ EXPORT CENTRES PAR ARRONDISSEMENT - Pour ADMIN (avec paramètres) ============
router.get(
    '/exports/arrondissement/:electionId/:arrondissementId/pdf',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    recapElectoralController.exportCentresParArrondissementPDF
);

// ============ GET BY SA - Authentifié requis ============

router.get(
    '/recapitulatifs-electoraux/sa/:saId',
    authenticate,
    recapElectoralController.getRecapitulatifsElectorauxBySA
);

// ============ GET BY ID - Authentifié requis ============
router.get(
    '/recapitulatifs-electoraux/:id',
    authenticate,
    recapElectoralController.getRecapitulatifElectoralById
);

// ============ UPDATE - SA seulement ============
router.put(
    '/recapitulatifs-electoraux/:id',
    authenticate,
    authorize('SA'),
    recapElectoralController.updateRecapitulatifElectoral
);

// ============ DELETE - SA seulement ============
router.delete(
    '/recapitulatifs-electoraux/:id',
    authenticate,
    authorize('SA'),
    recapElectoralController.deleteRecapitulatifElectoral
);

module.exports = router;
