const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Cree un nouveau resultat saisi pour un poste de vote
 */
const createResultSaisi = async (data) => {
    const {
        electionId,
        centreDeVoteId,
        posteDeVoteId,
        saId,
        dateOuverture,
        dateFermeture,
        nombreInscrits,
        nombreVotants,
        suffragesExprimes,
        abstentions,
        bulletinsNuls,
        derogations,
        procurations,
        resultatsPartis
    } = data;

    if (!electionId) throw new Error('ELECTION_ID_REQUIRED');
    if (!centreDeVoteId) throw new Error('CENTRE_ID_REQUIRED');
    if (!posteDeVoteId) throw new Error('POSTE_ID_REQUIRED');
    if (!saId) throw new Error('SA_ID_REQUIRED');

    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new Error('ELECTION_NOT_FOUND');

    const poste = await prisma.posteDeVote.findUnique({ where: { id: posteDeVoteId } });
    if (!poste) throw new Error('POSTE_NOT_FOUND');

    const existingResult = await prisma.resultSaisi.findUnique({
        where: { electionId_posteDeVoteId: { electionId, posteDeVoteId } }
    });
    if (existingResult) throw new Error('RESULT_ALREADY_EXISTS');

    const tauxParticipation = nombreInscrits > 0
        ? ((nombreVotants || 0) / nombreInscrits) * 100
        : 0;

    const result = await prisma.resultSaisi.create({
        data: {
            electionId,
            centreDeVoteId,
            posteDeVoteId,
            saId,
            dateOuverture: dateOuverture && !isNaN(new Date(dateOuverture).getTime()) ? new Date(dateOuverture) : null,
            dateFermeture: dateFermeture && !isNaN(new Date(dateFermeture).getTime()) ? new Date(dateFermeture) : null,
            nombreInscrits: nombreInscrits || 0,
            nombreVotants: nombreVotants || 0,
            suffragesExprimes: suffragesExprimes || 0,
            abstentions: abstentions || 0,
            bulletinsNuls: bulletinsNuls || 0,
            derogations: derogations || 0,
            procurations: procurations || 0,
            tauxParticipation,
            status: 'COMPLETEE',
            resultPartis: resultatsPartis ? {
                create: resultatsPartis.map(rp => ({
                    partiId: rp.partiId,
                    voix: rp.voix || 0
                }))
            } : undefined
        },
        include: {
            election: true,
            centreDeVote: true,
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true, email: true } },
            resultPartis: { include: { parti: true } }
        }
    });

    return result;
};

/**
 * Liste tous les resultats saisis avec filtres optionnels
 */
const getAllResultsSaisis = async (filters = {}) => {
    const { electionId, centreDeVoteId, status, saId, limit = 100, offset = 0 } = filters;

    const where = {};
    if (electionId) where.electionId = electionId;
    if (centreDeVoteId) where.centreDeVoteId = centreDeVoteId;
    if (status) where.status = status;
    if (saId) where.saId = saId;

    const results = await prisma.resultSaisi.findMany({
        where,
        include: {
            election: true,
            centreDeVote: { include: { quartier: true } },
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true, email: true } },
            resultPartis: { include: { parti: true } }
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' }
    });

    return results;
};

/**
 * Recupere un resultat par son ID
 */
const getResultSaisiById = async (id) => {
    if (!id) throw new Error('RESULT_ID_REQUIRED');

    const result = await prisma.resultSaisi.findUnique({
        where: { id },
        include: {
            election: true,
            centreDeVote: { include: { quartier: true } },
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true, email: true } },
            resultPartis: { include: { parti: true } }
        }
    });

    if (!result) throw new Error('RESULT_NOT_FOUND');
    return result;
};

/**
 * Recupere tous les resultats d'une election
 */
