const resultSaisiService = require('../services/resultSaisiService');
const { success, error } = require('../utils/response');
const { createCrudLog } = require('../services/auditService');
const { AUDIT_ACTIONS, RESOURCES } = require('../constants/auditActions');

const createResultSaisi = async (req, res, next) => {
    try {
        const data = { ...req.body, saId: req.user.userId };
        const result = await resultSaisiService.createResultSaisi(data);
        
        // Log la création
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.RESULT.CREATED,
            resource: RESOURCES.RESULT_SAISI,
            resourceId: result.id,
            newValues: { electionId: data.electionId, posteDeVoteId: data.posteDeVoteId },
            req,
        });
        
        res.status(201).json(success(result, 'Résultat saisi avec succès', 201));
    } catch (err) {
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID de l\'élection requis', 400));
        }
        if (err.message === 'CENTRE_ID_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'POSTE_ID_REQUIRED') {
            return res.status(400).json(error('ID du poste requis', 400));
        }
        if (err.message === 'ELECTION_NOT_FOUND') {
            return res.status(404).json(error('Élection non trouvée', 404));
        }
        if (err.message === 'POSTE_NOT_FOUND') {
            return res.status(404).json(error('Poste de vote non trouvé', 404));
        }
        if (err.message === 'RESULT_ALREADY_EXISTS') {
            return res.status(409).json(error('Un résultat existe déjà pour ce poste', 409));
        }
        next(err);
    }
};

const getAllResultsSaisis = async (req, res, next) => {
    try {
        const { electionId, centreDeVoteId, status, saId, limit = 100, offset = 0 } = req.query;
        const results = await resultSaisiService.getAllResultsSaisis({
            electionId,
            centreDeVoteId,
            status,
            saId,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        res.json(success(results, 'Résultats récupérés avec succès'));
    } catch (err) {
        next(err);
    }
};

const getResultSaisiById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await resultSaisiService.getResultSaisiById(id);
        res.json(success(result, 'Résultat récupéré avec succès'));
    } catch (err) {
        if (err.message === 'RESULT_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat requis', 400));
        }
        if (err.message === 'RESULT_NOT_FOUND') {
            return res.status(404).json(error('Résultat non trouvé', 404));
        }
        next(err);
    }
};

const getResultsByElection = async (req, res, next) => {
    try {
        const { electionId } = req.params;
        const results = await resultSaisiService.getResultsByElection(electionId);
        res.json(success(results, 'Résultats de l\'élection récupérés avec succès'));
    } catch (err) {
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID de l\'élection requis', 400));
        }
        if (err.message === 'ELECTION_NOT_FOUND') {
            return res.status(404).json(error('Élection non trouvée', 404));
        }
        next(err);
    }
};

const getResultsByCentre = async (req, res, next) => {
    try {
        const { centreId } = req.params;
        const { electionId } = req.query; // Permet de filtrer par élection
        const results = await resultSaisiService.getResultsByCentre(centreId, electionId);
        res.json(success(results, 'Résultats du centre récupérés avec succès'));
    } catch (err) {
        if (err.message === 'CENTRE_ID_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'CENTRE_NOT_FOUND') {
            return res.status(404).json(error('Centre non trouvé', 404));
        }
        next(err);
    }
};

const getResultByPoste = async (req, res, next) => {
    try {
        const { electionId, posteId } = req.params;
        const result = await resultSaisiService.getResultByPoste(electionId, posteId);
        res.json(success(result, 'Résultat du poste récupéré avec succès'));
    } catch (err) {
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID de l\'élection requis', 400));
        }
        if (err.message === 'POSTE_ID_REQUIRED') {
            return res.status(400).json(error('ID du poste requis', 400));
        }
        if (err.message === 'RESULT_NOT_FOUND') {
            return res.status(404).json(error('Résultat non trouvé', 404));
        }
        next(err);
    }
};

const updateResultSaisi = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await resultSaisiService.updateResultSaisi(id, req.body, req.user.userId);
        
        // Log la modification
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.RESULT.UPDATED,
            resource: RESOURCES.RESULT_SAISI,
            resourceId: id,
            newValues: req.body,
            req,
        });
        
        res.json(success(result, 'Résultat mis à jour avec succès. En attente de re-validation.'));
    } catch (err) {
        if (err.message === 'RESULT_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat requis', 400));
        }
        if (err.message === 'RESULT_NOT_FOUND') {
            return res.status(404).json(error('Résultat non trouvé', 404));
        }
        if (err.message === 'RESULT_ALREADY_VALIDATED') {
            return res.status(400).json(error('Résultat déjà validé, modification impossible', 400));
        }
        if (err.message === 'RESULT_NOT_REJECTED_CANNOT_EDIT') {
            return res.status(400).json(error('Seul un résultat rejeté peut être modifié. Attendez le rejet de l\'Admin.', 400));
        }
        next(err);
    }
};

const validerResultSaisi = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await resultSaisiService.validerResultSaisi(id);
        
        // Log la validation (action critique)
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.RESULT.VALIDATED,
            resource: RESOURCES.RESULT_SAISI,
            resourceId: id,
            newValues: { status: 'VALIDEE', validatedBy: req.user.userId },
            req,
        });
        
        res.json(success(result, 'Résultat du poste validé avec succès'));
    } catch (err) {
        if (err.message === 'RESULT_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat requis', 400));
        }
        if (err.message === 'RESULT_NOT_FOUND') {
            return res.status(404).json(error('Résultat non trouvé', 404));
        }
        if (err.message === 'RESULT_ALREADY_VALIDATED') {
            return res.status(400).json(error('Résultat déjà validé', 400));
        }
        if (err.message === 'RESULT_REJECTED_MUST_BE_CORRECTED') {
            return res.status(400).json(error('Ce résultat a été rejeté. Le CA doit d\'abord corriger les erreurs.', 400));
        }
        if (err.message === 'NO_PARTY_RESULTS') {
            return res.status(400).json(error('Aucun résultat de parti saisi. Ajoutez les voix des partis avant de valider.', 400));
        }
        next(err);
    }
};

