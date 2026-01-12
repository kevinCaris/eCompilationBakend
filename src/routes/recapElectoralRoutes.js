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
    '/exports/centre/:electionId/:centreId/pdf',
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

// ============ EXPORT COMMUNE PDF ============
// Récapitulatif général de la commune par circonscription
router.get(
    '/exports/commune/:electionId/:communeId/pdf',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    recapElectoralController.exportCommunePDF
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

// ============ EXPORT RÉCAPITULATIF GÉNÉRAL DES RÉSULTATS - COMPLET ============
// PDF complet avec détails par poste, par centre et tableau récapitulatif
router.get(
    '/exports/arrondissement/:electionId/:arrondissementId/recap-complet-pdf',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    recapElectoralController.exportRecapGeneralResultatsPDF
);

// ============ EXPORT RÉCAPITULATIF DES HORAIRES PAR ARRONDISSEMENT ============
// PDF avec heures d'ouverture et de fermeture (fermeture = ouverture + 10h)
router.get(
    '/exports/arrondissement/:electionId/:arrondissementId/horaires-pdf',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    recapElectoralController.exportRecapHorairesPDF
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

// ============ UPDATE - ADMIN seulement ============
router.put(
    '/recapitulatifs-electoraux/:id',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
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
