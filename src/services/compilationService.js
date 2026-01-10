const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Cree une nouvelle compilation pour un centre
 */
const createCompilation = async (data) => {
    const { electionId, centreDeVoteId, agentId, urlPhoto } = data;

    // Validations
    if (!electionId) throw new Error('ELECTION_ID_REQUIRED');
    if (!centreDeVoteId) throw new Error('CENTRE_ID_REQUIRED');
    if (!agentId) throw new Error('AGENT_ID_REQUIRED');
    if (!urlPhoto) throw new Error('URL_PHOTO_REQUIRED');

    // Vérifier que l'élection existe
    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new Error('ELECTION_NOT_FOUND');

    // Vérifier que le centre existe
    const centre = await prisma.centreDeVote.findUnique({ where: { id: centreDeVoteId } });
    if (!centre) throw new Error('CENTRE_NOT_FOUND');

    // Vérifier que l'agent existe et est un AGENT ou CA
    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) throw new Error('AGENT_NOT_FOUND');
    if (agent.role !== 'AGENT' && agent.role !== 'SA') throw new Error('INVALID_AGENT_ROLE');

    // Vérifier qu'une compilation n'existe pas déjà pour ce centre/élection
    const existing = await prisma.compilation.findUnique({
        where: { electionId_centreDeVoteId: { electionId, centreDeVoteId } }
    });
    if (existing) throw new Error('COMPILATION_ALREADY_EXISTS');

    // Vérifier qu'il y a au moins un résultat saisi pour ce centre
    const resultatsCount = await prisma.resultSaisi.count({
        where: { electionId, centreDeVoteId }
    });
    if (resultatsCount === 0) throw new Error('NO_RESULTS_FOR_CENTRE');

    // Vérifier le statut des postes pour déterminer le statut initial de la compilation
    const postesValides = await prisma.resultSaisi.count({
        where: { electionId, centreDeVoteId, status: 'VALIDEE' }
    });

    // Si tous les postes sont déjà validés, la compilation est directement validée
    const statusInitial = (postesValides === resultatsCount && resultatsCount > 0) 
        ? 'VALIDEE' 
        : 'EN_COURS';

    const compilation = await prisma.compilation.create({
        data: {
            electionId,
            centreDeVoteId,
            agentId,
            urlPhoto,
            status: statusInitial,
            dateValidation: statusInitial === 'VALIDEE' ? new Date() : null
        },
        include: {
            election: true,
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: {
                                include: {
                                    circonscription: {
                                        include: {
                                            commune: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true
                }
            }
        }
    });

    return compilation;
};

/**
 * Liste toutes les compilations avec filtres
 */
const getAllCompilations = async (filters = {}) => {
    const { electionId, centreDeVoteId, agentId, status, limit = 100, offset = 0 } = filters;

    const where = {};
    if (electionId) where.electionId = electionId;
    if (centreDeVoteId) where.centreDeVoteId = centreDeVoteId;
    if (agentId) where.agentId = agentId;
    if (status) where.status = status;

    const compilations = await prisma.compilation.findMany({
        where,
        include: {
            election: {
                select: {
                    id: true,
                    type: true,
                    dateVote: true
                }
            },
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: {
                                select: {
                                    id: true,
                                    nom: true
                                }
                            }
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        skip: offset,
        take: limit,
        orderBy: { dateCompilation: 'desc' }
    });

    return compilations;
};

/**
 * Recupere une compilation par son ID
 */
const getCompilationById = async (id) => {
    if (!id) throw new Error('COMPILATION_ID_REQUIRED');

    const compilation = await prisma.compilation.findUnique({
        where: { id },
        include: {
            election: true,
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: {
                                include: {
                                    circonscription: {
                                        include: {
                                            commune: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    postesDeVote: {
                        include: {
                            resultSaisies: {
                                where: { electionId: compilation?.electionId },
                                include: {
                                    resultPartis: {
                                        include: { parti: true }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true
                }
            }
        }
    });

    if (!compilation) throw new Error('COMPILATION_NOT_FOUND');
    return compilation;
};

/**
 * Recupere la compilation d'un centre pour une election
 */
const getCompilationByCentre = async (centreDeVoteId, electionId) => {
    if (!centreDeVoteId) throw new Error('CENTRE_ID_REQUIRED');
    if (!electionId) throw new Error('ELECTION_ID_REQUIRED');

    const centre = await prisma.centreDeVote.findUnique({ where: { id: centreDeVoteId } });
    if (!centre) throw new Error('CENTRE_NOT_FOUND');

    const compilation = await prisma.compilation.findUnique({
        where: { electionId_centreDeVoteId: { electionId, centreDeVoteId } },
        include: {
            election: true,
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: true
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

    if (!compilation) throw new Error('COMPILATION_NOT_FOUND');
    return compilation;
};

/**
 * Modifie une compilation
 */
const updateCompilation = async (id, data) => {
    if (!id) throw new Error('COMPILATION_ID_REQUIRED');

    const compilation = await prisma.compilation.findUnique({ where: { id } });
    if (!compilation) throw new Error('COMPILATION_NOT_FOUND');

    // Ne pas modifier si validée ou rejetée
    if (compilation.status === 'VALIDEE') throw new Error('COMPILATION_ALREADY_VALIDATED');
    if (compilation.status === 'REJETEE') throw new Error('COMPILATION_ALREADY_REJECTED');

    const { agentId, urlPhoto } = data;

    const updateData = {};
    
    if (agentId) {
        const agent = await prisma.user.findUnique({ where: { id: agentId } });
        if (!agent) throw new Error('AGENT_NOT_FOUND');
        if (agent.role !== 'AGENT' && agent.role !== 'SA') throw new Error('INVALID_AGENT_ROLE');
        updateData.agentId = agentId;
    }

    if (urlPhoto) {
        // Accepter les URLs Cloudinary et les URLs classiques avec extension image/PDF
        const isCloudinary = urlPhoto.includes('cloudinary.com');
        const isValidUrl = urlPhoto.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|pdf)$/i);
        
        if (!isCloudinary && !isValidUrl) {
            throw new Error('INVALID_PHOTO_URL');
        }
        updateData.urlPhoto = urlPhoto;
    }

    const updated = await prisma.compilation.update({
        where: { id },
        data: updateData,
        include: {
            election: true,
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: true
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

    return updated;
};

/**
 * Valide manuellement une compilation
 */
// Cette fonction est appelée manuellement si l'admin veut forcer la validation
const validerCompilation = async (id) => {
    if (!id) throw new Error('COMPILATION_ID_REQUIRED');

    const compilation = await prisma.compilation.findUnique({ where: { id } });
    if (!compilation) throw new Error('COMPILATION_NOT_FOUND');

    if (compilation.status === 'VALIDEE') throw new Error('COMPILATION_ALREADY_VALIDATED');

    // Vérifier qu'il y a une photo
    if (!compilation.urlPhoto) throw new Error('PHOTO_REQUIRED_FOR_VALIDATION');

    // Vérifier que TOUS les postes du centre sont validés
    const totalPostes = await prisma.resultSaisi.count({
        where: { electionId: compilation.electionId, centreDeVoteId: compilation.centreDeVoteId }
    });
    const postesValides = await prisma.resultSaisi.count({
        where: { 
            electionId: compilation.electionId, 
            centreDeVoteId: compilation.centreDeVoteId, 
            status: 'VALIDEE' 
        }
    });

    if (totalPostes === 0) throw new Error('NO_POSTES_FOR_CENTRE');
    if (postesValides < totalPostes) throw new Error('NOT_ALL_POSTES_VALIDATED');

    const validated = await prisma.compilation.update({
        where: { id },
        data: {
            status: 'VALIDEE',
            dateValidation: new Date(),
            dateRejet: null,
            raison_rejet: null
        },
        include: {
            election: true,
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: true
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

    return validated;
};

/**
 * Rejette une compilation avec observation
 */
const rejeterCompilation = async (id, raison) => {
    if (!id) throw new Error('COMPILATION_ID_REQUIRED');
    if (!raison || raison.trim() === '') throw new Error('RAISON_REJET_REQUIRED');

    const compilation = await prisma.compilation.findUnique({ where: { id } });
    if (!compilation) throw new Error('COMPILATION_NOT_FOUND');

    if (compilation.status === 'VALIDEE') throw new Error('COMPILATION_ALREADY_VALIDATED');

    const rejected = await prisma.compilation.update({
        where: { id },
        data: {
            status: 'REJETEE',
            dateRejet: new Date(),
            raison_rejet: raison.trim() // Observation globale pour le CA
        },
        include: {
            election: true,
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: true
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

    return rejected;
};

/**
 * Ecrit ou modifie l'observation globale
 */
const setObservation = async (id, observation) => {
    if (!id) throw new Error('COMPILATION_ID_REQUIRED');

    const compilation = await prisma.compilation.findUnique({ where: { id } });
    if (!compilation) throw new Error('COMPILATION_NOT_FOUND');

    if (compilation.status === 'VALIDEE') throw new Error('COMPILATION_ALREADY_VALIDATED');

    const updated = await prisma.compilation.update({
        where: { id },
        data: {
            raison_rejet: observation ? observation.trim() : null
        },
        include: {
            election: true,
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: true
                        }
                    }
                }
            },
            agent: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

    return updated;
};

/**
 * Supprime une compilation
 */
const deleteCompilation = async (id) => {
    if (!id) throw new Error('COMPILATION_ID_REQUIRED');

    const compilation = await prisma.compilation.findUnique({ where: { id } });
    if (!compilation) throw new Error('COMPILATION_NOT_FOUND');

    if (compilation.status === 'VALIDEE') throw new Error('CANNOT_DELETE_VALIDATED_COMPILATION');

    await prisma.compilation.delete({ where: { id } });

    return { message: 'Compilation supprimée avec succès', id };
};

/**
 * Retourne les statistiques des compilations
 */
const getCompilationStats = async (electionId) => {
    if (!electionId) throw new Error('ELECTION_ID_REQUIRED');

    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new Error('ELECTION_NOT_FOUND');

    const total = await prisma.compilation.count({ where: { electionId } });
    const validees = await prisma.compilation.count({
        where: { electionId, status: 'VALIDEE' }
    });
    const enCours = await prisma.compilation.count({
        where: { electionId, status: 'COURS' }
    });
    const rejetees = await prisma.compilation.count({
        where: { electionId, status: 'REJETEE' }
    });

    // Stats par arrondissement
    const compilationsByArrondissement = await prisma.compilation.findMany({
        where: { electionId },
        include: {
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: {
                                select: {
                                    id: true,
                                    nom: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const statsByArrondissement = {};
    compilationsByArrondissement.forEach(comp => {
        const arrId = comp.centreDeVote.quartier.arrondissement.id;
        const arrNom = comp.centreDeVote.quartier.arrondissement.nom;

        if (!statsByArrondissement[arrId]) {
            statsByArrondissement[arrId] = {
                arrondissementId: arrId,
                arrondissementNom: arrNom,
                total: 0,
                validees: 0,
                enCours: 0,
                rejetees: 0
            };
        }

        statsByArrondissement[arrId].total++;
        if (comp.status === 'VALIDEE') statsByArrondissement[arrId].validees++;
        if (comp.status === 'EN_COURS') statsByArrondissement[arrId].enCours++;
        if (comp.status === 'REJETEE') statsByArrondissement[arrId].rejetees++;
    });

    return {
        electionId,
        typeElection: election.type,
        dateVote: election.dateVote,
        stats: {
            total,
            validees,
            enCours,
            rejetees,
            tauxValidation: total > 0 ? ((validees / total) * 100).toFixed(2) : 0
        },
        statsByArrondissement: Object.values(statsByArrondissement)
    };
};

/**
 * Retourne le dashboard complet d'une compilation
 */
const getCompilationDashboard = async (id) => {
    if (!id) throw new Error('COMPILATION_ID_REQUIRED');

    const compilation = await prisma.compilation.findUnique({
        where: { id },
        include: {
            election: true,
            centreDeVote: {
                include: {
                    quartier: {
                        include: {
                            arrondissement: {
                                include: {
                                    circonscription: {
                                        include: { commune: true }
                                    }
                                }
                            }
                        }
                    },
                    postesDeVote: true
                }
            },
            agent: {
                select: { id: true, firstName: true, lastName: true, email: true }
            }
        }
    });

    if (!compilation) throw new Error('COMPILATION_NOT_FOUND');

    // Récupérer tous les postes saisis pour ce centre/élection
    const postes = await prisma.resultSaisi.findMany({
        where: {
            electionId: compilation.electionId,
            centreDeVoteId: compilation.centreDeVoteId
        },
        include: {
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true, email: true } },
            resultPartis: {
                include: { parti: true },
                orderBy: { voix: 'desc' }
            }
        },
        orderBy: { posteDeVote: { numero: 'asc' } }
    });

    // Calculer les statistiques
    const stats = {
        totalPostes: postes.length,
        totalPostesCentre: compilation.centreDeVote.postesDeVote.length,
        postesValides: postes.filter(p => p.status === 'VALIDEE').length,
        postesRejetes: postes.filter(p => p.status === 'REJETEE').length,
        postesEnAttente: postes.filter(p => p.status === 'COMPLETEE').length,
        postesSaisisPourcentage: compilation.centreDeVote.postesDeVote.length > 0 
            ? ((postes.length / compilation.centreDeVote.postesDeVote.length) * 100).toFixed(2)
            : 0
    };

    // Vérifier si la compilation peut être validée
    const peutEtreValidee = stats.totalPostes > 0 && 
        stats.postesValides === stats.totalPostes && 
        compilation.urlPhoto;

    return {
        compilation: {
            id: compilation.id,
            status: compilation.status,
            urlPhoto: compilation.urlPhoto,
            dateCompilation: compilation.dateCompilation,
            dateValidation: compilation.dateValidation,
            dateRejet: compilation.dateRejet,
            raisonRejet: compilation.raison_rejet,
            agent: compilation.agent
        },
        election: compilation.election,
        centre: {
            id: compilation.centreDeVote.id,
            nom: compilation.centreDeVote.nom,
            quartier: compilation.centreDeVote.quartier.nom,
            arrondissement: compilation.centreDeVote.quartier.arrondissement.nom,
            commune: compilation.centreDeVote.quartier.arrondissement.circonscription.commune.nom
        },
        postes: postes.map(p => ({
            id: p.id,
            poste: {
                id: p.posteDeVote.id,
                numero: p.posteDeVote.numero,
                libelle: p.posteDeVote.libelle
            },
            status: p.status,
            statusLabel: p.status === 'VALIDEE' ? 'Valide' : 
                         p.status === 'REJETEE' ? 'Rejete' : 'En attente',
            dateValidation: p.dateValidation,
            dateSaisie: p.dateSaisie,
            sa: p.sa,
            nombreInscrits: p.nombreInscrits,
            nombreVotants: p.nombreVotants,
            suffragesExprimes: p.suffragesExprimes,
            tauxParticipation: p.tauxParticipation,
            resultPartis: p.resultPartis.map(rp => ({
                parti: rp.parti.nom,
                sigle: rp.parti.sigle,
                voix: rp.voix
            }))
        })),
        stats,
        observationGlobale: compilation.raison_rejet, // Observation de l'Admin
        peutEtreValidee,
        messageValidation: !peutEtreValidee ? (
            !compilation.urlPhoto ? 'Photo requise pour la validation' :
            stats.postesRejetes > 0 ? `${stats.postesRejetes} poste(s) rejeté(s) à corriger` :
            stats.postesEnAttente > 0 ? `${stats.postesEnAttente} poste(s) en attente de validation` :
            stats.totalPostes === 0 ? 'Aucun poste saisi' :
            'Tous les postes doivent être validés'
        ) : 'Prêt pour validation'
    };
};

module.exports = {
    createCompilation,
    getAllCompilations,
    getCompilationById,
    getCompilationByCentre,
    updateCompilation,
    validerCompilation,
    rejeterCompilation,
    setObservation,
    deleteCompilation,
    getCompilationStats,
    getCompilationDashboard
};
