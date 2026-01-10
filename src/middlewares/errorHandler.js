const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
    console.error('[Error Handler]', err.stack);

    let statusCode = err.status || 500;
    let message = err.message || 'Une erreur serveur est survenue';
    let details = null;

    // Gestion des erreurs Prisma
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': // Contrainte d'unicité
                statusCode = 409;
                message = `Cette ressource existe déjà (conflit sur ${err.meta?.target})`;
                break;
            case 'P2025': // Enregistrement non trouvé
                statusCode = 404;
                message = 'La ressource demandée n\'a pas été trouvée';
                break;
            default:
                message = 'Erreur de base de données';
        }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = 'Données de requête invalides';
    }

    res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: message,
        details: details || (process.env.NODE_ENV === 'development' ? err.meta : undefined)
    });
};

module.exports = errorHandler;