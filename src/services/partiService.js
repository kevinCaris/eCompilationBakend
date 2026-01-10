const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

const createParti = async (data) => {
    if (!data.electionId) {
        throw new Error('ELECTION_ID_REQUIRED');
    }
    if (!data.nom) {
        throw new Error('NOM_REQUIRED');
    }

    const election = await prisma.election.findUnique({
        where: { id: data.electionId }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    const parti = await prisma.parti.create({
        data: {
            electionId: data.electionId,
            nom: data.nom,
            sigle: data.sigle || null
        },
        include: {
            election: true
        }
    });

    return parti;
};

const getAllPartis = async (filters = {}) => {
    const { electionId, limit = 100, offset = 0 } = filters;

    const where = {};
    if (electionId) {
        where.electionId = electionId;
    }

    const partis = await prisma.parti.findMany({
        where,
        include: {
            election: true,
            _count: {
                select: {
                    voixResultats: true
                }
            }
        },
        skip: offset,
        take: limit,
        orderBy: { nom: 'asc' }
    });

    return partis;
};

const getPartiById = async (id) => {
    if (!id) {
        throw new Error('PARTI_ID_REQUIRED');
    }

    const parti = await prisma.parti.findUnique({
        where: { id },
        include: {
            election: true,
            voixResultats: {
                include: {
                    resultSaisi: true
                }
            }
        }
    });

    if (!parti) {
        throw new Error('PARTI_NOT_FOUND');
    }

    return parti;
};

const getPartisByElection = async (electionId) => {
    if (!electionId) {
        throw new Error('ELECTION_ID_REQUIRED');
    }

    const election = await prisma.election.findUnique({
        where: { id: electionId }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    const partis = await prisma.parti.findMany({
        where: { electionId },
        include: {
            _count: {
                select: {
                    voixResultats: true
                }
            }
        },
        orderBy: { nom: 'asc' }
    });

    return partis;
};

const updateParti = async (id, data) => {
    if (!id) {
        throw new Error('PARTI_ID_REQUIRED');
    }

    const parti = await prisma.parti.findUnique({
        where: { id }
    });

    if (!parti) {
        throw new Error('PARTI_NOT_FOUND');
    }

    const partiUpdated = await prisma.parti.update({
        where: { id },
        data: {
            nom: data.nom || undefined,
            sigle: data.sigle !== undefined ? data.sigle : undefined
        },
        include: {
            election: true
        }
    });

    return partiUpdated;
};

const deleteParti = async (id) => {
    if (!id) {
        throw new Error('PARTI_ID_REQUIRED');
    }

    const parti = await prisma.parti.findUnique({
        where: { id }
    });

    if (!parti) {
        throw new Error('PARTI_NOT_FOUND');
    }

    await prisma.parti.delete({
        where: { id }
    });

    return { message: 'Parti supprimé avec succès', id };
};

const saveLogo = async (partiId, file) => {
    if (!file) {
        throw new Error('NO_FILE_PROVIDED');
    }

    const parti = await prisma.parti.findUnique({
        where: { id: partiId }
    });

    if (!parti) {
        // Supprimer l'image uploadée sur Cloudinary si le parti n'existe pas
        if (file.filename) {
            try {
                await deleteImage(file.filename);
            } catch (e) {
                console.error('Erreur suppression Cloudinary:', e);
            }
        }
        throw new Error('PARTI_NOT_FOUND');
    }

    // Supprimer l'ancien logo de Cloudinary s'il existe
    if (parti.logo) {
        const oldPublicId = getPublicIdFromUrl(parti.logo);
        if (oldPublicId) {
            try {
                await deleteImage(oldPublicId);
            } catch (e) {
                console.error('Erreur suppression ancien logo:', e);
            }
        }
    }

    // file.path contient l'URL Cloudinary complète
    const logoUrl = file.path;

    const updatedParti = await prisma.parti.update({
        where: { id: partiId },
        data: { logo: logoUrl },
        include: {
            election: true
        }
    });

    return updatedParti;
};

const deleteLogo = async (partiId) => {
    const parti = await prisma.parti.findUnique({
        where: { id: partiId }
    });

    if (!parti) {
        throw new Error('PARTI_NOT_FOUND');
    }

    // Supprimer le logo de Cloudinary s'il existe
    if (parti.logo) {
        const publicId = getPublicIdFromUrl(parti.logo);
        if (publicId) {
            try {
                await deleteImage(publicId);
            } catch (e) {
                console.error('Erreur suppression logo Cloudinary:', e);
            }
        }
    }

    const updatedParti = await prisma.parti.update({
        where: { id: partiId },
        data: { logo: null },
        include: {
            election: true
        }
    });

    return updatedParti;
};

module.exports = {
    createParti,
    getAllPartis,
    getPartiById,
    getPartisByElection,
    updateParti,
    deleteParti,
    saveLogo,
    deleteLogo
};
