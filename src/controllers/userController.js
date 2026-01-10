const userService = require('../services/userServices');
const { success, error } = require('../utils/response');
const { createCrudLog } = require('../services/auditService');
const { AUDIT_ACTIONS, RESOURCES } = require('../constants/auditActions');

const createUser = async (req, res, next) => {
    try {
        const newUser = await userService.createUser(req.body);
        
        // Log la création d'utilisateur
        await createCrudLog({
            userId: req.user?.userId || null,
            action: AUDIT_ACTIONS.USER.CREATED,
            resource: RESOURCES.USER,
            resourceId: newUser.id,
            newValues: { email: newUser.email, role: newUser.role },
            req,
        });
        
        res.status(201).json(success(newUser, 'Utilisateur créé avec succès', 201));
    } catch (err) {
        if (err.message === 'EMAIL_EXISTS') {
            return res.status(400).json(error('Cet email existe déjà', 400));
        }
        next(err);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const { page, limit, role, search } = req.query;
        const options = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 10,
            role, search
        };
        const result = await userService.getAllUsers(options);
        res.json(success(result, 'Liste des utilisateurs récupérée avec succès'));
    } catch (err) {
        next(err);
    }
};

// Récupérer un utilisateur par ID
const getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
        if (!userId) return res.status(400).json(error('ID utilisateur requis', 400));
        const user = await userService.getUserById(userId);
        res.json(success(user, 'Utilisateur récupéré avec succès'));
    } catch (err) {
        if (err.message === 'USER_NOT_FOUND') {
            return res.status(404).json(error('Utilisateur non trouvé', 404));
        }
        next(err);
    }
};

// Mettre à jour un utilisateur
const updateUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        if (!userId) return res.status(400).json(error('ID utilisateur requis', 400));
        
        // Récupérer l'ancien utilisateur pour l'audit
        const oldUser = await userService.getUserById(userId).catch(() => null);
        
        const updatedUser = await userService.updateUser(userId, req.body);
        
        // Log la modification
        await createCrudLog({
            userId: req.user?.userId || null,
            action: AUDIT_ACTIONS.USER.UPDATED,
            resource: RESOURCES.USER,
            resourceId: userId,
            oldValues: oldUser ? { email: oldUser.email, role: oldUser.role } : null,
            newValues: { email: updatedUser.email, role: updatedUser.role },
            req,
        });
        
        res.json(success(updatedUser, 'Utilisateur mis à jour avec succès'));
    } catch (err) {
        if (err.message === 'USER_NOT_FOUND') return res.status(404).json(error('Utilisateur non trouvé', 404));
        if (err.message === 'EMAIL_EXISTS') return res.status(400).json(error('Cet email existe déjà', 400));
        next(err);
    }
};

// Supprimer un utilisateur
const deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        if (!userId) return res.status(400).json(error('ID utilisateur requis', 400));
        
        // Récupérer l'utilisateur avant suppression pour l'audit
        const userToDelete = await userService.getUserById(userId).catch(() => null);
        
        await userService.deleteUser(userId);
        
        // Log la suppression (action critique)
        await createCrudLog({
            userId: req.user?.userId || null,
            action: AUDIT_ACTIONS.USER.DELETED,
            resource: RESOURCES.USER,
            resourceId: userId,
            oldValues: userToDelete ? { email: userToDelete.email, role: userToDelete.role } : null,
            req,
        });
        
        res.json(success(null, 'Utilisateur supprimé avec succès'));
    } catch (err) {
        if (err.message === 'USER_NOT_FOUND') return res.status(404).json(error('Utilisateur non trouvé', 404));
        next(err);
    }
};

// Récupérer les utilisateurs par rôle
const getUsersByRole = async (req, res, next) => {
    try {
        const { role } = req.params;
        if (!['SUPER_ADMIN', 'ADMIN', 'SA', 'AGENT'].includes(role)) {
            return res.status(400).json(error('Rôle invalide', 400));
        }
        const users = await userService.getUsersByRole(role);
        res.json(success(users, `Liste des ${role} récupérée`));
    } catch (err) {
        next(err);
    }
};

// Récupérer les SA d'un arrondissement
const getSAByArrondissement = async (req, res, next) => {
    try {
        const arrondissementId = req.params.arrondissementId;
        if (!arrondissementId) return res.status(400).json(error('ID arrondissement requis', 400));
        const users = await userService.getSAByArrondissement(arrondissementId);
        res.json(success(users, 'Liste des SA récupérée'));
    } catch (err) {
        next(err);
    }
};

// Récupérer les agents d'un centre de vote
const getAgentsByCentre = async (req, res, next) => {
    try {
        const centreDeVoteId = req.params.centreId;
        if (!centreDeVoteId) return res.status(400).json(error('ID centre requis', 400));
        const users = await userService.getAgentsByCentre(centreDeVoteId);
        res.json(success(users, 'Liste des agents récupérée'));
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getUsersByRole,
    getSAByArrondissement,
    getAgentsByCentre
};