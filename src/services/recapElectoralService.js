const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============ CREATE ============
const createRecapitulatifElectoral = async (data) => {
    if (!data.electionId) {
        throw new Error('ELECTION_ID_REQUIRED');
    }
    if (!data.saId) {
        throw new Error('SA_ID_REQUIRED');
    }
    if (data.nombreElecteurs === undefined) {
        throw new Error('NOMBRE_ELECTEURS_REQUIRED');
    }
    if (data.nombreCentresDeVote === undefined) {
        throw new Error('NOMBRE_CENTRES_DE_VOTE_REQUIRED');
    }
    if (data.nombrePostesDeVote === undefined) {
        throw new Error('NOMBRE_POSTES_DE_VOTE_REQUIRED');
    }

    // Vérifier que l'élection existe
    const election = await prisma.election.findUnique({
        where: { id: data.electionId }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    // Vérifier que l'utilisateur SA existe et a le rôle SA
    const sa = await prisma.user.findUnique({
        where: { id: data.saId }
    });

    if (!sa) {
        throw new Error('SA_NOT_FOUND');
    }

    if (sa.role !== 'SA') {
        throw new Error('USER_NOT_SA');
    }

    // Vérifier l'unicité (une seule combinaison par election et SA)
    const existingForElection = await prisma.recapitulatifElectoral.findUnique({
        where: {
            electionId_saId: {
                electionId: data.electionId,
                saId: data.saId
            }
        }
    });

    if (existingForElection) {
        throw new Error('RECAP_ALREADY_EXISTS');
    }

    // ========== RÈGLE MÉTIER : Un SA ne peut avoir qu'un seul récap par année ==========
    // Extraire l'année de l'élection cible (basée sur dateVote)
    const electionYear = new Date(election.dateVote).getFullYear();
    
    // Chercher si le SA a déjà un récap pour une élection de la même année
    const existingForSameYear = await prisma.recapitulatifElectoral.findFirst({
        where: {
            saId: data.saId,
            election: {
                dateVote: {
                    gte: new Date(`${electionYear}-01-01T00:00:00.000Z`),
                    lt: new Date(`${electionYear + 1}-01-01T00:00:00.000Z`)
                }
            }
        },
        include: {
            election: {
                select: {
                    id: true,
                    type: true,
                    dateVote: true
                }
            }
        }
    });

    if (existingForSameYear) {
        // Un récap existe déjà pour ce SA pour une élection de la même année
        const error = new Error('RECAP_ALREADY_EXISTS_SAME_YEAR');
        error.existingRecap = existingForSameYear;
        error.year = electionYear;
        throw error;
    }

    const recap = await prisma.recapitulatifElectoral.create({
        data: {
            electionId: data.electionId,
            saId: data.saId,
            nombreElecteurs: parseInt(data.nombreElecteurs),
            nombreCentresDeVote: parseInt(data.nombreCentresDeVote),
            nombrePostesDeVote: parseInt(data.nombrePostesDeVote),
            raisonModification: data.raisonModification || null
        },
        include: {
            election: true,
            sa: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true
                }
            }
        }
    });

    return recap;
};

// ============ READ ALL ============
const getAllRecapitulatifsElectoraux = async (filters = {}) => {
    const {
        electionId,
        saId,
        limit = 100,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = filters;

    const where = {};

    if (electionId) {
        where.electionId = electionId;
    }

    if (saId) {
        where.saId = saId;
    }

    const recaps = await prisma.recapitulatifElectoral.findMany({
        where,
        include: {
            election: {
                select: {
                    id: true,
                    type: true,
                    dateVote: true
                }
            },
            sa: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true
                }
            }
        },
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: {
            [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc'
        }
    });

    const total = await prisma.recapitulatifElectoral.count({ where });

    return {
        data: recaps,
        pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total
        }
    };
};

// ============ READ BY ID ============
const getRecapitulatifElectoralById = async (id) => {
    if (!id) {
        throw new Error('RECAP_ID_REQUIRED');
    }

    const recap = await prisma.recapitulatifElectoral.findUnique({
        where: { id },
        include: {
            election: {
                select: {
                    id: true,
                    type: true,
                    dateVote: true
                }
            },
            sa: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true
                }
            }
        }
    });

    if (!recap) {
        throw new Error('RECAP_NOT_FOUND');
    }

    return recap;
};

