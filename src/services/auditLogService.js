const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Créer un log d'audit
const createLog = async (userId, action, details = null) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error('Erreur création log:', error);
  }
};

// Récupérer les logs d'un utilisateur
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

// Récupérer les logs par action
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

// Récupérer tous les logs avec pagination
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

// Récupérer les logs avec filtres (date, user, action)
const getLogsWithFilters = async (filters = {}) => {
  try {
    const { userId, action, startDate, endDate, limit = 100, offset = 0 } = filters;
    
    const where = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = action;
    
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

// Compter les logs
const countLogs = async (filters = {}) => {
  try {
    const { userId, action, startDate, endDate } = filters;
    
    const where = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = action;
    
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

module.exports = {
  createLog,
  getLogsByUser,
  getLogsByAction,
  getAllLogs,
  getLogsWithFilters,
  countLogs,
};
