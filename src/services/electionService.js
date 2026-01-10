const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createElection = async (data) => {
    try {
        if (!data.type) {
            throw new Error('TYPE_REQUIRED');
        }
        if (!data.dateVote) {
            throw new Error('DATE_VOTE_REQUIRED');
        }
        if (!data.createdBy) {
            throw new Error('CREATED_BY_REQUIRED');
        }

        const user = await prisma.user.findUnique({
            where: { id: data.createdBy }
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        const election = await prisma.election.create({
            data: {
                type: data.type,
                dateVote: new Date(data.dateVote),
                createdBy: data.createdBy,
                statut: 'PLANIFIEE' // Toujours PLANIFIEE à la création
            },
            include: {
                partis: true
            }
        });

        return election;

    } catch (err) {
        // Contrainte unique (type, dateVote)
        if (err.code === 'P2002') {
            throw new Error('ELECTION_ALREADY_EXISTS');
        }
        throw err;
    }
};

const validateStatusTransition = (currentStatus, newStatus) => {
    if (currentStatus === newStatus) return true;

    const transitions = {
        'PLANIFIEE': ['EN_COURS', 'ARCHIVEE'], // On peut lancer ou annuler/archiver
        'EN_COURS': ['FERMEE'], // On ne peut que fermer
        'FERMEE': ['ARCHIVEE', 'EN_COURS'], // On peut archiver ou réouvrir (cas exceptionnel)
        'ARCHIVEE': [] // État final
    };

    return transitions[currentStatus]?.includes(newStatus);
};

const getAllElections = async (filters = {}) => {
    const { type, limit = 100, offset = 0 } = filters;

    const where = {};
    if (type) {
        where.type = type;
    }

    const elections = await prisma.election.findMany({
        where,
        include: {
            partis: true,
            _count: {
                select: {
                    resultSaisies: true,
                    compilations: true
                }
            }
        },
        skip: offset,
        take: limit,
        orderBy: { dateVote: 'desc' }
    });

    return elections;
};


const getElectionById = async (id) => {
    if (!id) {
        throw new Error('ELECTION_ID_REQUIRED');
    }

    const election = await prisma.election.findUnique({
        where: { id },
        include: {
            partis: true,
            resultSaisies: {
                include: {
                    resultPartis: true
                }
            },
            compilations: true,
            _count: {
                select: {
                    resultSaisies: true,
                    compilations: true
                }
            }
        }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    return election;
};


const updateElection = async (id, data) => {
    if (!id) {
        throw new Error('ELECTION_ID_REQUIRED');
    }

    const election = await prisma.election.findUnique({
        where: { id }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    // Restriction: Une élection EN_COURS ne peut pas être modifiée sauf pour le statut
    if (election.statut === 'EN_COURS') {
        // On vérifie si les champs sensibles sont modifiés
        if (data.type && data.type !== election.type) {
            throw new Error('ELECTION_ACTIVE_NO_MODIFICATION');
        }
        if (data.dateVote) {
            const newDate = new Date(data.dateVote);
            if (newDate.getTime() !== election.dateVote.getTime()) {
                throw new Error('ELECTION_ACTIVE_NO_MODIFICATION');
            }
        }
    }

    // Validation de la transition de statut si le statut change
    if (data.statut && data.statut !== election.statut) {
        if (!validateStatusTransition(election.statut, data.statut)) {
            throw new Error(`INVALID_STATUS_TRANSITION:${election.statut}->${data.statut}`);
        }
    }

    const electionUpdated = await prisma.election.update({
        where: { id },
        data: {
            type: data.type || undefined,
            dateVote: data.dateVote ? new Date(data.dateVote) : undefined,
            statut: data.statut || undefined
        },
        include: {
            partis: true
        }
    });

    return electionUpdated;
};

const updateStatut = async (id, statut) => {
    if (!id) {
        throw new Error('ELECTION_ID_REQUIRED');
    }
    if (!statut) {
        throw new Error('STATUT_REQUIRED');
    }

    const validStatuts = ['PLANIFIEE', 'EN_COURS', 'FERMEE', 'ARCHIVEE'];
    if (!validStatuts.includes(statut)) {
        throw new Error('INVALID_STATUT');
    }

    const election = await prisma.election.findUnique({
        where: { id }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    if (!validateStatusTransition(election.statut, statut)) {
        throw new Error(`INVALID_STATUS_TRANSITION:${election.statut}->${statut}`);
    }

    const electionUpdated = await prisma.election.update({
        where: { id },
        data: { statut },
        include: {
            partis: true,
            _count: {
                select: {
                    resultSaisies: true,
                    compilations: true
                }
            }
        }
    });

    return electionUpdated;
};

const deleteElection = async (id) => {
    if (!id) {
        throw new Error('ELECTION_ID_REQUIRED');
    }

    const election = await prisma.election.findUnique({
        where: { id }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    if (election.statut === 'EN_COURS') {
        throw new Error('ELECTION_ACTIVE_NO_DELETION');
    }

    await prisma.election.delete({
        where: { id }
    });

    return { message: 'Élection supprimée avec succès', id };
};

module.exports = {
    createElection,
    getAllElections,
    getElectionById,
    updateElection,
    updateStatut,
    deleteElection
};
