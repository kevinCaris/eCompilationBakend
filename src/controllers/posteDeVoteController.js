const posteService = require('../services/posteDeVoteService');
const { success, error } = require('../utils/response');


const createPostesForCentre = async (req, res, next) => {
    try {
        const { centreDeVoteId, nombrePostes } = req.body;

        const result = await posteService.createPostesForCentre(centreDeVoteId, nombrePostes);
        res.status(201).json(success(result, 'Postes créés avec succès', 201));
    } catch (err) {
        if (err.message === 'CENTRE_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'CENTRE_NOT_FOUND') {
            return res.status(404).json(error('Centre de vote non trouvé', 404));
        }
        if (err.message === 'NOMBRE_POSTES_INVALID') {
            return res.status(400).json(error('Nombre de postes invalide', 400));
        }
        next(err);
    }
};

const getPostesByCentre = async (req, res, next) => {
    try {
        const { centreId } = req.params;

        const postes = await posteService.getPostesByCentre(centreId);
        res.json(success(postes, 'Postes du centre récupérés avec succès'));
    } catch (err) {
        if (err.message === 'CENTRE_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'POSTES_NOT_FOUND') {
            return res.status(404).json(error('Aucun poste trouvé pour ce centre', 404));
        }
        next(err);
    }
};

const getPosteById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const poste = await posteService.getPosteById(id);
        res.json(success(poste, 'Poste récupéré avec succès'));
    } catch (err) {
        if (err.message === 'POSTE_ID_REQUIRED') {
            return res.status(400).json(error('ID du poste requis', 400));
        }
        if (err.message === 'POSTE_NOT_FOUND') {
            return res.status(404).json(error('Poste non trouvé', 404));
        }
        next(err);
    }
};

const updatePoste = async (req, res, next) => {
    try {
        const { id } = req.params;

        const poste = await posteService.updatePoste(id, req.body);
        res.json(success(poste, 'Poste mis à jour avec succès'));
    } catch (err) {
        if (err.message === 'POSTE_ID_REQUIRED') {
            return res.status(400).json(error('ID du poste requis', 400));
        }
        if (err.message === 'POSTE_NOT_FOUND') {
            return res.status(404).json(error('Poste non trouvé', 404));
        }
        next(err);
    }
};

const deletePoste = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await posteService.deletePoste(id);
        res.json(success(result, 'Poste supprimé avec succès'));
    } catch (err) {
        if (err.message === 'POSTE_ID_REQUIRED') {
            return res.status(400).json(error('ID du poste requis', 400));
        }
        if (err.message === 'POSTE_NOT_FOUND') {
            return res.status(404).json(error('Poste non trouvé', 404));
        }
        next(err);
    }
};

const deletePostesByCentre = async (req, res, next) => {
    try {
        const { centreId } = req.params;

        const result = await posteService.deletePostesByCentre(centreId);
        res.json(success(result, result.message));
    } catch (err) {
        if (err.message === 'CENTRE_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'POSTES_NOT_FOUND') {
            return res.status(404).json(error('Aucun poste à supprimer pour ce centre', 404));
        }
        next(err);
    }
};

module.exports = {
    createPostesForCentre,
    getPostesByCentre,
    getPosteById,
    updatePoste,
    deletePoste,
    deletePostesByCentre
};