const rejeterResultSaisi = async (req, res, next) => {
    try {
        const { id } = req.params;
        // L'observation est globale dans la compilation, pas par poste
        const result = await resultSaisiService.rejeterResultSaisi(id);
        
        // Log le rejet (action critique)
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.RESULT.REJECTED,
            resource: RESOURCES.RESULT_SAISI,
            resourceId: id,
            newValues: { status: 'REJETEE', rejectedBy: req.user.userId },
            req,
        });
        
        res.json(success(result, 'Poste rejeté. Le CA peut maintenant corriger. Écrivez l\'observation dans la compilation.'));
    } catch (err) {
        if (err.message === 'RESULT_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat requis', 400));
        }
        if (err.message === 'RESULT_NOT_FOUND') {
            return res.status(404).json(error('Résultat non trouvé', 404));
        }
        if (err.message === 'RESULT_ALREADY_VALIDATED') {
            return res.status(400).json(error('Ce résultat est déjà validé et ne peut être rejeté', 400));
        }
        if (err.message === 'RESULT_ALREADY_REJECTED') {
            return res.status(400).json(error('Ce résultat est déjà rejeté', 400));
        }
        next(err);
    }
};

const deleteResultSaisi = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await resultSaisiService.deleteResultSaisi(id);
        
        // Log la suppression (action critique)
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.RESULT.DELETED,
            resource: RESOURCES.RESULT_SAISI,
            resourceId: id,
            req,
        });
        
        res.json(success(result, 'Résultat supprimé avec succès'));
    } catch (err) {
        if (err.message === 'RESULT_ID_REQUIRED') {
            return res.status(400).json(error('ID du résultat requis', 400));
        }
        if (err.message === 'RESULT_NOT_FOUND') {
            return res.status(404).json(error('Résultat non trouvé', 404));
        }
        next(err);
    }
};

const getStatistiquesElection = async (req, res, next) => {
    try {
        const { electionId } = req.params;
        const stats = await resultSaisiService.getStatistiquesElection(electionId);
        res.json(success(stats, 'Statistiques de l\'élection récupérées'));
    } catch (err) {
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID de l\'élection requis', 400));
        }
        next(err);
    }
};

// ============ GET POSTES STATUS BY CENTRE - Vue Admin pour valider les postes ============
const getPostesStatusByCentre = async (req, res, next) => {
    try {
        const { centreId, electionId } = req.params;
        const result = await resultSaisiService.getPostesStatusByCentre(centreId, electionId);
        res.json(success(result, 'Statut des postes du centre récupéré'));
    } catch (err) {
        if (err.message === 'CENTRE_ID_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID de l\'élection requis', 400));
        }
        if (err.message === 'CENTRE_NOT_FOUND') {
            return res.status(404).json(error('Centre non trouvé', 404));
        }
        if (err.message === 'ELECTION_NOT_FOUND') {
            return res.status(404).json(error('Élection non trouvée', 404));
        }
        next(err);
    }
};

// ============ GET POSTES REJETÉS POUR CA - Voir les postes à corriger ============
const getPostesRejetesPourCA = async (req, res, next) => {
    try {
        const saId = req.user.userId;
        const { electionId } = req.query;
        const result = await resultSaisiService.getPostesRejetesPourCA(saId, electionId);
        res.json(success(result, `${result.length} poste(s) rejeté(s) à corriger`));
    } catch (err) {
        if (err.message === 'SA_ID_REQUIRED') {
            return res.status(400).json(error('Authentification requise', 400));
        }
        next(err);
    }
};

const getResultatsSAComplet = async (req, res, next) => {
    try {
        const saId = req.user.userId;
        
        const resultats = await resultSaisiService.getResultatsSAComplet(saId);
        
        res.json(success(
            {
                total: resultats.length,
                resultats: resultats
            },
            'Tous vos résultats saisis récupérés avec succès'
        ));
    } catch (err) {
        if (err.message === 'SA_ID_REQUIRED') {
            return res.status(400).json(error('ID SA requis', 400));
        }
        next(err);
    }
};

const getPostesAuRemplirSA = async (req, res, next) => {
    try {
        const saId = req.user.userId;
        
        const postes = await resultSaisiService.getPostesAuRemplirSA(saId);
        
        res.json(success(
            {
                total: postes.length,
                postes: postes
            },
            'Liste des postes à remplir récupérée avec succès'
        ));
    } catch (err) {
        if (err.message === 'SA_ID_REQUIRED') {
            return res.status(400).json(error('ID SA requis', 400));
        }
        if (err.message === 'SA_NOT_FOUND') {
            return res.status(404).json(error('SA non trouvé', 404));
        }
        next(err);
    }
};

module.exports = {
    createResultSaisi,
    getAllResultsSaisis,
    getResultSaisiById,
    getResultsByElection,
    getResultsByCentre,
    getResultByPoste,
    updateResultSaisi,
    validerResultSaisi,
    rejeterResultSaisi,
    deleteResultSaisi,
    getStatistiquesElection,
    getPostesStatusByCentre,
    getPostesRejetesPourCA,
    getResultatsSAComplet,
    getPostesAuRemplirSA
};
