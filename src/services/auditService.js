const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Service d'audit enrichi pour tracer toutes les actions utilisateurs
 */

// ============ CRÉATION DE LOG ============

/**
 * Créer un log d'audit enrichi
 * @param {Object} params - Paramètres du log
 * @param {string|null} params.userId - ID de l'utilisateur (peut être null pour actions anonymes)
 * @param {string} params.action - Action effectuée (voir constants/auditActions.js)
 * @param {string|null} params.resource - Type de ressource concernée
 * @param {string|null} params.resourceId - ID de la ressource concernée
 * @param {string|null} params.method - Méthode HTTP
 * @param {string|null} params.path - Chemin de la requête
 * @param {string|null} params.ipAddress - Adresse IP
 * @param {string|null} params.userAgent - User-Agent du navigateur
 * @param {Object|null} params.oldValues - Anciennes valeurs (avant modification)
 * @param {Object|null} params.newValues - Nouvelles valeurs (après modification)
 * @param {number|null} params.statusCode - Code HTTP de réponse
 * @param {Object|null} params.details - Détails additionnels
 * @param {number|null} params.duration - Durée de la requête en ms
 */
const createLog = async ({
  userId = null,
  action,
  resource = null,
  resourceId = null,
  method = null,
  path = null,
  ipAddress = null,
  userAgent = null,
  oldValues = null,
  newValues = null,
  statusCode = null,
  details = null,
  duration = null,
}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        method,
        path: path ? path.substring(0, 500) : null,
        ipAddress,
        userAgent: userAgent ? userAgent.substring(0, 500) : null,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        statusCode,
        details: details ? JSON.stringify(details) : null,
        duration,
      },
    });
  } catch (error) {
    console.error('Erreur création log audit:', error);
    // Ne pas faire échouer l'application si le log échoue
    return null;
  }
};

/**
 * Version simplifiée pour créer un log rapidement
 * @param {string|null} userId 
 * @param {string} action 
 * @param {Object|null} details 
 */
const createSimpleLog = async (userId, action, details = null) => {
  return createLog({
    userId,
    action,
    details,
  });
};

/**
 * Créer un log pour une action CRUD
 * @param {Object} params
 */
const createCrudLog = async ({
  userId,
  action,
  resource,
  resourceId,
  oldValues = null,
  newValues = null,
  req = null,
}) => {
  return createLog({
    userId,
    action,
    resource,
    resourceId,
    method: req?.method || null,
    path: req?.originalUrl || null,
    ipAddress: req ? getClientIp(req) : null,
    userAgent: req?.headers?.['user-agent'] || null,
    oldValues,
    newValues,
  });
};

// ============ RÉCUPÉRATION DE LOGS ============

/**
 * Récupérer les logs d'un utilisateur
 */
const getLogsByUser = async (userId, limit = 50) => {
  try {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  } catch (error) {
    console.error('Erreur récupération logs utilisateur:', error);
    throw error;
  }
};

/**
 * Récupérer les logs par action
 */
const getLogsByAction = async (action, limit = 50) => {
  try {
    return await prisma.auditLog.findMany({
      where: { action },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  } catch (error) {
    console.error('Erreur récupération logs par action:', error);
    throw error;
  }
};

/**
 * Récupérer les logs par ressource
 */
const getLogsByResource = async (resource, resourceId = null, limit = 50) => {
  try {
    const where = { resource };
    if (resourceId) where.resourceId = resourceId;
    
    return await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  } catch (error) {
    console.error('Erreur récupération logs par ressource:', error);
    throw error;
  }
};

/**
 * Récupérer tous les logs avec pagination
 */
const getAllLogs = async (limit = 100, offset = 0) => {
  try {
    return await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  } catch (error) {
    console.error('Erreur récupération tous les logs:', error);
    throw error;
  }
};

/**
 * Récupérer les logs avec filtres avancés
 */
const getLogsWithFilters = async (filters = {}) => {
  try {
    const { 
      userId, 
      action, 
      resource, 
      resourceId,
      startDate, 
      endDate, 
      method,
      statusCode,
      limit = 100, 
      offset = 0 
    } = filters;
    
    const where = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (method) where.method = method;
    if (statusCode) where.statusCode = statusCode;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }
    
    return await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  } catch (error) {
    console.error('Erreur récupération logs filtrés:', error);
    throw error;
  }
};

/**
 * Compter les logs avec filtres optionnels
 */
const countLogs = async (filters = {}) => {
  try {
    const { userId, action, resource, resourceId, startDate, endDate, method, statusCode } = filters;
    
    const where = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = { contains: action };
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (method) where.method = method;
    if (statusCode) where.statusCode = statusCode;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }
    
    return await prisma.auditLog.count({ where });
  } catch (error) {
    console.error('Erreur comptage logs:', error);
    throw error;
  }
};

/**
 * Récupérer l'historique d'une ressource spécifique
 */
const getResourceHistory = async (resource, resourceId) => {
  try {
    return await prisma.auditLog.findMany({
      where: {
        resource,
        resourceId,
      },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  } catch (error) {
    console.error('Erreur récupération historique ressource:', error);
    throw error;
  }
};

/**
 * Récupérer les statistiques d'activité
 */
const getActivityStats = async (startDate = null, endDate = null) => {
  try {
    const where = {};
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }
    
    // Compter par action
    const actionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
      take: 20,
    });
    
    // Compter par utilisateur
    const userStats = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });
    
    // Compter par ressource
    const resourceStats = await prisma.auditLog.groupBy({
      by: ['resource'],
      where: { ...where, resource: { not: null } },
      _count: { resource: true },
      orderBy: { _count: { resource: 'desc' } },
    });
    
    // Total
    const total = await prisma.auditLog.count({ where });
    
    return {
      total,
      byAction: actionStats.map(s => ({ action: s.action, count: s._count.action })),
      byUser: userStats.map(s => ({ userId: s.userId, count: s._count.userId })),
      byResource: resourceStats.map(s => ({ resource: s.resource, count: s._count.resource })),
    };
  } catch (error) {
    console.error('Erreur stats activité:', error);
    throw error;
  }
};

/**
 * Récupérer les dernières activités d'un utilisateur
 */
const getUserRecentActivity = async (userId, limit = 20) => {
  try {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        timestamp: true,
        details: true,
      },
    });
  } catch (error) {
    console.error('Erreur activité récente utilisateur:', error);
    throw error;
  }
};

/**
 * Nettoyer les anciens logs (utile pour la maintenance)
 * @param {number} daysToKeep - Nombre de jours de logs à conserver
 */
const cleanOldLogs = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });
    
    console.log(`${result.count} logs supprimés (plus de ${daysToKeep} jours)`);
    return result;
  } catch (error) {
    console.error('Erreur nettoyage logs:', error);
    throw error;
  }
};

// ============ UTILITAIRES ============

/**
 * Extraire l'adresse IP du client
 */
const getClientIp = (req) => {
  if (!req) return null;
  
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         null;
};

/**
 * Préparer les valeurs pour le log (nettoyer les données sensibles)
 */
const sanitizeValues = (values) => {
  if (!values) return null;
  
  const sanitized = { ...values };
  
  // Supprimer les champs sensibles
  const sensitiveFields = ['password', 'token', 'code', 'secret', 'otp'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

module.exports = {
  createLog,
  createSimpleLog,
  createCrudLog,
  getLogsByUser,
  getLogsByAction,
  getLogsByResource,
  getAllLogs,
  getLogsWithFilters,
  countLogs,
  getResourceHistory,
  getActivityStats,
  getUserRecentActivity,
  cleanOldLogs,
  getClientIp,
  sanitizeValues,
};
