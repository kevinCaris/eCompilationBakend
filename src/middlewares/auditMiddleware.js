const { createLog, getClientIp } = require('../services/auditService');

/**
 * Middleware d'audit automatique
 * Capture automatiquement les informations de requête et le résultat
 */
const auditMiddleware = (action, resource = null) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Capturer la méthode send originale
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Extraire les infos de la requête
    const auditData = {
      userId: req.user?.userId || null,
      action,
      resource,
      resourceId: req.params?.id || req.params?.electionId || req.params?.userId || req.body?.id || null,
      method: req.method,
      path: req.originalUrl,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || null,
      details: {
        params: req.params,
        query: req.query,
        // Ne pas logger le body complet pour des raisons de sécurité (peut contenir des données sensibles)
        bodyKeys: req.body ? Object.keys(req.body) : [],
      },
    };
    
    // Wrapper pour res.send
    res.send = function (data) {
      const duration = Date.now() - startTime;
      
      // Logger seulement les succès (2xx) et les erreurs client (4xx)
      if (res.statusCode >= 200 && res.statusCode < 500) {
        createLog({
          ...auditData,
          statusCode: res.statusCode,
          duration,
        }).catch(err => console.error('Erreur audit log (send):', err));
      }
      
      return originalSend.call(this, data);
    };
    
    // Wrapper pour res.json
    res.json = function (data) {
      const duration = Date.now() - startTime;
      
      if (res.statusCode >= 200 && res.statusCode < 500) {
        createLog({
          ...auditData,
          statusCode: res.statusCode,
          duration,
        }).catch(err => console.error('Erreur audit log (json):', err));
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware d'audit global pour toutes les requêtes
 * Utile pour avoir une vue d'ensemble de toute l'activité
 */
const globalAuditMiddleware = (excludePaths = []) => {
  return async (req, res, next) => {
    // Exclure certains chemins (health checks, static files, etc.)
    const shouldExclude = excludePaths.some(path => req.path.startsWith(path));
    if (shouldExclude) {
      return next();
    }
    
    const startTime = Date.now();
    
    // Attendre la fin de la réponse
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      
      // Ne logger que les requêtes authentifiées ou les tentatives d'auth
      const isAuthRoute = req.path.includes('/auth/');
      const isAuthenticated = !!req.user;
      
      if (isAuthenticated || isAuthRoute) {
        // Déterminer l'action basée sur la route et la méthode
        const action = determineAction(req);
        const resource = determineResource(req);
        
        await createLog({
          userId: req.user?.userId || null,
          action,
          resource,
          resourceId: extractResourceId(req),
          method: req.method,
          path: req.originalUrl,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'] || null,
          statusCode: res.statusCode,
          duration,
        }).catch(err => console.error('Erreur audit global:', err));
      }
    });
    
    next();
  };
};

/**
 * Déterminer l'action basée sur la route
 */
const determineAction = (req) => {
  const path = req.path.toLowerCase();
  const method = req.method;
  
  // Auth
  if (path.includes('/auth/login')) return 'AUTH_LOGIN_REQUEST';
  if (path.includes('/auth/verify')) return 'AUTH_VERIFY_CODE';
  if (path.includes('/auth/logout')) return 'AUTH_LOGOUT';
  if (path.includes('/auth/resend')) return 'AUTH_CODE_RESENT';
  if (path.includes('/auth/me')) return 'AUTH_GET_PROFILE';
  
  // Déterminer le préfixe basé sur la ressource
  let prefix = 'UNKNOWN';
  if (path.includes('/users')) prefix = 'USER';
  else if (path.includes('/elections')) prefix = 'ELECTION';
  else if (path.includes('/resultats-saisis') || path.includes('/results')) prefix = 'RESULT';
  else if (path.includes('/compilations')) prefix = 'COMPILATION';
  else if (path.includes('/partis')) prefix = 'PARTI';
  else if (path.includes('/centres')) prefix = 'CENTRE';
  else if (path.includes('/postes')) prefix = 'POSTE';
  else if (path.includes('/recap')) prefix = 'RECAP';
  else if (path.includes('/audit')) prefix = 'AUDIT';
  else if (path.includes('/admin')) prefix = 'ADMIN';
  else if (path.includes('/uploads')) prefix = 'FILE';
  
  // Actions spécifiques
  if (path.includes('/valider')) return `${prefix}_VALIDATED`;
  if (path.includes('/rejeter')) return `${prefix}_REJECTED`;
  if (path.includes('/statut')) return `${prefix}_STATUS_CHANGED`;
  
  // Actions CRUD basées sur la méthode
  switch (method) {
    case 'GET': return `${prefix}_VIEWED`;
    case 'POST': return `${prefix}_CREATED`;
    case 'PUT': return `${prefix}_UPDATED`;
    case 'PATCH': return `${prefix}_UPDATED`;
    case 'DELETE': return `${prefix}_DELETED`;
    default: return `${prefix}_${method}`;
  }
};

/**
 * Déterminer la ressource basée sur la route
 */
const determineResource = (req) => {
  const path = req.path.toLowerCase();
  
  if (path.includes('/users')) return 'User';
  if (path.includes('/elections')) return 'Election';
  if (path.includes('/resultats-saisis') || path.includes('/results')) return 'ResultSaisi';
  if (path.includes('/compilations')) return 'Compilation';
  if (path.includes('/partis')) return 'Parti';
  if (path.includes('/centres')) return 'CentreDeVote';
  if (path.includes('/postes')) return 'PosteDeVote';
  if (path.includes('/recap')) return 'RecapitulatifElectoral';
  if (path.includes('/auth')) return 'Auth';
  if (path.includes('/uploads')) return 'File';
  if (path.includes('/departements')) return 'Departement';
  if (path.includes('/communes')) return 'Commune';
  if (path.includes('/circonscriptions')) return 'Circonscription';
  if (path.includes('/arrondissements')) return 'Arrondissement';
  if (path.includes('/quartiers')) return 'Quartier';
  
  return null;
};

/**
 * Extraire l'ID de la ressource des paramètres
 */
const extractResourceId = (req) => {
  return req.params?.id || 
         req.params?.electionId || 
         req.params?.userId ||
         req.params?.centreId ||
         req.params?.posteId ||
         req.params?.compilationId ||
         null;
};

/**
 * Helper pour créer un log d'audit depuis un contrôleur
 * Utilisé pour les actions critiques nécessitant plus de détails
 */
const logFromController = async (req, action, resource, resourceId, extra = {}) => {
  await createLog({
    userId: req.user?.userId || null,
    action,
    resource,
    resourceId,
    method: req.method,
    path: req.originalUrl,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'] || null,
    ...extra,
  }).catch(err => console.error('Erreur audit contrôleur:', err));
};

module.exports = { 
  auditMiddleware, 
  globalAuditMiddleware,
  logFromController,
  determineAction,
  determineResource,
  extractResourceId,
};