const getResultsByElection = async (electionId) => {
    if (!electionId) throw new Error('ELECTION_ID_REQUIRED');

    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new Error('ELECTION_NOT_FOUND');

    const results = await prisma.resultSaisi.findMany({
        where: { electionId },
        include: {
            centreDeVote: { include: { quartier: true } },
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true } },
            resultPartis: { include: { parti: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return results;
};

/**
 * Recupere tous les resultats d'un centre de vote
 */
const getResultsByCentre = async (centreDeVoteId) => {
    if (!centreDeVoteId) throw new Error('CENTRE_ID_REQUIRED');

    const centre = await prisma.centreDeVote.findUnique({ where: { id: centreDeVoteId } });
    if (!centre) throw new Error('CENTRE_NOT_FOUND');

    const results = await prisma.resultSaisi.findMany({
        where: { centreDeVoteId },
        include: {
            election: true,
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true } },
            resultPartis: { include: { parti: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return results;
};

/**
 * Recupere le resultat d'un poste specifique
 */
const getResultByPoste = async (electionId, posteDeVoteId) => {
    if (!electionId) throw new Error('ELECTION_ID_REQUIRED');
    if (!posteDeVoteId) throw new Error('POSTE_ID_REQUIRED');

    const result = await prisma.resultSaisi.findUnique({
        where: { electionId_posteDeVoteId: { electionId, posteDeVoteId } },
        include: {
            election: true,
            centreDeVote: { include: { quartier: true } },
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true, email: true } },
            resultPartis: { include: { parti: true } }
        }
    });

    if (!result) throw new Error('RESULT_NOT_FOUND');
    return result;
};

/**
 * Modifie un resultat (CA peut modifier seulement si REJETE)
 */
const updateResultSaisi = async (id, data, userId) => {
    if (!id) throw new Error('RESULT_ID_REQUIRED');

    const result = await prisma.resultSaisi.findUnique({
        where: { id },
        include: { centreDeVote: true }
    });
    if (!result) throw new Error('RESULT_NOT_FOUND');

    // Le CA ne peut modifier QUE si le poste est REJETÉ
    if (result.status === 'VALIDEE') throw new Error('RESULT_ALREADY_VALIDATED');
    if (result.status === 'COMPLETEE') throw new Error('RESULT_NOT_REJECTED_CANNOT_EDIT');

    // Seul un poste REJETEE peut être modifié par le CA

    const {
        dateOuverture,
        dateFermeture,
        nombreInscrits,
        nombreVotants,
        suffragesExprimes,
        abstentions,
        bulletinsNuls,
        derogations,
        procurations,
        resultatsPartis
    } = data;

    const tauxParticipation = nombreInscrits
        ? ((nombreVotants || result.nombreVotants) / nombreInscrits) * 100
        : result.tauxParticipation;

    const updated = await prisma.resultSaisi.update({
        where: { id },
        data: {
            dateOuverture: dateOuverture && !isNaN(new Date(dateOuverture).getTime()) ? new Date(dateOuverture) : undefined,
            dateFermeture: dateFermeture && !isNaN(new Date(dateFermeture).getTime()) ? new Date(dateFermeture) : undefined,
            nombreInscrits: nombreInscrits !== undefined ? nombreInscrits : undefined,
            nombreVotants: nombreVotants !== undefined ? nombreVotants : undefined,
            suffragesExprimes: suffragesExprimes !== undefined ? suffragesExprimes : undefined,
            abstentions: abstentions !== undefined ? abstentions : undefined,
            bulletinsNuls: bulletinsNuls !== undefined ? bulletinsNuls : undefined,
            derogations: derogations !== undefined ? derogations : undefined,
            procurations: procurations !== undefined ? procurations : undefined,
            tauxParticipation: tauxParticipation !== undefined ? tauxParticipation : undefined,
            // Après modification d'un poste rejeté, remettre à COMPLETEE pour re-validation
            status: 'COMPLETEE',
            dateValidation: null
        },
        include: {
            election: true,
            centreDeVote: true,
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true } },
            resultPartis: { include: { parti: true } }
        }
    });

    // Mettre à jour les résultats des partis si fournis
    if (resultatsPartis && Array.isArray(resultatsPartis)) {
        await prisma.resultatParti.deleteMany({ where: { resultSaisiId: id } });

        await prisma.resultatParti.createMany({
            data: resultatsPartis.map(rp => ({
                resultSaisiId: id,
                partiId: rp.partiId,
                voix: rp.voix || 0
            }))
        });
    }

    // Quand un poste corrigé, remettre la compilation en EN_COURS si elle était rejetée
    await resetCompilationSiNecessaire(result.electionId, result.centreDeVoteId);

    return getResultSaisiById(id);
};

/**
 * Valide un resultat (Admin uniquement)
 */
const validerResultSaisi = async (id) => {
    if (!id) throw new Error('RESULT_ID_REQUIRED');

    const result = await prisma.resultSaisi.findUnique({
        where: { id },
        include: { resultPartis: true }
    });
    if (!result) throw new Error('RESULT_NOT_FOUND');

    if (result.status === 'VALIDEE') throw new Error('RESULT_ALREADY_VALIDATED');

    // Vérifier qu'il y a au moins un résultat de parti
    if (result.resultPartis.length === 0) throw new Error('NO_PARTY_RESULTS');

    const validated = await prisma.resultSaisi.update({
        where: { id },
        data: {
            status: 'VALIDEE',
            dateValidation: new Date()
        },
        include: {
            election: true,
            centreDeVote: true,
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true } },
            resultPartis: { include: { parti: true } }
        }
    });

    // Vérifier si tous les postes sont validés pour mettre à jour la compilation
    await verifierEtMettreAJourCompilation(result.electionId, result.centreDeVoteId);

    return validated;
};

