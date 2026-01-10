const prisma = require('../config/database');

// DÉPARTEMENTS

const getAllDepartements = async () => {
    return await prisma.departement.findMany({
        orderBy: { nom: 'asc' },
        include: {
            _count: {
                select: { communes: true }
            }
        }
    });
};

const getDepartementById = async (id) => {
    return await prisma.departement.findUnique({
        where: { id },
        include: {
            communes: {
                orderBy: { nom: 'asc' }
            }
        }
    });
};

// COMMUNES

const getAllCommunes = async (departementId = null) => {
    const where = departementId ? { departementId } : {};
    return await prisma.commune.findMany({
        where,
        orderBy: { nom: 'asc' },
        include: {
            departement: {
                select: { id: true, code: true, nom: true }
            },
            _count: {
                select: { circonscriptions: true }
            }
        }
    });
};

const getCommuneById = async (id) => {
    return await prisma.commune.findUnique({
        where: { id },
        include: {
            departement: {
                select: { id: true, code: true, nom: true }
            },
            circonscriptions: {
                orderBy: { nom: 'asc' }
            }
        }
    });
};

// CIRCONSCRIPTIONS

const getAllCirconscriptions = async (communeId = null) => {
    const where = communeId ? { communeId } : {};
    return await prisma.circonscription.findMany({
        where,
        orderBy: { nom: 'asc' },
        include: {
            commune: {
                select: { id: true, code: true, nom: true }
            },
            _count: {
                select: { arrondissements: true }
            }
        }
    });
};

const getCirconscriptionById = async (id) => {
    return await prisma.circonscription.findUnique({
        where: { id },
        include: {
            commune: {
                select: { id: true, code: true, nom: true }
            },
            arrondissements: {
                orderBy: { nom: 'asc' }
            }
        }
    });
};

const getCirconscriptionsByCommune = async (communeId) => {
    return await prisma.circonscription.findMany({
        where: { communeId },
        orderBy: { nom: 'asc' },
        include: {
            _count: {
                select: { arrondissements: true }
            }
        }
    });
};

// ARRONDISSEMENTS

const getAllArrondissements = async (circonscriptionId = null) => {
    const where = circonscriptionId ? { circonscriptionId } : {};
    return await prisma.arrondissement.findMany({
        where,
        orderBy: { nom: 'asc' },
        include: {
            circonscription: {
                select: {
                    id: true,
                    code: true,
                    nom: true,
                    commune: {
                        select: { id: true, code: true, nom: true }
                    }
                }
            },
            _count: {
                select: { quartiers: true }
            }
        }
    });
};

const getArrondissementById = async (id) => {
    return await prisma.arrondissement.findUnique({
        where: { id },
        include: {
            circonscription: {
                select: {
                    id: true,
                    code: true,
                    nom: true
                }
            },
            quartiers: {
                orderBy: { nom: 'asc' }
            }
        }
    });
};

const getArrondissementsByCirconscription = async (circonscriptionId) => {
    return await prisma.arrondissement.findMany({
        where: { circonscriptionId },
        orderBy: { nom: 'asc' },
        include: {
            _count: {
                select: { quartiers: true }
            }
        }
    });
};


const getAllQuartiers = async (arrondissementId = null) => {
    const where = arrondissementId ? { arrondissementId } : {};
    return await prisma.quartier.findMany({
        where,
        orderBy: { nom: 'asc' },
        include: {
            arrondissement: {
                select: { id: true, code: true, nom: true }
            },
            _count: {
                select: { centresDeVote: true }
            }
        }
    });
};

const getQuartierById = async (id) => {
    return await prisma.quartier.findUnique({
        where: { id },
        include: {
            arrondissement: {
                select: { id: true, code: true, nom: true }
            },
            centresDeVote: {
                orderBy: { nom: 'asc' }
            }
        }
    });
};

const getQuartiersByArrondissement = async (arrondissementId) => {
    return await prisma.quartier.findMany({
        where: { arrondissementId },
        orderBy: { nom: 'asc' }
    });
};

// ============================================
// STATISTIQUES GÉOGRAPHIQUES
// ============================================

const getStatistiquesGeographiques = async () => {
    const [departements, communes, circonscriptions, arrondissements, quartiers] = await Promise.all([
        prisma.departement.count(),
        prisma.commune.count(),
        prisma.circonscription.count(),
        prisma.arrondissement.count(),
        prisma.quartier.count()
    ]);

    return {
        departements,
        communes,
        circonscriptions,
        arrondissements,
        quartiers
    };
};

module.exports = {
    // Départements
    getAllDepartements,
    getDepartementById,
    // Communes
    getAllCommunes,
    getCommuneById,
    // Circonscriptions
    getAllCirconscriptions,
    getCirconscriptionById,
    getCirconscriptionsByCommune,
    // Arrondissements
    getAllArrondissements,
    getArrondissementById,
    getArrondissementsByCirconscription,
    // Quartiers
    getAllQuartiers,
    getQuartierById,
    getQuartiersByArrondissement,
    // Stats
    getStatistiquesGeographiques
};
