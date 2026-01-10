const express = require('express');
const router = express.Router();
const electionController = require('../controllers/electionController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post(
    '/elections',
    authenticate,
    authorize('SUPER_ADMIN'),
    electionController.createElection
);

router.get(
    '/elections',
    // authenticate,
    electionController.getAllElections
);

router.get(
    '/elections/:id',
    authenticate,
    electionController.getElectionById
);

router.put(
    '/elections/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    electionController.updateElection
);

router.patch(
    '/elections/:id/statut',
    authenticate,
    authorize('SUPER_ADMIN'),
    electionController.updateStatut
);

router.delete(
    '/elections/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    electionController.deleteElection
);

module.exports = router;