/**
 * Rejette un resultat (Admin uniquement)
 */
const rejeterResultSaisi = async (id) => {
    if (!id) throw new Error('RESULT_ID_REQUIRED');

    const result = await prisma.resultSaisi.findUnique({ where: { id } });
    if (!result) throw new Error('RESULT_NOT_FOUND');

    if (result.status === 'VALIDEE') throw new Error('RESULT_ALREADY_VALIDATED');
    if (result.status === 'REJETEE') throw new Error('RESULT_ALREADY_REJECTED');

    const rejected = await prisma.resultSaisi.update({
        where: { id },
        data: {
            status: 'REJETEE',
            dateValidation: null
        },
        include: {
            election: true,
            centreDeVote: true,
            posteDeVote: true,
            sa: { select: { id: true, firstName: true, lastName: true } },
            resultPartis: { include: { parti: true } }
        }
    });

    return rejected;
};

/**
 * Supprime un resultat
 */
const deleteResultSaisi = async (id) => {
    if (!id) throw new Error('RESULT_ID_REQUIRED');

    const result = await prisma.resultSaisi.findUnique({ where: { id } });
    if (!result) throw new Error('RESULT_NOT_FOUND');

    if (result.status === 'VALIDEE') throw new Error('CANNOT_DELETE_VALIDATED_RESULT');

    await prisma.resultSaisi.delete({ where: { id } });

    return { message: 'Resultat supprime avec succes', id };
};

/**
 * Verifie et met a jour la compilation automatiquement si tous les postes sont valides
 */
const verifierEtMettreAJourCompilation = async (electionId, centreDeVoteId) => {
    // Compter tous les postes saisis pour ce centre/élection
    const totalPostes = await prisma.resultSaisi.count({
        where: { electionId, centreDeVoteId }
    });

    // Compter les postes validés
    const postesValides = await prisma.resultSaisi.count({
        where: { electionId, centreDeVoteId, status: 'VALIDEE' }
    });

    // Récupérer la compilation existante
    const compilation = await prisma.compilation.findUnique({
        where: { electionId_centreDeVoteId: { electionId, centreDeVoteId } }
    });

    if (!compilation) return; // Pas de compilation créée encore

    // Si tous les postes sont validés → compilation VALIDEE automatiquement
    if (totalPostes > 0 && postesValides === totalPostes) {
        await prisma.compilation.update({
            where: { id: compilation.id },
            data: {
                status: 'VALIDEE',
                dateValidation: new Date(),
                dateRejet: null,
                raison_rejet: null
            }
        });
    }
};

/**
 * Remet la compilation en EN_COURS si un poste est corrige
 */
const resetCompilationSiNecessaire = async (electionId, centreDeVoteId) => {
    const compilation = await prisma.compilation.findUnique({
        where: { electionId_centreDeVoteId: { electionId, centreDeVoteId } }
    });

    if (!compilation) return;

    // Si la compilation était REJETEE, la passer en EN_COURS car le CA a corrigé
    if (compilation.status === 'REJETEE') {
        await prisma.compilation.update({
            where: { id: compilation.id },
            data: {
                status: 'EN_COURS',
                dateRejet: null,
                raison_rejet: null
            }
        });
    }
};

/**
 * Retourne les statistiques d'une election
 */
