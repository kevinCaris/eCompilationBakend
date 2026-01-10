const express = require('express');
const router = express.Router();
const partiController = require('../controllers/partiController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const uploadLogo = require('../middlewares/uploadMiddleware');

router.post(
    '/partis',
    authenticate,
    authorize('SUPER_ADMIN','SA'),
    partiController.createParti
);

router.get(
    '/partis',
    authenticate,
    partiController.getAllPartis
);

router.get(
    '/elections/:electionId/partis',
    authenticate,
    partiController.getPartisByElection
);


router.get(
    '/partis/:id',
    authenticate,
    partiController.getPartiById
);

router.put(
    '/partis/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    partiController.updateParti
);

router.delete(
    '/partis/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    partiController.deleteParti
);

router.post(
    '/partis/:id/logo',
    authenticate,
    (req, res, next) => {
        uploadLogo.single('logo')(req, res, next);
    },
    partiController.uploadLogo
);

router.delete(
    '/partis/:id/logo',
    authenticate,
    partiController.deleteLogo
);

module.exports = router;
