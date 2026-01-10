const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateCreateUser = (req, res, next) => {
    const { email, role } = req.body;
    const errors = [];

    if (!email) errors.push('L\'email est requis');
    else if (!isValidEmail(email)) errors.push('Format d\'email invalide');

    if (!role) errors.push('Le rôle est requis');
    else if (!['SUPER_ADMIN', 'ADMIN', 'SA', 'AGENT'].includes(role)) {
        errors.push('Rôle invalide. Utilisez SUPER_ADMIN, ADMIN, SA ou AGENT');
    }

    if (role === 'SA' && !req.body.arrondissementId) {
        errors.push('L\'arrondissement est requis pour un SA');
    }
    if (role === 'AGENT' && !req.body.centreDeVoteId) {
        errors.push('Le centre de vote est requis pour un AGENT');
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Erreurs de validation', errors });
    }
    next();
};

const validateUpdateUser = (req, res, next) => {
    const { email, role } = req.body;
    const errors = [];

    if (email && !isValidEmail(email)) errors.push('Format d\'email invalide');
    if (role && !['SUPER_ADMIN', 'ADMIN', 'SA', 'AGENT'].includes(role)) {
        errors.push('Rôle invalide');
    }

    if (errors.length > 0) {
        return res.status(400).json({ status: 'error', code: 400, message: 'Erreurs de validation', errors });
    }
    next();
};

module.exports = { validateCreateUser, validateUpdateUser };