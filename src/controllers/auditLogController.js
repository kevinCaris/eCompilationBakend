const { 
  getAllLogs, 
  getLogsByUser, 
  getLogsByAction, 
  getLogsWithFilters, 
  countLogs,
  getLogsByResource,
  getResourceHistory,
  getActivityStats,
  getUserRecentActivity,
  cleanOldLogs,
} = require('../services/auditService');
const { success, error } = require('../utils/response');
const { AUDIT_ACTIONS, RESOURCES } = require('../constants/auditActions');

const getAllAuditLogs = async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const offset = req.query.offset || 0;
    
    const logs = await getAllLogs(limit, offset);
    const total = await countLogs();
    
    res.json(success({
      logs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
      },
    }, 'Logs récupérés'));
  } catch (err) {
    res.status(500).json(error('Erreur récupération logs', 500));
  }
};

const getAuditLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit || 50;
    
    const logs = await getLogsByUser(userId, limit);
    
    res.json(success(logs, `${logs.length} log(s) trouvé(s) pour cet utilisateur`));
  } catch (err) {
    res.status(500).json(error('Erreur récupération logs utilisateur', 500));
  }
};

const getAuditLogsByAction = async (req, res) => {
  try {
    const { action } = req.params;
    const limit = req.query.limit || 50;
    
    const logs = await getLogsByAction(action, limit);
    
    res.json(success(logs, `${logs.length} log(s) trouvé(s) pour cette action`));
  } catch (err) {
    res.status(500).json(error('Erreur récupération logs par action', 500));
  }
};

const getAuditLogsWithFilters = async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId || null,
      action: req.query.action || null,
      resource: req.query.resource || null,
      resourceId: req.query.resourceId || null,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      method: req.query.method || null,
      statusCode: req.query.statusCode ? parseInt(req.query.statusCode) : null,
      limit: req.query.limit || 100,
      offset: req.query.offset || 0,
    };
    
    const logs = await getLogsWithFilters(filters);
    const total = await countLogs(filters);
    
    res.json(success({
      logs,
      pagination: {
        limit: parseInt(filters.limit),
        offset: parseInt(filters.offset),
        total,
      },
    }, 'Logs filtrés récupérés'));
  } catch (err) {
    res.status(500).json(error('Erreur récupération logs filtrés', 500));
  }
};

// Nouveau: Récupérer les logs par ressource
const getAuditLogsByResource = async (req, res) => {
  try {
    const { resource } = req.params;
    const { resourceId, limit = 50 } = req.query;
    
    const logs = await getLogsByResource(resource, resourceId, limit);
    
    res.json(success(logs, `${logs.length} log(s) trouvé(s) pour cette ressource`));
  } catch (err) {
    res.status(500).json(error('Erreur récupération logs par ressource', 500));
  }
};

// Nouveau: Récupérer l'historique complet d'une ressource spécifique
const getAuditResourceHistory = async (req, res) => {
  try {
    const { resource, resourceId } = req.params;
    
    if (!resource || !resourceId) {
      return res.status(400).json(error('Resource et resourceId requis', 400));
    }
    
    const history = await getResourceHistory(resource, resourceId);
    
    res.json(success({
      resource,
      resourceId,
      history,
      total: history.length,
    }, `Historique de ${resource} #${resourceId}`));
  } catch (err) {
    res.status(500).json(error('Erreur récupération historique', 500));
  }
};

// Nouveau: Statistiques d'activité
const getAuditActivityStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await getActivityStats(startDate, endDate);
    
    res.json(success(stats, 'Statistiques d\'activité récupérées'));
  } catch (err) {
    res.status(500).json(error('Erreur récupération statistiques', 500));
  }
};

// Nouveau: Activité récente d'un utilisateur
const getAuditUserRecentActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit || 20;
    
    const activity = await getUserRecentActivity(userId, limit);
    
    res.json(success(activity, 'Activité récente récupérée'));
  } catch (err) {
    res.status(500).json(error('Erreur récupération activité', 500));
  }
};

// Nouveau: Liste des actions disponibles
const getAvailableActions = async (req, res) => {
  try {
    res.json(success({
      actions: AUDIT_ACTIONS,
      resources: RESOURCES,
    }, 'Liste des actions et ressources'));
  } catch (err) {
    res.status(500).json(error('Erreur récupération actions', 500));
  }
};

// Nouveau: Nettoyer les anciens logs (SUPER_ADMIN seulement)
const cleanAuditLogs = async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;
    
    if (daysToKeep < 30) {
      return res.status(400).json(error('Minimum 30 jours de conservation requis', 400));
    }
    
    const result = await cleanOldLogs(daysToKeep);
    
    res.json(success({
      deletedCount: result.count,
      daysKept: daysToKeep,
    }, `${result.count} log(s) supprimé(s)`));
  } catch (err) {
    res.status(500).json(error('Erreur nettoyage logs', 500));
  }
};

// Nouveau: Mon activité (pour l'utilisateur connecté)
const getMyActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = req.query.limit || 50;
    
    const logs = await getLogsByUser(userId, limit);
    
    res.json(success(logs, 'Votre activité récente'));
  } catch (err) {
    res.status(500).json(error('Erreur récupération de votre activité', 500));
  }
};

module.exports = {
  getAllAuditLogs,
  getAuditLogsByUser,
  getAuditLogsByAction,
  getAuditLogsWithFilters,
  getAuditLogsByResource,
  getAuditResourceHistory,
  getAuditActivityStats,
  getAuditUserRecentActivity,
  getAvailableActions,
  cleanAuditLogs,
  getMyActivity,
};
