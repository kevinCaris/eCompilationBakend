const express = require('express');
const router = express.Router();
const resultatPartiController = require('../controllers/resultatPartiController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// ============ ROUTES VOIX PAR PARTI ============

// 1️⃣ POST - Ajouter voix pour un parti à un résultat saisi
router.post(
    '/:resultSaisiId/voix-partis',
    authenticate,
    authorize('SA'),
    resultatPartiController.addVoixParti
);

// 2️⃣ GET - Lister tous les partis d'un résultat saisi
router.get(
    '/:resultSaisiId/voix-partis',
    authenticate,
    resultatPartiController.getAllVoixPartis
);

// 3️⃣ GET - Récupérer résumé des voix avec pourcentages
router.get(
    '/:resultSaisiId/voix-partis/resume',
    authenticate,
    resultatPartiController.getSummaryVoixPartis
);

// 4️⃣ GET - Récupérer voix d'un parti spécifique
router.get(
    '/:resultSaisiId/voix-partis/:partiId',
    authenticate,
    resultatPartiController.getVoixParti
);

// 5️⃣ PUT - Mettre à jour voix d'un parti
router.put(
    '/:resultSaisiId/voix-partis/:partiId',
    authenticate,
    authorize('SA'),
    resultatPartiController.updateVoixParti
);

// 6️⃣ DELETE - Supprimer voix d'un parti
router.delete(
    '/:resultSaisiId/voix-partis/:partiId',
    authenticate,
    authorize('SA'),
    resultatPartiController.deleteVoixParti
);

module.exports = router;
