const compilationService = require('../services/compilationService');
const { success, error } = require('../utils/response');
const { createCrudLog } = require('../services/auditService');
const { AUDIT_ACTIONS, RESOURCES } = require('../constants/auditActions');

// ============ CREATE - Créer compilation ============
const createCompilation = async (req, res, next) => {
    try {
        const { electionId, centreDeVoteId, agentId, urlPhoto } = req.body;

        const compilation = await compilationService.createCompilation({
            electionId,
            centreDeVoteId,
            agentId,
            urlPhoto
        });

        // Log la création
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.COMPILATION.CREATED,
            resource: RESOURCES.COMPILATION,
            resourceId: compilation.id,
            newValues: { electionId, centreDeVoteId, agentId },
            req,
        });

        res.status(201).json(success(compilation, 'Compilation créée avec succès', 201));
    } catch (err) {
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID de l\'élection requis', 400));
        }
        if (err.message === 'CENTRE_ID_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'AGENT_ID_REQUIRED') {
            return res.status(400).json(error('ID de l\'agent requis', 400));
        }
        if (err.message === 'URL_PHOTO_REQUIRED') {
            return res.status(400).json(error('URL de la photo est requise', 400));
        }
        if (err.message === 'ELECTION_NOT_FOUND') {
            return res.status(404).json(error('Élection non trouvée', 404));
        }
        if (err.message === 'CENTRE_NOT_FOUND') {
            return res.status(404).json(error('Centre de vote non trouvé', 404));
        }
        if (err.message === 'AGENT_NOT_FOUND') {
            return res.status(404).json(error('Agent non trouvé', 404));
        }
        if (err.message === 'INVALID_AGENT_ROLE') {
            return res.status(400).json(error('L\'utilisateur doit être un AGENT ou SA', 400));
        }
        if (err.message === 'COMPILATION_ALREADY_EXISTS') {
            return res.status(409).json(error('Une compilation existe déjà pour ce centre/élection', 409));
        }
        if (err.message === 'NO_RESULTS_FOR_CENTRE') {
            return res.status(400).json(error('Aucun résultat saisi pour ce centre. Saisissez d\'abord les résultats des postes.', 400));
        }
        next(err);
    }
};

// ============ GET ALL - Lister compilations ============
const getAllCompilations = async (req, res, next) => {
    try {
        const { electionId, centreDeVoteId, agentId, status, limit = 100, offset = 0 } = req.query;

        const compilations = await compilationService.getAllCompilations({
            electionId,
            centreDeVoteId,
            agentId,
            status,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json(success(compilations, 'Compilations récupérées avec succès'));
    } catch (err) {
        next(err);
    }
};

// ============ GET BY ID - Récupérer compilation ============
const getCompilationById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const compilation = await compilationService.getCompilationById(id);
        res.json(success(compilation, 'Compilation récupérée avec succès'));
    } catch (err) {
        if (err.message === 'COMPILATION_ID_REQUIRED') {
            return res.status(400).json(error('ID de la compilation requis', 400));
        }
        if (err.message === 'COMPILATION_NOT_FOUND') {
            return res.status(404).json(error('Compilation non trouvée', 404));
        }
        next(err);
    }
};

// ============ GET BY CENTRE - Compilation d'un centre ============
const getCompilationByCentre = async (req, res, next) => {
    try {
        const { centreId, electionId } = req.params;

        if (!electionId) {
            return res.status(400).json(error('ID de l\'élection requis', 400));
        }

        const compilation = await compilationService.getCompilationByCentre(centreId, electionId);
        res.json(success(compilation, 'Compilation du centre récupérée avec succès'));
    } catch (err) {
        if (err.message === 'CENTRE_ID_REQUIRED') {
            return res.status(400).json(error('ID du centre requis', 400));
        }
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID de l\'élection requis', 400));
        }
        if (err.message === 'CENTRE_NOT_FOUND') {
            return res.status(404).json(error('Centre de vote non trouvé', 404));
        }
        if (err.message === 'COMPILATION_NOT_FOUND') {
            return res.status(404).json(error('Compilation non trouvée pour ce centre', 404));
        }
        next(err);
    }
};

// ============ UPDATE - Modifier compilation ============
const updateCompilation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { agentId, urlPhoto } = req.body;

        const compilation = await compilationService.updateCompilation(id, {
            agentId,
            urlPhoto
        });

        res.json(success(compilation, 'Compilation mise à jour avec succès'));
    } catch (err) {
        if (err.message === 'COMPILATION_ID_REQUIRED') {
            return res.status(400).json(error('ID de la compilation requis', 400));
        }
        if (err.message === 'COMPILATION_NOT_FOUND') {
            return res.status(404).json(error('Compilation non trouvée', 404));
        }
        if (err.message === 'COMPILATION_ALREADY_VALIDATED') {
            return res.status(400).json(error('Impossible de modifier: compilation validée', 400));
        }
        if (err.message === 'COMPILATION_ALREADY_REJECTED') {
            return res.status(400).json(error('Impossible de modifier: compilation rejetée', 400));
        }
        if (err.message === 'AGENT_NOT_FOUND') {
            return res.status(404).json(error('Agent non trouvé', 404));
        }
        if (err.message === 'INVALID_AGENT_ROLE') {
            return res.status(400).json(error('L\'utilisateur doit être un AGENT ou SA', 400));
        }
        if (err.message === 'INVALID_PHOTO_URL') {
            return res.status(400).json(error('URL de photo invalide (formats acceptés: jpg, jpeg, png, gif, webp, pdf ou Cloudinary)', 400));
        }
        next(err);
    }
};