const getStatistiquesElection = async (electionId) => {
    if (!electionId) throw new Error('ELECTION_ID_REQUIRED');

    const totalResults = await prisma.resultSaisi.count({ where: { electionId } });
    const validatedResults = await prisma.resultSaisi.count({
        where: { electionId, status: 'VALIDEE' }
    });
    const rejectedResults = await prisma.resultSaisi.count({
        where: { electionId, status: 'REJETEE' }
    });
    const pendingResults = await prisma.resultSaisi.count({
        where: { electionId, status: 'COMPLETEE' }
    });

    const totals = await prisma.resultSaisi.aggregate({
        where: { electionId },
        _sum: {
            nombreInscrits: true,
            nombreVotants: true,
            suffragesExprimes: true,
            abstentions: true
        }
    });

    const resultsByParti = await prisma.resultatParti.groupBy({
        by: ['partiId'],
        where: {
            resultSaisi: { electionId, status: 'VALIDEE' }
        },
        _sum: { voix: true }
    });

    const partisWithVotes = await Promise.all(
        resultsByParti.map(async (rp) => {
            const parti = await prisma.parti.findUnique({ where: { id: rp.partiId } });
            return {
                parti,
                totalVoix: rp._sum.voix
            };
        })
    );

    return {
        totalResults,
        validatedResults,
        rejectedResults,
        pendingResults,
        totals: totals._sum,
        resultsByParti: partisWithVotes
    };
};

/**
 * Retourne le statut de tous les postes d'un centre (Vue Admin)
 */
const getPostesStatusByCentre = async (centreDeVoteId, electionId) => {
    if (!centreDeVoteId) throw new Error('CENTRE_ID_REQUIRED');
    if (!electionId) throw new Error('ELECTION_ID_REQUIRED');

    const centre = await prisma.centreDeVote.findUnique({
        where: { id: centreDeVoteId },
        include: {
            quartier: {
                include: {
                    arrondissement: true
                }
            }
        }
    });
    if (!centre) throw new Error('CENTRE_NOT_FOUND');

    const election = await prisma.election.findUnique({ where: { id: electionId } });
    if (!election) throw new Error('ELECTION_NOT_FOUND');

    // Récupérer TOUS les postes du centre
    const allPostes = await prisma.posteDeVote.findMany({
        where: { centreDeVoteId },
        orderBy: { numero: 'asc' }
    });

    // Récupérer les résultats saisis pour ce centre/élection
    const resultats = await prisma.resultSaisi.findMany({
        where: { centreDeVoteId, electionId },
        include: {
            sa: { select: { id: true, firstName: true, lastName: true, email: true } },
            resultPartis: { include: { parti: true } }
        }
    });

    // Mapper pour avoir la liste complète des postes avec leur statut (ou EN_ATTENTE si pas de résultat)
    const postesStatus = allPostes.map(poste => {
        const resultat = resultats.find(r => r.posteDeVoteId === poste.id);
        return {
            id: resultat?.id || null, // ID du ResultSaisi (null si pas encore saisi)
            posteId: poste.id, // ID du PosteDeVote
            poste: poste,
            status: resultat?.status || 'EN_ATTENTE',
            statusLabel: resultat?.status === 'VALIDEE' ? 'Valide' :
                resultat?.status === 'REJETEE' ? 'Rejete' :
                    resultat?.status === 'COMPLETEE' ? 'A valider' : 'En attente',
            dateValidation: resultat?.dateValidation || null,
            dateSaisie: resultat?.dateSaisie || null,
            sa: resultat?.sa || null,
            nombreInscrits: resultat?.nombreInscrits || 0,
            nombreVotants: resultat?.nombreVotants || 0,
            suffragesExprimes: resultat?.suffragesExprimes || 0,
            bulletinsNuls: resultat?.bulletinsNuls || 0,
            resultPartis: resultat?.resultPartis || []
        };
    });

    // Calculer les statistiques sur la base de TOUS les postes
    const stats = {
        totalPostes: allPostes.length,
        postesSaisis: resultats.length,
        postesValides: resultats.filter(p => p.status === 'VALIDEE').length,
        postesRejetes: resultats.filter(p => p.status === 'REJETEE').length,
        postesEnAttente: resultats.filter(p => p.status === 'COMPLETEE').length
    };

    // Récupérer la compilation associée avec son observation globale
    const compilation = await prisma.compilation.findUnique({
        where: { electionId_centreDeVoteId: { electionId, centreDeVoteId } },
        include: {
            agent: { select: { id: true, firstName: true, lastName: true } }
        }
    });

    return {
        centre,
        election: {
            id: election.id,
            type: election.type,
            dateVote: election.dateVote
        },
        postes: postesStatus,
        stats,
        tousValides: stats.totalPostes > 0 && stats.postesValides === stats.totalPostes,
        compilation: compilation ? {
            id: compilation.id,
            status: compilation.status,
            urlPhoto: compilation.urlPhoto,
            observation: compilation.raison_rejet, // Observation globale de l'Admin
            agent: compilation.agent
        } : null
    };
};

