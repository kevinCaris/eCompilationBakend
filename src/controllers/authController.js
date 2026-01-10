const authService = require('../services/authService');
const { success, error } = require('../utils/response');
const { createLog, getClientIp } = require('../services/auditService');
const { AUDIT_ACTIONS, RESOURCES } = require('../constants/auditActions');

const requestCode = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json(error('L\'email est requis', 400));
        }

        const result = await authService.requestLoginCode(email);
        
        // Log la demande de code
        await createLog({
            userId: result.userId || null,
            action: AUDIT_ACTIONS.AUTH.LOGIN_REQUEST,
            resource: RESOURCES.AUTH,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'],
            details: { email },
            statusCode: 200,
        });
        
        res.json(success(result, 'Code de vérification envoyé par email'));
    } catch (err) {
        // Log l'échec
        await createLog({
            userId: null,
            action: AUDIT_ACTIONS.AUTH.LOGIN_FAILED,
            resource: RESOURCES.AUTH,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'],
            details: { email: req.body?.email, error: err.message },
            statusCode: err.message === 'USER_NOT_FOUND' ? 404 : 500,
        });
        
        if (err.message === 'USER_NOT_FOUND') {
            return res.status(404).json(error('Aucun compte associé à cet email', 404));
        }
        if (err.message === 'EMAIL_SEND_FAILED') {
            return res.status(500).json(error('Erreur lors de l\'envoi de l\'email', 500));
        }
        if (err.message === 'ACCESS_DENIED') {
            return res.status(403).json(error('Ce type d\'utilisateur n\'a pas accès à la plateforme', 403));
        }
        next(err);
    }
};

const verifyCode = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json(error('Email et code sont requis', 400));
        }

        const result = await authService.verifyCodeAndLogin(email, code);
        
        // Log la connexion réussie
        await createLog({
            userId: result.user?.id || null,
            action: AUDIT_ACTIONS.AUTH.LOGIN_SUCCESS,
            resource: RESOURCES.AUTH,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'],
            details: { 
                email, 
                role: result.user?.role,
                firstName: result.user?.firstName,
                lastName: result.user?.lastName,
            },
            statusCode: 200,
        });
        
        res.json(success(result, 'Connexion réussie'));
    } catch (err) {
        // Log l'échec de vérification
        await createLog({
            userId: null,
            action: AUDIT_ACTIONS.AUTH.LOGIN_FAILED,
            resource: RESOURCES.AUTH,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'],
            details: { email: req.body?.email, error: err.message },
            statusCode: err.message === 'USER_NOT_FOUND' ? 404 : 400,
        });
        
        if (err.message === 'USER_NOT_FOUND') {
            return res.status(404).json(error('Aucun compte associé à cet email', 404));
        }
        if (err.message === 'INVALID_OR_EXPIRED_CODE') {
            return res.status(400).json(error('Code invalide ou expiré', 400));
        }
        next(err);
    }
};

const resendCode = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json(error('L\'email est requis', 400));
        }

        const result = await authService.resendCode(email);
        
        // Log le renvoi de code
        await createLog({
            userId: result.userId || null,
            action: AUDIT_ACTIONS.AUTH.CODE_RESENT,
            resource: RESOURCES.AUTH,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'],
            details: { email },
            statusCode: 200,
        });
        
        res.json(success(result, 'Nouveau code envoyé par email'));
    } catch (err) {
        if (err.message === 'USER_NOT_FOUND') {
            return res.status(404).json(error('Aucun compte associé à cet email', 404));
        }
        next(err);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await authService.getAuthenticatedUser(req.user.userId);
        res.json(success(user, 'Utilisateur récupéré'));
    } catch (err) {
        if (err.message === 'USER_NOT_FOUND') {
            return res.status(404).json(error('Utilisateur non trouvé', 404));
        }
        next(err);
    }
};

const logout = async (req, res) => {
    // Log la déconnexion
    await createLog({
        userId: req.user?.userId || null,
        action: AUDIT_ACTIONS.AUTH.LOGOUT,
        resource: RESOURCES.AUTH,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
        statusCode: 200,
    });
    
    res.json(success(null, 'Déconnexion réussie'));
};

module.exports = {
    requestCode,
    verifyCode,
    resendCode,
    getMe,
    logout
};
