const partiService = require('../services/partiService');
const { success, error } = require('../utils/response');

// CREATE
const createParti = async (req, res, next) => {
    try {
        const { electionId, nom, sigle } = req.body;

        const parti = await partiService.createParti({
            electionId,
            nom,
            sigle
        });

        res.status(201).json(success(parti, 'Parti créé avec succès', 201));
    } catch (err) {
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID d\'élection requis', 400));
        }
        if (err.message === 'NOM_REQUIRED') {
            return res.status(400).json(error('Nom du parti requis', 400));
        }
        if (err.message === 'ELECTION_NOT_FOUND') {
            return res.status(404).json(error('Élection non trouvée', 404));
        }
        next(err);
    }
};

// READ ALL
const getAllPartis = async (req, res, next) => {
    try {
        const { electionId, limit = 100, offset = 0 } = req.query;

        const partis = await partiService.getAllPartis({
            electionId,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json(success(partis, 'Partis récupérés avec succès'));
    } catch (err) {
        next(err);
    }
};

// READ BY ID
const getPartiById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const parti = await partiService.getPartiById(id);
        res.json(success(parti, 'Parti récupéré avec succès'));
    } catch (err) {
        if (err.message === 'PARTI_ID_REQUIRED') {
            return res.status(400).json(error('ID du parti requis', 400));
        }
        if (err.message === 'PARTI_NOT_FOUND') {
            return res.status(404).json(error('Parti non trouvé', 404));
        }
        next(err);
    }
};

// READ PARTIS BY ELECTION
const getPartisByElection = async (req, res, next) => {
    try {
        const { electionId } = req.params;

        const partis = await partiService.getPartisByElection(electionId);
        res.json(success(partis, 'Partis de l\'élection récupérés avec succès'));
    } catch (err) {
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID d\'élection requis', 400));
        }
        if (err.message === 'ELECTION_NOT_FOUND') {
            return res.status(404).json(error('Élection non trouvée', 404));
        }
        next(err);
    }
};

// UPDATE
const updateParti = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const parti = await partiService.updateParti(id, data);
        res.json(success(parti, 'Parti mis à jour avec succès'));
    } catch (err) {
        if (err.message === 'PARTI_ID_REQUIRED') {
            return res.status(400).json(error('ID du parti requis', 400));
        }
        if (err.message === 'PARTI_NOT_FOUND') {
            return res.status(404).json(error('Parti non trouvé', 404));
        }
        next(err);
    }
};

// DELETE
const deleteParti = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await partiService.deleteParti(id);
        res.json(success(result, 'Parti supprimé avec succès'));
    } catch (err) {
        if (err.message === 'PARTI_ID_REQUIRED') {
            return res.status(400).json(error('ID du parti requis', 400));
        }
        if (err.message === 'PARTI_NOT_FOUND') {
            return res.status(404).json(error('Parti non trouvé', 404));
        }
        next(err);
    }
};

// UPLOAD LOGO
const uploadLogo = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json(error('Aucun fichier fourni', 400));
        }

        const updatedParti = await partiService.saveLogo(id, req.file);
        res.json(success(updatedParti, 'Logo uploadé avec succès', 200));
    } catch (err) {
        if (err.message === 'PARTI_NOT_FOUND') {
            return res.status(404).json(error('Parti non trouvé', 404));
        }
        if (err.message === 'NO_FILE_PROVIDED') {
            return res.status(400).json(error('Aucun fichier fourni', 400));
        }
        next(err);
    }
};

// DELETE LOGO
const deleteLogo = async (req, res, next) => {
    try {
        const { id } = req.params;

        const updatedParti = await partiService.deleteLogo(id);
        res.json(success(updatedParti, 'Logo supprimé avec succès', 200));
    } catch (err) {
        if (err.message === 'PARTI_NOT_FOUND') {
            return res.status(404).json(error('Parti non trouvé', 404));
        }
        next(err);
    }
};

module.exports = {
    createParti,
    getAllPartis,
    getPartiById,
    getPartisByElection,
    updateParti,
    deleteParti,
    uploadLogo,
    deleteLogo
};