// ============ VALIDER - Validation manuelle (si tous postes validés) ============
const validerCompilation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const compilation = await compilationService.validerCompilation(id);
        
        // Log la validation (action critique)
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.COMPILATION.VALIDATED,
            resource: RESOURCES.COMPILATION,
            resourceId: id,
            newValues: { status: 'VALIDEE', validatedBy: req.user.userId },
            req,
        });
        
        res.json(success(compilation, 'Compilation validée avec succès. Tous les postes du centre sont validés.'));
    } catch (err) {
        if (err.message === 'COMPILATION_ID_REQUIRED') {
            return res.status(400).json(error('ID de la compilation requis', 400));
        }
        if (err.message === 'COMPILATION_NOT_FOUND') {
            return res.status(404).json(error('Compilation non trouvée', 404));
        }
        if (err.message === 'COMPILATION_ALREADY_VALIDATED') {
            return res.status(400).json(error('Compilation déjà validée', 400));
        }
        if (err.message === 'PHOTO_REQUIRED_FOR_VALIDATION') {
            return res.status(400).json(error('Une photo est requise pour valider la compilation', 400));
        }
        if (err.message === 'NO_POSTES_FOR_CENTRE') {
            return res.status(400).json(error('Aucun poste saisi pour ce centre', 400));
        }
        if (err.message === 'NOT_ALL_POSTES_VALIDATED') {
            return res.status(400).json(error('Tous les postes du centre doivent être validés avant de valider la compilation', 400));
        }
        next(err);
    }
};

// ============ REJETER - Admin rejette ============
const rejeterCompilation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { raison } = req.body;

        const compilation = await compilationService.rejeterCompilation(id, raison);
        
        // Log le rejet (action critique)
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.COMPILATION.REJECTED,
            resource: RESOURCES.COMPILATION,
            resourceId: id,
            newValues: { status: 'REJETEE', raison, rejectedBy: req.user.userId },
            req,
        });
        
        res.json(success(compilation, 'Compilation rejetée'));
    } catch (err) {
        if (err.message === 'COMPILATION_ID_REQUIRED') {
            return res.status(400).json(error('ID de la compilation requis', 400));
        }
        if (err.message === 'RAISON_REJET_REQUIRED') {
            return res.status(400).json(error('Raison du rejet requise', 400));
        }
        if (err.message === 'COMPILATION_NOT_FOUND') {
            return res.status(404).json(error('Compilation non trouvée', 404));
        }
        if (err.message === 'COMPILATION_ALREADY_VALIDATED') {
            return res.status(400).json(error('Impossible de rejeter: compilation validée', 400));
        }
        if (err.message === 'COMPILATION_ALREADY_REJECTED') {
            return res.status(400).json(error('Compilation déjà rejetée', 400));
        }
        next(err);
    }
};

// ============ DELETE - Supprimer compilation ============
const deleteCompilation = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await compilationService.deleteCompilation(id);
        
        // Log la suppression (action critique)
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.COMPILATION.DELETED,
            resource: RESOURCES.COMPILATION,
            resourceId: id,
            req,
        });
        
        res.json(success(result, 'Compilation supprimée avec succès'));
    } catch (err) {
        if (err.message === 'COMPILATION_ID_REQUIRED') {
            return res.status(400).json(error('ID de la compilation requis', 400));
        }
        if (err.message === 'COMPILATION_NOT_FOUND') {
            return res.status(404).json(error('Compilation non trouvée', 404));
        }
        if (err.message === 'CANNOT_DELETE_VALIDATED_COMPILATION') {
            return res.status(400).json(error('Impossible de supprimer une compilation validée', 400));
        }
        next(err);
    }
};

// ============ GET STATS - Statistiques compilations ============
const getCompilationStats = async (req, res, next) => {
    try {
        const { electionId } = req.params;

        const stats = await compilationService.getCompilationStats(electionId);
        res.json(success(stats, 'Statistiques des compilations récupérées'));
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

// ============ GET DASHBOARD - Tableau de bord complet d'une compilation ============
const getCompilationDashboard = async (req, res, next) => {
    try {
        const { id } = req.params;

        const dashboard = await compilationService.getCompilationDashboard(id);
        res.json(success(dashboard, 'Tableau de bord de la compilation récupéré'));
    } catch (err) {
        if (err.message === 'COMPILATION_ID_REQUIRED') {
            return res.status(400).json(error('ID de la compilation requis', 400));
        }
        if (err.message === 'COMPILATION_NOT_FOUND') {
            return res.status(404).json(error('Compilation non trouvée', 404));
        }
        next(err);
    }
};

// ============ SET OBSERVATION - Admin écrit l'observation globale ============
const setObservation = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { observation } = req.body;

        const compilation = await compilationService.setObservation(id, observation);
        res.json(success(compilation, observation 
            ? 'Observation enregistrée. Le CA peut voir cette observation.' 
            : 'Observation effacée.'));
    } catch (err) {
        if (err.message === 'COMPILATION_ID_REQUIRED') {
            return res.status(400).json(error('ID de la compilation requis', 400));
        }
        if (err.message === 'COMPILATION_NOT_FOUND') {
            return res.status(404).json(error('Compilation non trouvée', 404));
        }
        if (err.message === 'COMPILATION_ALREADY_VALIDATED') {
            return res.status(400).json(error('Impossible de modifier l\'observation d\'une compilation validée', 400));
        }
        next(err);
    }
};

module.exports = {
    createCompilation,
    getAllCompilations,
    getCompilationById,
    getCompilationByCentre,
    updateCompilation,
    validerCompilation,
    rejeterCompilation,
    setObservation,
    deleteCompilation,
    getCompilationStats,
    getCompilationDashboard
};
