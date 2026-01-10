const centreService = require('../services/centreDeVoteService');
const { success, error } = require('../utils/response');

const createCentreDeVote = async (req, res, next) => {
    try {
        const { quartierId, nom, adresse, nombrePostes } = req.body;

        const centre = await centreService.createCentreDeVote({
            quartierId,
            nom,
            adresse,
            nombrePostes
        });

        res.status(201).json(success(centre, 'Centre de vote créé avec succès', 201));
    } catch (err) {
        if (err.message === 'QUARTIER_REQUIRED') {
            return res.status(400).json(error('ID du quartier requis', 400));
        }
        if (err.message === 'NOM_REQUIRED') {
            return res.status(400).json(error('Nom du centre requis', 400));
        }
        if (err.message === 'QUARTIER_NOT_FOUND') {
            return res.status(404).json(error('Quartier non trouvé', 404));
        }
        next(err);
    }
};

const getAllCentresDeVote = async (req, res, next) => {
    try {
        const { quartierId, arrondissementId, electionId, limit = 100, offset = 0 } = req.query;

        // Filtrer par arrondissement si l'utilisateur est SA (responsable d'arrondissement)
        let filterArrondissementId = arrondissementId;
        if (req.user.role === 'SA' && req.user.arrondissementId) {
            filterArrondissementId = req.user.arrondissementId;
        }

        const centres = await centreService.getAllCentresDeVote({
            quartierId,
            arrondissementId: filterArrondissementId,
            electionId,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json(success(centres, 'Centres de vote récupérés avec succès'));
    } catch (err) {
        next(err);
    }
};

const getCentreDeVoteById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const centre = await centreService.getCentreDeVoteById(id);
        res.json(success(centre, 'Centre de vote récupéré avec succès'));
    } catch (err) {
        if (err.message === 'CENTRE_ID_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'CENTRE_NOT_FOUND') {
            return res.status(404).json(error('Centre de vote non trouvé', 404));
        }
        next(err);
    }
};

const getCentresByQuartier = async (req, res, next) => {
    try {
        const { quartierId } = req.params;

        const centres = await centreService.getCentresByQuartier(quartierId);
        res.json(success(centres, 'Centres du quartier récupérés avec succès'));
    } catch (err) {
        if (err.message === 'QUARTIER_ID_REQUIRED') {
            return res.status(400).json(error('ID du quartier requis', 400));
        }
        if (err.message === 'QUARTIER_NOT_FOUND') {
            return res.status(404).json(error('Quartier non trouvé', 404));
        }
        next(err);
    }
};

const updateCentreDeVote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const centre = await centreService.updateCentreDeVote(id, data);
        res.json(success(centre, 'Centre de vote mis à jour avec succès'));
    } catch (err) {
        if (err.message === 'CENTRE_ID_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'CENTRE_NOT_FOUND') {
            return res.status(404).json(error('Centre de vote non trouvé', 404));
        }
        if (err.message === 'QUARTIER_NOT_FOUND') {
            return res.status(404).json(error('Quartier non trouvé', 404));
        }
        next(err);
    }
};

// DELETE
const deleteCentreDeVote = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await centreService.deleteCentreDeVote(id);
        res.json(success(result, 'Centre de vote supprimé avec succès'));
    } catch (err) {
        if (err.message === 'CENTRE_ID_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'CENTRE_NOT_FOUND') {
            return res.status(404).json(error('Centre de vote non trouvé', 404));
        }
        next(err);
    }
};

// STATISTICS
const getCentresStatistics = async (req, res, next) => {
    try {
        const stats = await centreService.getCentresStatistics();
        res.json(success(stats, 'Statistiques des centres de vote'));
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createCentreDeVote,
    getAllCentresDeVote,
    getCentreDeVoteById,
    getCentresByQuartier,
    updateCentreDeVote,
    deleteCentreDeVote,
    getCentresStatistics
};
