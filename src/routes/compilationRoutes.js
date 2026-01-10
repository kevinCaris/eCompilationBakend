const express = require('express');
const router = express.Router();
const compilationController = require('../controllers/compilationController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// ============ ROUTES COMPILATIONS ============

router.post(
    '/',
    authenticate,
    authorize('SA', 'ADMIN'),
    compilationController.createCompilation
);

router.get(
    '/',
    authenticate,
    compilationController.getAllCompilations
);

router.get(
    '/elections/:electionId/stats',
    authenticate,
    compilationController.getCompilationStats
);

router.get(
    '/:id/dashboard',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    compilationController.getCompilationDashboard
);

router.get(
    '/centres/:centreId/elections/:electionId',
    authenticate,
    compilationController.getCompilationByCentre
);

router.get(
    '/:id',
    authenticate,
    compilationController.getCompilationById
);

router.put(
    '/:id',
    authenticate,
    authorize('SA', 'ADMIN'),
    compilationController.updateCompilation
);

router.patch(
    '/:id/valider',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    compilationController.validerCompilation
);

router.patch(
    '/:id/rejeter',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    compilationController.rejeterCompilation
);

router.patch(
    '/:id/observation',
    authenticate,
    authorize('ADMIN', 'SUPER_ADMIN'),
    compilationController.setObservation
);

router.delete(
    '/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    compilationController.deleteCompilation
);

module.exports = router;
