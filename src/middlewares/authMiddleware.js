const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise';

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json(error('Token manquant', 401));
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json(error('Token expiré', 401));
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json(error('Token invalide', 401));
        }
        return res.status(401).json(error('Authentification échouée', 401));
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(error('Non authentifié', 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json(error('Accès non autorisé', 403));
        }

        next();
    };
};

const adminOnly = authorize('SUPER_ADMIN', 'ADMIN');

const superAdminOnly = authorize('SUPER_ADMIN');

module.exports = {
    authenticate,
    authorize,
    adminOnly,
    superAdminOnly
};