const prisma = require('../config/database');

const createPostesForCentre = async (centreDeVoteId, nombrePostes) => {
    if (!centreDeVoteId) throw new Error('CENTRE_REQUIRED');
    if (!nombrePostes || nombrePostes < 1) throw new Error('NOMBRE_POSTES_INVALID');

    const centre = await prisma.centreDeVote.findUnique({
        where: { id: centreDeVoteId }
    });
    if (!centre) throw new Error('CENTRE_NOT_FOUND');

    const postes = [];
    for (let i = 1; i <= nombrePostes; i++) {
        postes.push({
            centreDeVoteId,
            numero: i,
            libelle: `PV${i}`
        });
    }

    const created = await prisma.posteDeVote.createMany({
        data: postes,
        skipDuplicates: true 
    });

    return {
        count: created.count,
        message: `${created.count} poste(s) créé(s) pour le centre`
    };
};

const getPostesByCentre = async (centreDeVoteId) => {
    if (!centreDeVoteId) throw new Error('CENTRE_REQUIRED');

    const postes = await prisma.posteDeVote.findMany({
        where: { centreDeVoteId },
        orderBy: { numero: 'asc' },
        include: {
            centreDeVote: {
                select: {
                    id: true,
                    nom: true,
                    quartier: {
                        select: { nom: true, code: true }
                    }
                }
            }
        }
    });

    if (postes.length === 0) throw new Error('POSTES_NOT_FOUND');
    return postes;
};

const getPosteById = async (posteId) => {
    if (!posteId) throw new Error('POSTE_ID_REQUIRED');

    const poste = await prisma.posteDeVote.findUnique({
        where: { id: posteId },
        include: {
            centreDeVote: {
                select: {
                    id: true,
                    nom: true,
                    quartier: true
                }
            }
        }
    });

    if (!poste) throw new Error('POSTE_NOT_FOUND');
    return poste;
};

const updatePoste = async (posteId, updateData) => {
    if (!posteId) throw new Error('POSTE_ID_REQUIRED');

    const existingPoste = await prisma.posteDeVote.findUnique({
        where: { id: posteId }
    });

    if (!existingPoste) throw new Error('POSTE_NOT_FOUND');

    return await prisma.posteDeVote.update({
        where: { id: posteId },
        data: {
            ...(updateData.libelle && { libelle: updateData.libelle }),
            ...(updateData.numero && { numero: updateData.numero })
        },
        include: { centreDeVote: true }
    });
};

const deletePoste = async (posteId) => {
    if (!posteId) throw new Error('POSTE_ID_REQUIRED');

    const existingPoste = await prisma.posteDeVote.findUnique({
        where: { id: posteId }
    });

    if (!existingPoste) throw new Error('POSTE_NOT_FOUND');

    await prisma.posteDeVote.delete({
        where: { id: posteId }
    });

    return { message: 'Poste de vote supprimé avec succès' };
};

const deletePostesByCentre = async (centreDeVoteId) => {
    if (!centreDeVoteId) throw new Error('CENTRE_REQUIRED');

    const result = await prisma.posteDeVote.deleteMany({
        where: { centreDeVoteId }
    });

    if (result.count === 0) throw new Error('POSTES_NOT_FOUND');

    return {
        count: result.count,
        message: `${result.count} poste(s) supprimé(s)`
    };
};

module.exports = {
    createPostesForCentre,
    getPostesByCentre,
    getPosteById,
    updatePoste,
    deletePoste,
    deletePostesByCentre
};