// ============ UPDATE ============
const updateRecapitulatifElectoral = async (id, data) => {
    if (!id) {
        throw new Error('RECAP_ID_REQUIRED');
    }

    // Vérifier que le récapitulatif existe
    const recap = await prisma.recapitulatifElectoral.findUnique({
        where: { id }
    });

    if (!recap) {
        throw new Error('RECAP_NOT_FOUND');
    }

    // Construire l'objet de mise à jour
    const updateData = {};

    if (data.nombreElecteurs !== undefined) {
        updateData.nombreElecteurs = parseInt(data.nombreElecteurs);
    }

    if (data.nombreCentresDeVote !== undefined) {
        updateData.nombreCentresDeVote = parseInt(data.nombreCentresDeVote);
    }

    if (data.nombrePostesDeVote !== undefined) {
        updateData.nombrePostesDeVote = parseInt(data.nombrePostesDeVote);
    }

    if (data.raisonModification !== undefined) {
        updateData.raisonModification = data.raisonModification;
    }

    // Ajouter la date de modification si des modifications sont effectuées
    if (Object.keys(updateData).length > 0) {
        updateData.dateModification = new Date();
    }

    const updated = await prisma.recapitulatifElectoral.update({
        where: { id },
        data: updateData,
        include: {
            election: {
                select: {
                    id: true,
                    type: true,
                    dateVote: true
                }
            },
            sa: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true
                }
            }
        }
    });

    return updated;
};

// ============ DELETE ============
const deleteRecapitulatifElectoral = async (id) => {
    if (!id) {
        throw new Error('RECAP_ID_REQUIRED');
    }

    const recap = await prisma.recapitulatifElectoral.findUnique({
        where: { id }
    });

    if (!recap) {
        throw new Error('RECAP_NOT_FOUND');
    }

    await prisma.recapitulatifElectoral.delete({
        where: { id }
    });

    return { message: 'Récapitulatif électoral supprimé avec succès', id };
};

// ============ GET BY ELECTION ============
const getRecapitulatifsElectorauxByElection = async (electionId, limit = 100, offset = 0) => {
    if (!electionId) {
        throw new Error('ELECTION_ID_REQUIRED');
    }

    // Vérifier que l'élection existe
    const election = await prisma.election.findUnique({
        where: { id: electionId }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    const recaps = await prisma.recapitulatifElectoral.findMany({
        where: { electionId },
        include: {
            election: {
                select: {
                    id: true,
                    type: true,
                    dateVote: true
                }
            },
            sa: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true
                }
            }
        },
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.recapitulatifElectoral.count({ where: { electionId } });

    return {
        data: recaps,
        pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total
        }
    };
};

// ============ GET BY SA ============
const getRecapitulatifsElectorauxBySA = async (saId, limit = 100, offset = 0) => {
    if (!saId) {
        throw new Error('SA_ID_REQUIRED');
    }

    // Vérifier que l'utilisateur SA existe
    const sa = await prisma.user.findUnique({
        where: { id: saId }
    });

    if (!sa) {
        throw new Error('SA_NOT_FOUND');
    }

    const recaps = await prisma.recapitulatifElectoral.findMany({
        where: { saId },
        include: {
            election: {
                select: {
                    id: true,
                    type: true,
                    dateVote: true
                }
            },
            sa: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true
                }
            }
        },
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.recapitulatifElectoral.count({ where: { saId } });

    return {
        data: recaps,
        pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total
        }
    };
};

// ============ COUNT ============
const countRecapitulatifs = async (filters = {}) => {
    const where = {};

    if (filters.electionId) {
        where.electionId = filters.electionId;
    }

    if (filters.saId) {
        where.saId = filters.saId;
    }

    const count = await prisma.recapitulatifElectoral.count({ where });
    return count;
};