/**
 * Retourne les postes rejetes pour le CA connecte
 */
const getPostesRejetesPourCA = async (saId, electionId) => {
    if (!saId) throw new Error('SA_ID_REQUIRED');

    const where = { saId, status: 'REJETEE' };
    if (electionId) where.electionId = electionId;

    const postesRejetes = await prisma.resultSaisi.findMany({
        where,
        include: {
            election: { select: { id: true, type: true, dateVote: true } },
            centreDeVote: {
                select: {
                    id: true,
                    nom: true
                }
            },
            posteDeVote: true,
            resultPartis: { include: { parti: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Récupérer l'observation globale pour chaque centre
    const resultats = await Promise.all(postesRejetes.map(async (p) => {
        const compilation = await prisma.compilation.findFirst({
            where: {
                centreDeVoteId: p.centreDeVoteId,
                electionId: p.electionId
            },
            select: { raison_rejet: true }
        });
        return {
            ...p,
            observationGlobale: compilation?.raison_rejet || null
        };
    }));

    return resultats;
};

const getResultatsSAComplet = async (saId) => {
    if (!saId) throw new Error('SA_ID_REQUIRED');

    const resultats = await prisma.resultSaisi.findMany({
        where: { saId },
        include: {
            election: {
                select: {
                    id: true,
                    type: true,
                    dateVote: true
                }
            },
            centreDeVote: {
                select: {
                    id: true,
                    nom: true,
                    adresse: true,
                    quartier: {
                        select: {
                            id: true,
                            nom: true,
                            arrondissement: {
                                select: {
                                    id: true,
                                    nom: true,
                                    circonscription: {
                                        select: {
                                            id: true,
                                            nom: true,
                                            commune: {
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
                    }
                }
            },
            posteDeVote: {
                select: {
                    id: true,
                    numero: true,
                    libelle: true
                }
            },
            resultPartis: {
                include: {
                    parti: {
                        select: {
                            id: true,
                            nom: true,
                            sigle: true
                        }
                    }
                },
                orderBy: { voix: 'desc' }
            },
            sa: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        orderBy: [
            { election: { dateVote: 'desc' } },
            { centreDeVote: { nom: 'asc' } },
            { posteDeVote: { numero: 'asc' } }
        ]
    });

    // Récupérer l'observation globale pour chaque centre et formater les résultats
    const formattedResults = await Promise.all(resultats.map(async (r) => {
        // Récupérer la compilation pour obtenir la raison de rejet si elle existe
        const compilation = await prisma.compilation.findFirst({
            where: { 
                centreDeVoteId: r.centreDeVoteId,
                electionId: r.electionId
            },
            select: { raison_rejet: true }
        });

        return {
            id: r.id,
            status: r.status,
            dateSaisie: r.dateSaisie,
            dateValidation: r.dateValidation,
            election: r.election,
            centre: {
                id: r.centreDeVote.id,
                nom: r.centreDeVote.nom,
                adresse: r.centreDeVote.adresse,
                quartier: r.centreDeVote.quartier.nom,
                arrondissement: r.centreDeVote.quartier.arrondissement.nom,
                commune: r.centreDeVote.quartier.arrondissement.circonscription.commune.nom
            },
            poste: r.posteDeVote,
            sa: r.sa,
            details: {
                nombreInscrits: r.nombreInscrits,
                nombreVotants: r.nombreVotants,
                suffragesExprimes: r.suffragesExprimes,
                abstentions: r.abstentions,
                bulletinsNuls: r.bulletinsNuls,
                derogations: r.derogations,
                procurations: r.procurations,
                tauxParticipation: r.tauxParticipation,
                dateOuverture: r.dateOuverture,
                dateFermeture: r.dateFermeture
            },
            resultatsPartis: r.resultPartis.map(rp => ({
                partiId: rp.parti.id,
                partiNom: rp.parti.nom,
                partiSigle: rp.parti.sigle,
                voix: rp.voix
            })),
            observationGlobale: compilation?.raison_rejet || null
        };
    }));

    return formattedResults;
};

const getPostesAuRemplirSA = async (saId) => {
    if (!saId) throw new Error('SA_ID_REQUIRED');

    // Récupérer le SA et ses centres assignés
    const sa = await prisma.user.findUnique({
        where: { id: saId },
        select: {
            centresDeVote: {
                select: { id: true }
            }
        }
    });

    if (!sa) throw new Error('SA_NOT_FOUND');

    const centreIds = sa.centresDeVote.map(c => c.id);

    if (centreIds.length === 0) {
        return [];
    }

    // Récupérer les élections ACTIVES (EN_COURS ou PLANIFIEE)
    const electionsActives = await prisma.election.findMany({
        where: {
            statut: { in: ['PLANIFIEE', 'EN_COURS'] }
        },
        select: { id: true }
    });

    const electionIds = electionsActives.map(e => e.id);

    if (electionIds.length === 0) {
        return [];
    }

    // Récupérer tous les postes des centres du SA
    const tousLesPostes = await prisma.posteDeVote.findMany({
        where: {
            centreDeVoteId: { in: centreIds }
        },
        include: {
            centreDeVote: {
                select: {
                    id: true,
                    nom: true,
                    quartier: {
                        select: {
                            nom: true,
                            arrondissement: {
                                select: {
                                    nom: true,
                                    circonscription: {
                                        select: {
                                            commune: { select: { nom: true } }
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

    // Récupérer les résultats DÉJÀ remplis par ce SA pour les élections actives
    const resultatsRemplis = await prisma.resultSaisi.findMany({
        where: {
            saId,
            electionId: { in: electionIds }
        },
        select: {
            posteDeVoteId: true,
            electionId: true
        }
    });

    // Créer un set des combinaisons (poste, election) déjà remplies
    const remplis = new Set(
        resultatsRemplis.map(r => `${r.posteDeVoteId}-${r.electionId}`)
    );

    // Récupérer les élections avec détails
    const elections = await prisma.election.findMany({
        where: { id: { in: electionIds } },
        select: {
            id: true,
            type: true,
            statut: true,
            dateVote: true
        }
    });

    // Construire la liste des postes à remplir
    const postesAuRemplir = [];

    for (const poste of tousLesPostes) {
        for (const election of elections) {
            const key = `${poste.id}-${election.id}`;
            
            if (!remplis.has(key)) {
                postesAuRemplir.push({
                    posteId: poste.id,
                    posteNumero: poste.numero,
                    posteLibelle: poste.libelle,
                    centre: {
                        id: poste.centreDeVote.id,
                        nom: poste.centreDeVote.nom,
                        quartier: poste.centreDeVote.quartier.nom,
                        arrondissement: poste.centreDeVote.quartier.arrondissement.nom,
                        commune: poste.centreDeVote.quartier.arrondissement.circonscription.commune.nom
                    },
                    election: {
                        id: election.id,
                        type: election.type,
                        statut: election.statut,
                        dateVote: election.dateVote
                    }
                });
            }
        }
    }

    // Trier par élection (date récente en premier) puis centre et poste
    return postesAuRemplir.sort((a, b) => {
        const dateA = new Date(b.election.dateVote);
        const dateB = new Date(a.election.dateVote);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
        }
        
        const centreCmp = a.centre.nom.localeCompare(b.centre.nom);
        if (centreCmp !== 0) return centreCmp;
        
        return a.posteNumero - b.posteNumero;
    });
};

module.exports = {
    createResultSaisi,
    getAllResultsSaisis,
    getResultSaisiById,
    getResultsByElection,
    getResultsByCentre,
    getResultByPoste,
    updateResultSaisi,
    validerResultSaisi,
    rejeterResultSaisi,
    deleteResultSaisi,
    getStatistiquesElection,
    getPostesStatusByCentre,
    getPostesRejetesPourCA,
    getResultatsSAComplet,
    getPostesAuRemplirSA,
    verifierEtMettreAJourCompilation
};
