const express = require('express');
const {
    getAllDepartements,
    getDepartementById,
    getAllCommunes,
    getCommuneById,
    getAllCirconscriptions,
    getCirconscriptionById,
    getCirconscriptionsByCommune,
    getAllArrondissements,
    getArrondissementById,
    getArrondissementsByCirconscription,
    getAllQuartiers,
    getQuartierById,
    getQuartiersByArrondissement,
    getStatistiquesGeographiques
} = require('../controllers/geographieController');

const router = express.Router();

router.get('/geographie/stats', getStatistiquesGeographiques);

// DÉPARTEMENTS
router.get('/departements', getAllDepartements);
router.get('/departements/:id', getDepartementById);

// COMMUNES
router.get('/communes', getAllCommunes);
router.get('/communes/:id', getCommuneById);

// CIRCONSCRIPTIONS
router.get('/circonscriptions', getAllCirconscriptions);
router.get('/circonscriptions/:id', getCirconscriptionById);
router.get('/communes/:communeId/circonscriptions', getCirconscriptionsByCommune);

// ARRONDISSEMENTS
router.get('/arrondissements', getAllArrondissements);
router.get('/arrondissements/:id', getArrondissementById);
router.get('/circonscriptions/:circonscriptionId/arrondissements', getArrondissementsByCirconscription);

// QUARTIERS
router.get('/quartiers', getAllQuartiers);
router.get('/quartiers/:id', getQuartierById);
router.get('/arrondissements/:arrondissementId/quartiers', getQuartiersByArrondissement);

module.exports = router;
