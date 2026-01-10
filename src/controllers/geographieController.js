const geographieService = require('../services/geographieService');
const { success, error } = require('../utils/response');

// DÉPARTEMENTS
const getAllDepartements = async (req, res) => {
    try {
        const departements = await geographieService.getAllDepartements();
        res.json(success(departements, 'Liste des départements'));
    } catch (err) {
        res.status(500).json(error('Erreur départements', 500));
    }
};

const getDepartementById = async (req, res) => {
    try {
        const { id } = req.params;
        const departement = await geographieService.getDepartementById(id);
        if (!departement) return res.status(404).json(error('Département non trouvé', 404));
        res.json(success(departement, 'Département récupéré'));
    } catch (err) {
        res.status(500).json(error('Erreur département', 500));
    }
};

// COMMUNES
const getAllCommunes = async (req, res) => {
    try {
        const { departementId } = req.query;
        const communes = await geographieService.getAllCommunes(departementId);
        res.json(success(communes, 'Liste des communes'));
    } catch (err) {
        res.status(500).json(error('Erreur communes', 500));
    }
};

const getCommuneById = async (req, res) => {
    try {
        const { id } = req.params;
        const commune = await geographieService.getCommuneById(id);
        if (!commune) return res.status(404).json(error('Commune non trouvée', 404));
        res.json(success(commune, 'Commune récupérée'));
    } catch (err) {
        res.status(500).json(error('Erreur commune', 500));
    }
};

// CIRCONSCRIPTIONS
const getAllCirconscriptions = async (req, res) => {
    try {
        const { communeId } = req.query;
        const circonscriptions = await geographieService.getAllCirconscriptions(communeId);
        res.json(success(circonscriptions, 'Liste des circonscriptions'));
    } catch (err) {
        res.status(500).json(error('Erreur circonscriptions', 500));
    }
};

const getCirconscriptionById = async (req, res) => {
    try {
        const { id } = req.params;
        const circonscription = await geographieService.getCirconscriptionById(id);
        if (!circonscription) return res.status(404).json(error('Circonscription non trouvée', 404));
        res.json(success(circonscription, 'Circonscription récupérée'));
    } catch (err) {
        res.status(500).json(error('Erreur circonscription', 500));
    }
};

const getCirconscriptionsByCommune = async (req, res) => {
    try {
        const { communeId } = req.params;
        const circonscriptions = await geographieService.getCirconscriptionsByCommune(communeId);
        res.json(success(circonscriptions, 'Circonscriptions de la commune'));
    } catch (err) {
        res.status(500).json(error('Erreur circonscriptions', 500));
    }
};

// ARRONDISSEMENTS
const getAllArrondissements = async (req, res) => {
    try {
        const { circonscriptionId } = req.query;
        const arrondissements = await geographieService.getAllArrondissements(circonscriptionId);
        res.json(success(arrondissements, 'Liste des arrondissements'));
    } catch (err) {
        res.status(500).json(error('Erreur arrondissements', 500));
    }
};

const getArrondissementById = async (req, res) => {
    try {
        const { id } = req.params;
        const arrondissement = await geographieService.getArrondissementById(id);
        if (!arrondissement) return res.status(404).json(error('Arrondissement non trouvé', 404));
        res.json(success(arrondissement, 'Arrondissement récupéré'));
    } catch (err) {
        res.status(500).json(error('Erreur arrondissement', 500));
    }
};

const getArrondissementsByCirconscription = async (req, res) => {
    try {
        const { circonscriptionId } = req.params;
        const arrondissements = await geographieService.getArrondissementsByCirconscription(circonscriptionId);
        res.json(success(arrondissements, 'Arrondissements de la circonscription'));
    } catch (err) {
        res.status(500).json(error('Erreur arrondissements', 500));
    }
};

// QUARTIERS
const getAllQuartiers = async (req, res) => {
    try {
        const { arrondissementId } = req.query;
        const quartiers = await geographieService.getAllQuartiers(arrondissementId);
        res.json(success(quartiers, 'Liste des quartiers'));
    } catch (err) {
        res.status(500).json(error('Erreur quartiers', 500));
    }
};

const getQuartierById = async (req, res) => {
    try {
        const { id } = req.params;
        const quartier = await geographieService.getQuartierById(id);
        if (!quartier) return res.status(404).json(error('Quartier non trouvé', 404));
        res.json(success(quartier, 'Quartier récupéré'));
    } catch (err) {
        res.status(500).json(error('Erreur quartier', 500));
    }
};

const getQuartiersByArrondissement = async (req, res) => {
    try {
        const { arrondissementId } = req.params;
        const quartiers = await geographieService.getQuartiersByArrondissement(arrondissementId);
        res.json(success(quartiers, 'Quartiers de l\'arrondissement'));
    } catch (err) {
        res.status(500).json(error('Erreur quartiers', 500));
    }
};

// STATISTIQUES
const getStatistiquesGeographiques = async (req, res) => {
    try {
        const stats = await geographieService.getStatistiquesGeographiques();
        res.json(success(stats, 'Statistiques géographiques'));
    } catch (err) {
        res.status(500).json(error('Erreur statistiques', 500));
    }
};

module.exports = {
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
};