// ============ RAPPORT HIERARCHIQUE PAR CIRCONSCRIPTION ============
const getRapportHierarchiqueByElection = async (electionId) => {
    if (!electionId) {
        throw new Error('ELECTION_ID_REQUIRED');
    }

    const election = await prisma.election.findUnique({
        where: { id: electionId }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    const recaps = await prisma.recapitulatifElectoral.findMany({
        where: { electionId },
        include: {
            election: {
                select: {
                    id: true,
                    type: true,
                    dateVote: true
                }
            },
            sa: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    arrondissement: {
                        include: {
                            circonscription: {
                                include: {
                                    commune: {
                                        include: {
                                            departement: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const rapportStructure = {};

    recaps.forEach(recap => {
        if (!recap.sa.arrondissement) return;

        const arrondissement = recap.sa.arrondissement;
        const circonscription = arrondissement.circonscription;
        const commune = circonscription.commune;
        const departement = commune.departement;

        const circonscriptionKey = circonscription.id;

        if (!rapportStructure[circonscriptionKey]) {
            rapportStructure[circonscriptionKey] = {
                circonscription: {
                    id: circonscription.id,
                    code: circonscription.code,
                    nom: circonscription.nom,
                    commune: {
                        id: commune.id,
                        nom: commune.nom,
                        code: commune.code
                    },
                    departement: {
                        id: departement.id,
                        nom: departement.nom,
                        code: departement.code
                    }
                },
                arrondissements: {}
            };
        }

        const arrondissementKey = arrondissement.id;

        if (!rapportStructure[circonscriptionKey].arrondissements[arrondissementKey]) {
            rapportStructure[circonscriptionKey].arrondissements[arrondissementKey] = {
                arrondissement: {
                    id: arrondissement.id,
                    code: arrondissement.code,
                    nom: arrondissement.nom,
                    population: arrondissement.population
                },
                recapitulatifs: []
            };
        }

        rapportStructure[circonscriptionKey].arrondissements[arrondissementKey].recapitulatifs.push({
            id: recap.id,
            electionId: recap.electionId,
            saId: recap.saId,
            sa: {
                id: recap.sa.id,
                email: recap.sa.email,
                firstName: recap.sa.firstName,
                lastName: recap.sa.lastName
            },
            nombreElecteurs: recap.nombreElecteurs,
            nombreCentresDeVote: recap.nombreCentresDeVote,
            nombrePostesDeVote: recap.nombrePostesDeVote,
            raisonModification: recap.raisonModification,
            dateSaisie: recap.dateSaisie,
            dateModification: recap.dateModification,
            createdAt: recap.createdAt,
            updatedAt: recap.updatedAt
        });
    });

    const rapportArray = Object.values(rapportStructure).map(circ => ({
        ...circ,
        arrondissements: Object.values(circ.arrondissements)
    }));

    return {
        election: {
            id: election.id,
            type: election.type,
            dateVote: election.dateVote
        },
        circonscriptions: rapportArray
    };
};

// ============ TABLEAU MATRICIEL ============
const getTableauMatriciel = async (electionId, communeId) => {
    if (!electionId) {
        throw new Error('ELECTION_ID_REQUIRED');
    }

    if (!communeId) {
        throw new Error('COMMUNE_ID_REQUIRED');
    }

    const election = await prisma.election.findUnique({
        where: { id: electionId }
    });

    if (!election) {
        throw new Error('ELECTION_NOT_FOUND');
    }

    const commune = await prisma.commune.findUnique({
        where: { id: communeId }
    });

    if (!commune) {
        throw new Error('COMMUNE_NOT_FOUND');
    }

    const recaps = await prisma.recapitulatifElectoral.findMany({
        where: { electionId },
        include: {
            sa: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    arrondissement: {
                        include: {
                            circonscription: {
                                include: {
                                    commune: {
                                        include: {
                                            departement: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // Récupérer TOUTES les circonscriptions de la commune et leurs arrondissements
    const toutesLesCirconscriptions = await prisma.circonscription.findMany({
        where: {
            communeId: communeId
        },
        include: {
            arrondissements: {
                orderBy: {
                    code: 'asc'
                }
            },
            commune: {
                include: {
                    departement: true
                }
            }
        },
        orderBy: {
            code: 'asc'
        }
    });

    const circonscriptionsMap = {};

    // Créer la structure avec TOUS les arrondissements
    toutesLesCirconscriptions.forEach(circ => {
        circonscriptionsMap[circ.id] = {
            id: circ.id,
            code: circ.code,
            nom: circ.nom,
            commune: circ.commune.nom,
            departement: circ.commune.departement.nom,
            arrondissements: {}
        };

        // Ajouter tous les arrondissements avec valeurs par défaut
        circ.arrondissements.forEach(arr => {
            circonscriptionsMap[circ.id].arrondissements[arr.id] = {
                id: arr.id,
                code: arr.code,
                nom: arr.nom,
                population: arr.population,
                data: {
                    nombreElecteurs: 0,
                    nombreCentresDeVote: 0,
                    nombrePostesDeVote: 0
                }
            };
        });
    });

    // Remplir avec les données des récapitulatifs existants
    recaps.forEach(recap => {
        if (!recap.sa.arrondissement) return;

        const arr = recap.sa.arrondissement;
        const circ = arr.circonscription;

        if (circonscriptionsMap[circ.id] && circonscriptionsMap[circ.id].arrondissements[arr.id]) {
            circonscriptionsMap[circ.id].arrondissements[arr.id].data = {
                nombreElecteurs: recap.nombreElecteurs,
                nombreCentresDeVote: recap.nombreCentresDeVote,
                nombrePostesDeVote: recap.nombrePostesDeVote
            };
        }
    });

    // Construire l'en-tête du tableau avec colonnes
    const colonnes = [];
    const lignes = ['Électeurs', 'Centres', 'Postes'];

    Object.values(circonscriptionsMap).forEach(circ => {
        Object.values(circ.arrondissements).forEach(arr => {
            colonnes.push({
                circonscriptionId: circ.id,
                circonscriptionNom: circ.nom,
                communeNom: circ.commune,
                departementNom: circ.departement,
                arrondissementId: arr.id,
                arrondissementNom: arr.nom,
                arrondissementCode: arr.code,
                population: arr.population
            });
        });
    });

    // Construire la matrice
    const matrice = {};
    lignes.forEach(ligne => {
        matrice[ligne] = {};
        colonnes.forEach((col, index) => {
            const circ = circonscriptionsMap[col.circonscriptionId];
            const arr = circ.arrondissements[col.arrondissementId];

            if (ligne === 'Électeurs') {
                matrice[ligne][index] = arr.data.nombreElecteurs || 0;
            } else if (ligne === 'Centres') {
                matrice[ligne][index] = arr.data.nombreCentresDeVote || 0;
            } else if (ligne === 'Postes') {
                matrice[ligne][index] = arr.data.nombrePostesDeVote || 0;
            }
        });
    });

    return {
        election: {
            id: election.id,
            type: election.type,
            dateVote: election.dateVote
        },
        colonnes,
        lignes,
        matrice
    };
};

// ============ EXPORT RAPPORT EN PDF ============
const exportRapportPDF = async (electionId) => {
    if (!electionId) {
        throw new Error('ELECTION_ID_REQUIRED');
    }

    return await getTableauMatriciel(electionId);
};

// ============ CHECK RECAP STATUS ============
// Vérifie si le SA a un récap pour l'année en cours (basé sur dateVote de l'élection)
const checkRecapStatus = async (saId, electionId) => {
    // Déterminer l'année cible
    let targetYear;
    let targetElection = null;
    
    if (electionId) {
        // Si une élection est spécifiée, utiliser son année
        targetElection = await prisma.election.findUnique({
            where: { id: electionId }
        });
        if (targetElection) {
            targetYear = new Date(targetElection.dateVote).getFullYear();
        }
    }
    
    // Si pas d'élection spécifiée ou non trouvée, utiliser l'année courante
    if (!targetYear) {
        targetYear = new Date().getFullYear();
        
        // Trouver l'élection la plus récente de cette année
        targetElection = await prisma.election.findFirst({
            where: {
                dateVote: {
                    gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
                    lt: new Date(`${targetYear + 1}-01-01T00:00:00.000Z`)
                }
            },
            orderBy: { dateVote: 'desc' }
        });
    }

    // Chercher si le SA a déjà un récap pour une élection de cette année
    const recap = await prisma.recapitulatifElectoral.findFirst({
        where: {
            saId,
            election: {
                dateVote: {
                    gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
                    lt: new Date(`${targetYear + 1}-01-01T00:00:00.000Z`)
                }
            }
        },
        include: {
            election: true
        }
    });

    return {
        hasRecap: !!recap,
        recap: recap || null,
        electionId: targetElection?.id || null,
        year: targetYear
    };
};

// ============ GET RECAP BY SA AND ELECTION (OU PAR ANNÉE) ============
// Si electionId est fourni, cherche le récap pour cette élection
// Sinon, cherche le récap pour l'année courante
const getRecapBySAAndElection = async (saId, electionId) => {
    // Déterminer l'année cible
    let targetYear;
    
    if (electionId) {
        // Si une élection est spécifiée, chercher d'abord exactement pour cette élection
        const exactRecap = await prisma.recapitulatifElectoral.findUnique({
            where: {
                electionId_saId: {
                    electionId,
                    saId
                }
            },
            include: {
                election: true,
                sa: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        arrondissement: true
                    }
                }
            }
        });
        
        if (exactRecap) {
            return exactRecap;
        }
        
        // Si pas de récap pour cette élection, chercher pour la même année
        const election = await prisma.election.findUnique({
            where: { id: electionId }
        });
        if (election) {
            targetYear = new Date(election.dateVote).getFullYear();
        }
    }
    
    // Si pas d'année déterminée, utiliser l'année courante
    if (!targetYear) {
        targetYear = new Date().getFullYear();
    }

    // Chercher le récap pour cette année
    const recap = await prisma.recapitulatifElectoral.findFirst({
        where: {
            saId,
            election: {
                dateVote: {
                    gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
                    lt: new Date(`${targetYear + 1}-01-01T00:00:00.000Z`)
                }
            }
        },
        include: {
            election: true,
            sa: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    arrondissement: true
                }
            }
        }
    });

    return recap;
};



module.exports = {
    createRecapitulatifElectoral,
    getAllRecapitulatifsElectoraux,
    getRecapitulatifElectoralById,
    updateRecapitulatifElectoral,
    deleteRecapitulatifElectoral,
    getRecapitulatifsElectorauxByElection,
    getRecapitulatifsElectorauxBySA,
    countRecapitulatifs,
    getRapportHierarchiqueByElection,
    exportRapportPDF,
    getTableauMatriciel,
    checkRecapStatus,
    getRecapBySAAndElection
};
