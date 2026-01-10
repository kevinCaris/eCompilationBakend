const resultatPartiService = require('../services/resultatPartiService');
const { success, error } = require('../utils/response');

// CREATE - Ajouter voix pour un parti
const addVoixParti = async (req, res, next) => {
    try {
        const { resultSaisiId } = req.params;
        const { partiId, voix } = req.body;

        const result = await resultatPartiService.addVoixParti(resultSaisiId, partiId, voix);
        res.status(201).json(success(result, 'Voix ajoutée avec succès', 201));
    } catch (err) {
        if (err.message === 'RESULT_SAISI_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat saisi requis', 400));
        }
        if (err.message === 'PARTI_ID_REQUIRED') {
            return res.status(400).json(error('ID du parti requis', 400));
        }
        if (err.message === 'VOIX_REQUIRED') {
            return res.status(400).json(error('Nombre de voix requis', 400));
        }
        if (err.message === 'VOIX_MUST_BE_POSITIVE') {
            return res.status(400).json(error('Le nombre de voix doit être positif', 400));
        }
        if (err.message === 'RESULT_SAISI_NOT_FOUND') {
            return res.status(404).json(error('Résultat saisi non trouvé', 404));
        }
        if (err.message === 'PARTI_NOT_FOUND') {
            return res.status(404).json(error('Parti non trouvé', 404));
        }
        if (err.message === 'PARTI_NOT_IN_ELECTION') {
            return res.status(400).json(error('Ce parti n\'appartient pas à cette élection', 400));
        }
        if (err.message === 'VOIX_ALREADY_EXISTS') {
            return res.status(409).json(error('Ce parti a déjà des voix pour ce résultat', 409));
        }
        next(err);
    }
};

// GET ALL - Lister tous les partis d'un résultat
const getAllVoixPartis = async (req, res, next) => {
    try {
        const { resultSaisiId } = req.params;
        const results = await resultatPartiService.getAllVoixPartis(resultSaisiId);
        res.json(success(results, 'Voix des partis récupérées avec succès'));
    } catch (err) {
        if (err.message === 'RESULT_SAISI_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat saisi requis', 400));
        }
        if (err.message === 'RESULT_SAISI_NOT_FOUND') {
            return res.status(404).json(error('Résultat saisi non trouvé', 404));
        }
        next(err);
    }
};

// GET BY ID - Récupérer voix d'un parti spécifique
const getVoixParti = async (req, res, next) => {
    try {
        const { resultSaisiId, partiId } = req.params;
        const result = await resultatPartiService.getVoixParti(resultSaisiId, partiId);
        res.json(success(result, 'Voix du parti récupérée avec succès'));
    } catch (err) {
        if (err.message === 'RESULT_SAISI_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat saisi requis', 400));
        }
        if (err.message === 'PARTI_ID_REQUIRED') {
            return res.status(400).json(error('ID du parti requis', 400));
        }
        if (err.message === 'RESULT_SAISI_NOT_FOUND') {
            return res.status(404).json(error('Résultat saisi non trouvé', 404));
        }
        if (err.message === 'VOIX_NOT_FOUND') {
            return res.status(404).json(error('Voix non trouvée pour ce parti', 404));
        }
        next(err);
    }
};

// UPDATE - Modifier voix d'un parti
const updateVoixParti = async (req, res, next) => {
    try {
        const { resultSaisiId, partiId } = req.params;
        const { voix } = req.body;

        const result = await resultatPartiService.updateVoixParti(resultSaisiId, partiId, voix);
        res.json(success(result, 'Voix mise à jour avec succès'));
    } catch (err) {
        if (err.message === 'RESULT_SAISI_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat saisi requis', 400));
        }
        if (err.message === 'PARTI_ID_REQUIRED') {
            return res.status(400).json(error('ID du parti requis', 400));
        }
        if (err.message === 'VOIX_REQUIRED') {
            return res.status(400).json(error('Nombre de voix requis', 400));
        }
        if (err.message === 'VOIX_MUST_BE_POSITIVE') {
            return res.status(400).json(error('Le nombre de voix doit être positif', 400));
        }
        if (err.message === 'RESULT_SAISI_NOT_FOUND') {
            return res.status(404).json(error('Résultat saisi non trouvé', 404));
        }
        if (err.message === 'VOIX_NOT_FOUND') {
            return res.status(404).json(error('Voix non trouvée pour ce parti', 404));
        }
        if (err.message === 'RESULT_SAISI_ALREADY_VALIDATED') {
            return res.status(400).json(error('Impossible de modifier: le résultat est validé', 400));
        }
        next(err);
    }
};

// DELETE - Supprimer voix d'un parti
const deleteVoixParti = async (req, res, next) => {
    try {
        const { resultSaisiId, partiId } = req.params;
        const result = await resultatPartiService.deleteVoixParti(resultSaisiId, partiId);
        res.json(success(result, 'Voix supprimée avec succès'));
    } catch (err) {
        if (err.message === 'RESULT_SAISI_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat saisi requis', 400));
        }
        if (err.message === 'PARTI_ID_REQUIRED') {
            return res.status(400).json(error('ID du parti requis', 400));
        }
        if (err.message === 'RESULT_SAISI_NOT_FOUND') {
            return res.status(404).json(error('Résultat saisi non trouvé', 404));
        }
        if (err.message === 'VOIX_NOT_FOUND') {
            return res.status(404).json(error('Voix non trouvée pour ce parti', 404));
        }
        if (err.message === 'RESULT_SAISI_ALREADY_VALIDATED') {
            return res.status(400).json(error('Impossible de supprimer: le résultat est validé', 400));
        }
        next(err);
    }
};

// GET SUMMARY - Résumé des voix
const getSummaryVoixPartis = async (req, res, next) => {
    try {
        const { resultSaisiId } = req.params;
        const result = await resultatPartiService.getSummaryVoixPartis(resultSaisiId);
        res.json(success(result, 'Résumé des voix récupéré avec succès'));
    } catch (err) {
        if (err.message === 'RESULT_SAISI_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat saisi requis', 400));
        }
        if (err.message === 'RESULT_SAISI_NOT_FOUND') {
            return res.status(404).json(error('Résultat saisi non trouvé', 404));
        }
        next(err);
    }
};

module.exports = {
    addVoixParti,
    getAllVoixPartis,
    getVoixParti,
    updateVoixParti,
    deleteVoixParti,
    getSummaryVoixPartis
};
