const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createCentreDeVote = async (data) => {
    if (!data.quartierId) {
        throw new Error('QUARTIER_REQUIRED');
    }
    if (!data.nom) {
        throw new Error('NOM_REQUIRED');
    }

    const quartier = await prisma.quartier.findUnique({
        where: { id: data.quartierId }
    });

    if (!quartier) {
        throw new Error('QUARTIER_NOT_FOUND');
    }

    const centreDeVote = await prisma.centreDeVote.create({
        data: {
            quartierId: data.quartierId,
            nom: data.nom,
            adresse: data.adresse || null,
            nombrePostes: data.nombrePostes || 0
        },
        include: {
            quartier: {
                include: {
                    arrondissement: true
                }
            }
        }
    });

    return centreDeVote;
};

const getAllCentresDeVote = async (filters = {}) => {
    const { quartierId, arrondissementId, electionId, limit = 100, offset = 0 } = filters;

    const where = {};
    if (quartierId) {
        where.quartierId = quartierId;
    }
    if (arrondissementId) {
        where.quartier = {
            arrondissementId: arrondissementId
        };
    }

    const centres = await prisma.centreDeVote.findMany({
        where,
        include: {
            quartier: {
                include: {
                    arrondissement: true
                }
            },
            postesDeVote: {
                include: {
                    resultSaisies: electionId ? {
                        where: { electionId }
                    } : true
                }
            },
            compilations: electionId ? {
                where: { electionId }
            } : true
        },
        skip: offset,
        take: limit,
        orderBy: { nom: 'asc' }
    });

    return centres;
};

const getCentreDeVoteById = async (id) => {
    if (!id) {
        throw new Error('CENTRE_ID_REQUIRED');
    }

    const centre = await prisma.centreDeVote.findUnique({
        where: { id },
        include: {
            quartier: {
                include: {
                    arrondissement: true
                }
            },
            postesDeVote: true
        }
    });

    if (!centre) {
        throw new Error('CENTRE_NOT_FOUND');
    }

    return centre;
};

const getCentresByQuartier = async (quartierId) => {
    if (!quartierId) {
        throw new Error('QUARTIER_ID_REQUIRED');
    }

    const quartier = await prisma.quartier.findUnique({
        where: { id: quartierId }
    });

    if (!quartier) {
        throw new Error('QUARTIER_NOT_FOUND');
    }

    const centres = await prisma.centreDeVote.findMany({
        where: { quartierId },
        include: {
            postesDeVote: true,
            quartier: {
                include: {
                    arrondissement: true
                }
            }
        },
        orderBy: { nom: 'asc' }
    });

    return centres;
};

const updateCentreDeVote = async (id, data) => {
    if (!id) {
        throw new Error('CENTRE_ID_REQUIRED');
    }

    const centre = await prisma.centreDeVote.findUnique({
        where: { id }
    });

    if (!centre) {
        throw new Error('CENTRE_NOT_FOUND');
    }

    if (data.quartierId && data.quartierId !== centre.quartierId) {
        const quartier = await prisma.quartier.findUnique({
            where: { id: data.quartierId }
        });
        if (!quartier) {
            throw new Error('QUARTIER_NOT_FOUND');
        }
    }

    const centreUpdated = await prisma.centreDeVote.update({
        where: { id },
        data: {
            nom: data.nom || undefined,
            adresse: data.adresse !== undefined ? data.adresse : undefined,
            nombrePostes: data.nombrePostes !== undefined ? data.nombrePostes : undefined,
            quartierId: data.quartierId || undefined
        },
        include: {
            quartier: {
                include: {
                    arrondissement: true
                }
            },
            postesDeVote: true
        }
    });

    return centreUpdated;
};

const deleteCentreDeVote = async (id) => {
    if (!id) {
        throw new Error('CENTRE_ID_REQUIRED');
    }

    const centre = await prisma.centreDeVote.findUnique({
        where: { id }
    });

    if (!centre) {
        throw new Error('CENTRE_NOT_FOUND');
    }

    await prisma.centreDeVote.delete({
        where: { id }
    });

    return { message: 'Centre de vote supprimé avec succès', id };
};

const getCentresStatistics = async () => {
    const totalCentres = await prisma.centreDeVote.count();

    const centresByQuartier = await prisma.quartier.findMany({
        select: {
            id: true,
            nom: true,
            _count: {
                select: { centresDeVote: true }
            }
        }
    });

    return {
        totalCentres,
        centresByQuartier
    };
};

module.exports = {
    createCentreDeVote,
    getAllCentresDeVote,
    getCentreDeVoteById,
    getCentresByQuartier,
    updateCentreDeVote,
    deleteCentreDeVote,
    getCentresStatistics
};
