const express = require('express');
const router = express.Router();
const resultSaisiController = require('../controllers/resultSaisiController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post(
    '/resultats-saisis',
    authenticate,
    authorize('SA'),
    resultSaisiController.createResultSaisi
);

router.get(
    '/resultats-saisis',
    authenticate,
    resultSaisiController.getAllResultsSaisis
);

router.get(
    '/resultats-saisis/:id',
    authenticate,
    resultSaisiController.getResultSaisiById
);

router.get(
    '/elections/:electionId/resultats',
    authenticate,
    resultSaisiController.getResultsByElection
);

router.get(
    '/centres-de-vote/:centreId/resultats',
    authenticate,
    resultSaisiController.getResultsByCentre
);

router.get(
    '/elections/:electionId/postes/:posteId/resultat',
    authenticate,
    resultSaisiController.getResultByPoste
);

router.put(
    '/resultats-saisis/:id',
    authenticate,
    authorize('SA'),
    resultSaisiController.updateResultSaisi
);

router.patch(
    '/resultats-saisis/:id/valider',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    resultSaisiController.validerResultSaisi
);

router.patch(
    '/resultats-saisis/:id/rejeter',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    resultSaisiController.rejeterResultSaisi
);

router.delete(
    '/resultats-saisis/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    resultSaisiController.deleteResultSaisi
);

router.get(
    '/elections/:electionId/statistiques',
    authenticate,
    resultSaisiController.getStatistiquesElection
);

router.get(
    '/centres-de-vote/:centreId/elections/:electionId/postes-status',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    resultSaisiController.getPostesStatusByCentre
);

router.get(
    '/mes-postes-rejetes',
    authenticate,
    authorize('SA'),
    resultSaisiController.getPostesRejetesPourCA
);

router.get(
    '/sa/mes-resultats',
    authenticate,
    authorize('SA'),
    resultSaisiController.getResultatsSAComplet
);

// Vue SA: Tous les postes du SA qu'il n'a pas encore remplis
router.get(
    '/sa/postes-a-remplir',
    authenticate,
    authorize('SA'),
    resultSaisiController.getPostesAuRemplirSA
);

module.exports = router;
