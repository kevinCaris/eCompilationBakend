const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE - Ajouter voix pour un parti à un résultat saisi
const addVoixParti = async (resultSaisiId, partiId, voix) => {
    if (!resultSaisiId) throw new Error('RESULT_SAISI_ID_REQUIRED');
    if (!partiId) throw new Error('PARTI_ID_REQUIRED');
    if (voix === undefined || voix === null) throw new Error('VOIX_REQUIRED');
    if (voix < 0) throw new Error('VOIX_MUST_BE_POSITIVE');

    // Vérifier que le résultat existe
    const resultSaisi = await prisma.resultSaisi.findUnique({ where: { id: resultSaisiId } });
    if (!resultSaisi) throw new Error('RESULT_SAISI_NOT_FOUND');

    // Vérifier que le parti existe et appartient à la même élection
    const parti = await prisma.parti.findUnique({ where: { id: partiId } });
    if (!parti) throw new Error('PARTI_NOT_FOUND');
    if (parti.electionId !== resultSaisi.electionId) throw new Error('PARTI_NOT_IN_ELECTION');

    // Vérifier s'il existe déjà
    const existing = await prisma.resultatParti.findUnique({
        where: { resultSaisiId_partiId: { resultSaisiId, partiId } }
    });
    if (existing) throw new Error('VOIX_ALREADY_EXISTS');

    const resultatParti = await prisma.resultatParti.create({
        data: {
            resultSaisiId,
            partiId,
            voix: parseInt(voix) || 0
        },
        include: {
            parti: true,
            resultSaisi: true
        }
    });

    return resultatParti;
};

// GET ALL - Lister tous les partis d'un résultat saisi
const getAllVoixPartis = async (resultSaisiId) => {
    if (!resultSaisiId) throw new Error('RESULT_SAISI_ID_REQUIRED');

    const resultSaisi = await prisma.resultSaisi.findUnique({ where: { id: resultSaisiId } });
    if (!resultSaisi) throw new Error('RESULT_SAISI_NOT_FOUND');

    const resultatsPartis = await prisma.resultatParti.findMany({
        where: { resultSaisiId },
        include: {
            parti: {
                select: {
                    id: true,
                    nom: true,
                    sigle: true,
                    logo: true,
                    electionId: true
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    return resultatsPartis;
};

// GET BY ID - Récupérer voix d'un parti spécifique
const getVoixParti = async (resultSaisiId, partiId) => {
    if (!resultSaisiId) throw new Error('RESULT_SAISI_ID_REQUIRED');
    if (!partiId) throw new Error('PARTI_ID_REQUIRED');

    const resultSaisi = await prisma.resultSaisi.findUnique({ where: { id: resultSaisiId } });
    if (!resultSaisi) throw new Error('RESULT_SAISI_NOT_FOUND');

    const resultatParti = await prisma.resultatParti.findUnique({
        where: { resultSaisiId_partiId: { resultSaisiId, partiId } },
        include: {
            parti: {
                select: {
                    id: true,
                    nom: true,
                    sigle: true,
                    logo: true
                }
            }
        }
    });

    if (!resultatParti) throw new Error('VOIX_NOT_FOUND');
    return resultatParti;
};

// UPDATE - Modifier voix d'un parti
const updateVoixParti = async (resultSaisiId, partiId, newVoix) => {
    if (!resultSaisiId) throw new Error('RESULT_SAISI_ID_REQUIRED');
    if (!partiId) throw new Error('PARTI_ID_REQUIRED');
    if (newVoix === undefined || newVoix === null) throw new Error('VOIX_REQUIRED');
    if (newVoix < 0) throw new Error('VOIX_MUST_BE_POSITIVE');

    const resultSaisi = await prisma.resultSaisi.findUnique({ where: { id: resultSaisiId } });
    if (!resultSaisi) throw new Error('RESULT_SAISI_NOT_FOUND');

    // Vérifier que le résultat n'est pas validé
    if (resultSaisi.status === 'VALIDEE') throw new Error('RESULT_SAISI_ALREADY_VALIDATED');

    const resultatParti = await prisma.resultatParti.findUnique({
        where: { resultSaisiId_partiId: { resultSaisiId, partiId } }
    });
    if (!resultatParti) throw new Error('VOIX_NOT_FOUND');

    const updated = await prisma.resultatParti.update({
        where: { id: resultatParti.id },
        data: { voix: parseInt(newVoix) || 0 },
        include: {
            parti: {
                select: {
                    id: true,
                    nom: true,
                    sigle: true,
                    logo: true
                }
            }
        }
    });

    return updated;
};

// DELETE - Supprimer voix d'un parti
const deleteVoixParti = async (resultSaisiId, partiId) => {
    if (!resultSaisiId) throw new Error('RESULT_SAISI_ID_REQUIRED');
    if (!partiId) throw new Error('PARTI_ID_REQUIRED');

    const resultSaisi = await prisma.resultSaisi.findUnique({ where: { id: resultSaisiId } });
    if (!resultSaisi) throw new Error('RESULT_SAISI_NOT_FOUND');

    // Vérifier que le résultat n'est pas validé
    if (resultSaisi.status === 'VALIDEE') throw new Error('RESULT_SAISI_ALREADY_VALIDATED');

    const resultatParti = await prisma.resultatParti.findUnique({
        where: { resultSaisiId_partiId: { resultSaisiId, partiId } }
    });
    if (!resultatParti) throw new Error('VOIX_NOT_FOUND');

    await prisma.resultatParti.delete({
        where: { id: resultatParti.id }
    });

    return { message: 'Voix supprimée avec succès', resultSaisiId, partiId };
};

// GET SUMMARY - Résumé des voix pour un résultat
const getSummaryVoixPartis = async (resultSaisiId) => {
    if (!resultSaisiId) throw new Error('RESULT_SAISI_ID_REQUIRED');

    const resultSaisi = await prisma.resultSaisi.findUnique({ where: { id: resultSaisiId } });
    if (!resultSaisi) throw new Error('RESULT_SAISI_NOT_FOUND');

    const resultatsPartis = await prisma.resultatParti.findMany({
        where: { resultSaisiId },
        include: { parti: true }
    });

    const totalVoix = resultatsPartis.reduce((sum, rp) => sum + rp.voix, 0);

    const summary = {
        resultSaisiId,
        nombrePartis: resultatsPartis.length,
        totalVoix,
        resultatsPartis: resultatsPartis.map(rp => ({
            partiId: rp.partiId,
            partiNom: rp.parti.nom,
            partiSigle: rp.parti.sigle,
            voix: rp.voix,
            pourcentage: totalVoix > 0 ? ((rp.voix / totalVoix) * 100).toFixed(2) : 0
        }))
    };

    return summary;
};

module.exports = {
    addVoixParti,
    getAllVoixPartis,
    getVoixParti,
    updateVoixParti,
    deleteVoixParti,
    getSummaryVoixPartis
};
