const electionService = require('../services/electionService');
const { success, error } = require('../utils/response');
const { createCrudLog } = require('../services/auditService');
const { AUDIT_ACTIONS, RESOURCES } = require('../constants/auditActions');

const createElection = async (req, res, next) => {
    try {
        const { type, dateVote } = req.body;
        const createdBy = req.user.userId;
        console.log('Type:', type);
        console.log('Date:', dateVote);
        const election = await electionService.createElection({
            type,
            dateVote,
            createdBy
        });

        // Log la création d'élection
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.ELECTION.CREATED,
            resource: RESOURCES.ELECTION,
            resourceId: election.id,
            newValues: { type, dateVote, statut: election.statut },
            req,
        });

        res.status(201).json(success(election, 'Élection créée avec succès', 201));
    } catch (err) {
        if (err.message === 'TYPE_REQUIRED') {
            return res.status(400).json(error('Type d\'élection requis (LEGISLATIVE ou COMMUNALES)', 400));
        }
        if (err.message === 'DATE_VOTE_REQUIRED') {
            return res.status(400).json(error('Date de vote requise', 400));
        }
        if (err.message === 'USER_NOT_FOUND') {
            return res.status(404).json(error('Utilisateur non trouvé', 404));
        }
        if (err.message === 'ELECTION_ALREADY_EXISTS') {
            return res.status(409).json(error('Une élection de ce type existe déjà pour cette date', 409));
        }
        next(err);
    }
};

const getAllElections = async (req, res, next) => {
    try {
        const { type, limit = 100, offset = 0 } = req.query;

        const elections = await electionService.getAllElections({
            type,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json(success(elections, 'Élections récupérées avec succès'));
    } catch (err) {
        next(err);
    }
};

// READ BY ID
const getElectionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const election = await electionService.getElectionById(id);
        res.json(success(election, 'Élection récupérée avec succès'));
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
const updateElection = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Récupérer l'ancienne élection pour l'audit
        const oldElection = await electionService.getElectionById(id).catch(() => null);

        const election = await electionService.updateElection(id, data);
        
        // Log la modification
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.ELECTION.UPDATED,
            resource: RESOURCES.ELECTION,
            resourceId: id,
            oldValues: oldElection ? { type: oldElection.type, statut: oldElection.statut } : null,
            newValues: data,
            req,
        });
        
        res.json(success(election, 'Élection mise à jour avec succès'));
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

// UPDATE STATUT
const updateStatut = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        // Récupérer l'ancien statut pour l'audit
        const oldElection = await electionService.getElectionById(id).catch(() => null);

        const election = await electionService.updateStatut(id, statut);
        
        // Log le changement de statut (action importante)
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.ELECTION.STATUS_CHANGED,
            resource: RESOURCES.ELECTION,
            resourceId: id,
            oldValues: { statut: oldElection?.statut },
            newValues: { statut },
            req,
        });
        
        res.json(success(election, 'Statut de l\'élection mis à jour avec succès'));
    } catch (err) {
        if (err.message === 'ELECTION_ID_REQUIRED') {
            return res.status(400).json(error('ID d\'élection requis', 400));
        }
        if (err.message === 'ELECTION_NOT_FOUND') {
            return res.status(404).json(error('Élection non trouvée', 404));
        }
        if (err.message === 'STATUT_REQUIRED') {
            return res.status(400).json(error('Statut requis', 400));
        }
        if (err.message === 'INVALID_STATUT') {
            return res.status(400).json(error('Statut invalide (PLANIFIEE, EN_COURS, FERMEE, ARCHIVEE)', 400));
        }
        if (err.message.startsWith('INVALID_STATUS_TRANSITION')) {
            const [_, transition] = err.message.split(':');
            const [from, to] = transition ? transition.split('->') : ['?', '?'];
            return res.status(400).json(error(`Transition de statut non autorisée: Impossible de passer de ${from} à ${to}`, 400));
        }
        next(err);
    }
};

// DELETE
const deleteElection = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Récupérer l'élection avant suppression pour l'audit
        const oldElection = await electionService.getElectionById(id).catch(() => null);

        const result = await electionService.deleteElection(id);
        
        // Log la suppression (action critique)
        await createCrudLog({
            userId: req.user.userId,
            action: AUDIT_ACTIONS.ELECTION.DELETED,
            resource: RESOURCES.ELECTION,
            resourceId: id,
            oldValues: oldElection ? { type: oldElection.type, dateVote: oldElection.dateVote } : null,
            req,
        });
        
        res.json(success(result, 'Élection supprimée avec succès'));
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

module.exports = {
    createElection,
    getAllElections,
    getElectionById,
    updateElection,
    updateStatut,
    deleteElection
};
