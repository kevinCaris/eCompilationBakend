const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const {
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
} = require('../controllers/auditLogController');

const router = express.Router();

// ============ ROUTES POUR TOUS LES UTILISATEURS AUTHENTIFIÉS ============

// Mon activité personnelle
router.get('/audit-logs/my-activity', authenticate, getMyActivity);

// ============ ROUTES ADMIN/SUPER_ADMIN ============

// Récupérer tous les logs avec pagination
router.get('/audit-logs', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAllAuditLogs);

// Récupérer les logs avec filtres avancés
router.get('/audit-logs/filter', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAuditLogsWithFilters);

// Statistiques d'activité
router.get('/audit-logs/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAuditActivityStats);

// Liste des actions et ressources disponibles
router.get('/audit-logs/actions', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAvailableActions);

// Récupérer les logs d'un utilisateur spécifique
router.get('/audit-logs/user/:userId', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAuditLogsByUser);

// Activité récente d'un utilisateur
router.get('/audit-logs/user/:userId/recent', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAuditUserRecentActivity);

// Récupérer les logs par action
router.get('/audit-logs/action/:action', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAuditLogsByAction);

// Récupérer les logs par ressource
router.get('/audit-logs/resource/:resource', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAuditLogsByResource);

// Historique complet d'une ressource spécifique
router.get('/audit-logs/history/:resource/:resourceId', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), getAuditResourceHistory);

// ============ ROUTES SUPER_ADMIN SEULEMENT ============

// Nettoyer les anciens logs
router.delete('/audit-logs/clean', authenticate, authorize('SUPER_ADMIN'), cleanAuditLogs);

module.exports = router;
