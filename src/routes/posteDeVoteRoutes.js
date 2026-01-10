const express = require('express');
const router = express.Router();
const posteController = require('../controllers/posteDeVoteController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post(
    '/',
    authenticate,
    posteController.createPostesForCentre
);

router.get(
    '/centre/:centreId',
    authenticate,
    posteController.getPostesByCentre
);

router.get(
    '/:id',
    authenticate,
    posteController.getPosteById
);

router.put(
    '/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    posteController.updatePoste
);

router.delete(
    '/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    posteController.deletePoste
);

router.delete(
    '/centre/:centreId',
    authenticate,
    authorize('SUPER_ADMIN'),
    posteController.deletePostesByCentre
);

module.exports = router;
