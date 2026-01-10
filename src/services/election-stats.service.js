const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ElectionStatsService {
  /**
   * Récupère les stats par commune pour une élection
   */
  async getStatsByCommune(electionId) {
    const postesData = await prisma.posteDeVote.findMany({
      include: {
        centreDeVote: {
          include: {
            quartier: {
              include: {
                arrondissement: {
                  include: {
                    circonscription: {
                      include: {
                        commune: {
                          include: { departement: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        resultSaisies: {
          where: { electionId },
          include: {
            resultPartis: {
              include: { parti: true }
            }
          }
        }
      }
    });

    // Grouper par commune
    const parCommune = {};

    for (const poste of postesData) {
      const commune = poste.centreDeVote.quartier.arrondissement.circonscription.commune;
      const communeKey = commune.id;

      if (!parCommune[communeKey]) {
        parCommune[communeKey] = {
          communeId: commune.id,
          communeCode: commune.code,
          communeNom: commune.nom,
          departement: commune.departement.nom,
          
          totalInscrits: 0,
          totalVotants: 0,
          totalSuffragesExprimes: 0,
          
          postesAvecResultats: 0,
          totalPostes: 0,
          
          partiVoix: {},
          postesData: []
        };
      }

      parCommune[communeKey].totalPostes++;

      const resultSaisi = poste.resultSaisies[0];
      if (resultSaisi && resultSaisi.status === 'COMPLETEE') {
        parCommune[communeKey].postesAvecResultats++;
        parCommune[communeKey].totalInscrits += resultSaisi.nombreInscrits || 0;
        parCommune[communeKey].totalVotants += resultSaisi.nombreVotants || 0;
        parCommune[communeKey].totalSuffragesExprimes += resultSaisi.suffragesExprimes || 0;

        for (const rp of resultSaisi.resultPartis) {
          const key = rp.parti.sigle;
          if (!parCommune[communeKey].partiVoix[key]) {
            parCommune[communeKey].partiVoix[key] = {
              partiSigle: rp.parti.sigle,
              partiNom: rp.parti.nom,
              voix: 0
            };
          }
          parCommune[communeKey].partiVoix[key].voix += rp.voix || 0;
        }
      }
    }

    // Formatter la réponse
    return Object.values(parCommune).map(commune => ({
      communeCode: commune.communeCode,
      communeNom: commune.communeNom,
      departement: commune.departement,

      totalInscrits: commune.totalInscrits,
      totalVotants: commune.totalVotants,
      tauxParticipation: commune.totalInscrits > 0 
        ? Number(((commune.totalVotants / commune.totalInscrits) * 100).toFixed(2))
        : 0,

      totalSuffragesExprimes: commune.totalSuffragesExprimes,
      
      resultatPartis: Object.values(commune.partiVoix).map(p => ({
        partiSigle: p.partiSigle,
        partiNom: p.partiNom,
        voix: p.voix,
        pourcentage: commune.totalSuffragesExprimes > 0
          ? Number(((p.voix / commune.totalSuffragesExprimes) * 100).toFixed(2))
          : 0
      })).sort((a, b) => b.voix - a.voix),

      nombrePostes: commune.totalPostes,
      nombrePostesAvecResultats: commune.postesAvecResultats,
      tauxCompletion: commune.totalPostes > 0
        ? Number(((commune.postesAvecResultats / commune.totalPostes) * 100).toFixed(2))
        : 0
    }));
  }

  /**
   * Récupère les stats par arrondissement
   */
  async getStatsByArrondissement(electionId) {
    const postesData = await prisma.posteDeVote.findMany({
      include: {
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
            }
          }
        },
        resultSaisies: {
          where: { electionId },
          include: {
            resultPartis: {
              include: { parti: true }
            }
          }
        }
      }
    });

    const parArrondissement = {};

    for (const poste of postesData) {
      const arr = poste.centreDeVote.quartier.arrondissement;
      const circ = arr.circonscription;
      const commune = circ.commune;
      const arrKey = arr.id;

      if (!parArrondissement[arrKey]) {
        parArrondissement[arrKey] = {
          arrondissementCode: arr.code,
          arrondissementNom: arr.nom,
          circonscriptionCode: circ.code,
          circonscriptionNom: circ.nom,
          communeCode: commune.code,
          communeNom: commune.nom,

          totalInscrits: 0,
          totalVotants: 0,
          totalSuffragesExprimes: 0,

          postesAvecResultats: 0,
          totalPostes: 0,

          partiVoix: {}
        };
      }

      parArrondissement[arrKey].totalPostes++;

      const resultSaisi = poste.resultSaisies[0];
      if (resultSaisi && resultSaisi.status === 'COMPLETEE') {
        parArrondissement[arrKey].postesAvecResultats++;
        parArrondissement[arrKey].totalInscrits += resultSaisi.nombreInscrits || 0;
        parArrondissement[arrKey].totalVotants += resultSaisi.nombreVotants || 0;
        parArrondissement[arrKey].totalSuffragesExprimes += resultSaisi.suffragesExprimes || 0;

        for (const rp of resultSaisi.resultPartis) {
          const key = rp.parti.sigle;
          if (!parArrondissement[arrKey].partiVoix[key]) {
            parArrondissement[arrKey].partiVoix[key] = {
              partiSigle: rp.parti.sigle,
              partiNom: rp.parti.nom,
              voix: 0
            };
          }
          parArrondissement[arrKey].partiVoix[key].voix += rp.voix || 0;
        }
      }
    }

    return Object.values(parArrondissement).map(arr => ({
      arrondissementCode: arr.arrondissementCode,
      arrondissementNom: arr.arrondissementNom,
      circonscriptionCode: arr.circonscriptionCode,
      circonscriptionNom: arr.circonscriptionNom,
      communeCode: arr.communeCode,
      communeNom: arr.communeNom,

      totalInscrits: arr.totalInscrits,
      totalVotants: arr.totalVotants,
      tauxParticipation: arr.totalInscrits > 0
        ? Number(((arr.totalVotants / arr.totalInscrits) * 100).toFixed(2))
        : 0,

      totalSuffragesExprimes: arr.totalSuffragesExprimes,

      resultatPartis: Object.values(arr.partiVoix).map(p => ({
        partiSigle: p.partiSigle,
        partiNom: p.partiNom,
        voix: p.voix,
        pourcentage: arr.totalSuffragesExprimes > 0
          ? Number(((p.voix / arr.totalSuffragesExprimes) * 100).toFixed(2))
          : 0
      })).sort((a, b) => b.voix - a.voix),

      nombrePostes: arr.totalPostes,
      nombrePostesAvecResultats: arr.postesAvecResultats,
      tauxCompletion: arr.totalPostes > 0
        ? Number(((arr.postesAvecResultats / arr.totalPostes) * 100).toFixed(2))
        : 0
    }));
  }

  /**
   * Récupère les stats par centre de vote
   */
  async getStatsByCentreDeVote(electionId) {
    const centres = await prisma.centreDeVote.findMany({
      include: {
        quartier: {
          include: {
            arrondissement: {
              include: {
                circonscription: true
              }
            }
          }
        },
        postesDeVote: {
          include: {
            resultSaisies: {
              where: { electionId },
              include: {
                resultPartis: {
                  include: { parti: true }
                }
              }
            }
          }
        }
      }
    });

    return centres.map(centre => {
      let totalInscrits = 0;
      let totalVotants = 0;
      let totalSuffragesExprimes = 0;
      const partiVoix = {};
      let postesAvecResultats = 0;

      for (const poste of centre.postesDeVote) {
        const resultSaisi = poste.resultSaisies[0];
        if (resultSaisi && resultSaisi.status === 'COMPLETEE') {
          postesAvecResultats++;
          totalInscrits += resultSaisi.nombreInscrits || 0;
          totalVotants += resultSaisi.nombreVotants || 0;
          totalSuffragesExprimes += resultSaisi.suffragesExprimes || 0;

          for (const rp of resultSaisi.resultPartis) {
            const key = rp.parti.sigle;
            if (!partiVoix[key]) {
              partiVoix[key] = {
                partiSigle: rp.parti.sigle,
                partiNom: rp.parti.nom,
                voix: 0
              };
            }
            partiVoix[key].voix += rp.voix || 0;
          }
        }
      }

      return {
        centreId: centre.id,
        centreNom: centre.nom,
        adresse: centre.adresse,
        quartierNom: centre.quartier.nom,
        arrondissementCode: centre.quartier.arrondissement.code,
        arrondissementNom: centre.quartier.arrondissement.nom,

        nombreInscrits: totalInscrits,
        nombreVotants: totalVotants,
        tauxParticipation: totalInscrits > 0
          ? Number(((totalVotants / totalInscrits) * 100).toFixed(2))
          : 0,

        suffragesExprimes: totalSuffragesExprimes,

        resultatPartis: Object.values(partiVoix).map(p => ({
          partiSigle: p.partiSigle,
          partiNom: p.partiNom,
          voix: p.voix,
          pourcentage: totalSuffragesExprimes > 0
            ? Number(((p.voix / totalSuffragesExprimes) * 100).toFixed(2))
            : 0
        })).sort((a, b) => b.voix - a.voix),

        nombrePostes: centre.postesDeVote.length,
        nombrePostesAvecResultats: postesAvecResultats,
        tauxCompletion: centre.postesDeVote.length > 0
          ? Number(((postesAvecResultats / centre.postesDeVote.length) * 100).toFixed(2))
          : 0
      };
    });
  }

  /**
   * Récupère le résumé national
   */
  async getResumeNational(electionId) {
    const resultats = await prisma.resultSaisi.findMany({
      where: { electionId, status: 'COMPLETEE' },
      include: {
        resultPartis: {
          include: { parti: true }
        }
      }
    });

    let totalInscrits = 0;
    let totalVotants = 0;
    let totalSuffragesExprimes = 0;
    const partiVoix = {};

    for (const r of resultats) {
      totalInscrits += r.nombreInscrits || 0;
      totalVotants += r.nombreVotants || 0;
      totalSuffragesExprimes += r.suffragesExprimes || 0;

      for (const rp of r.resultPartis) {
        const key = rp.parti.sigle;
        if (!partiVoix[key]) {
          partiVoix[key] = {
            partiSigle: rp.parti.sigle,
            partiNom: rp.parti.nom,
            voix: 0
          };
        }
        partiVoix[key].voix += rp.voix || 0;
      }
    }

    const totalPostes = await prisma.posteDeVote.count();
    const postesAvecResultats = await prisma.resultSaisi.count({
      where: { electionId, status: 'COMPLETEE' }
    });

    return {
      totalInscritsNational: totalInscrits,
      totalVotantsNational: totalVotants,
      tauxParticipationNational: totalInscrits > 0
        ? Number(((totalVotants / totalInscrits) * 100).toFixed(2))
        : 0,

      totalSuffragesExprimes: totalSuffragesExprimes,

      resultatPartisNational: Object.values(partiVoix).map(p => ({
        partiSigle: p.partiSigle,
        partiNom: p.partiNom,
        voix: p.voix,
        pourcentage: totalSuffragesExprimes > 0
          ? Number(((p.voix / totalSuffragesExprimes) * 100).toFixed(2))
          : 0
      })).sort((a, b) => b.voix - a.voix),

      totalPostes,
      postesAvecResultats,
      tauxCompletionNational: totalPostes > 0
        ? Number(((postesAvecResultats / totalPostes) * 100).toFixed(2))
        : 0
    };
  }

  /**
   * Récupère toutes les stats consolidées pour une élection
   */
  async getAllStats(electionId) {
    const election = await prisma.election.findUnique({
      where: { id: electionId }
    });

    if (!election) {
      throw new Error('Élection non trouvée');
    }

    const [parCommune, parArrondissement, parCentreDeVote, resume] = await Promise.all([
      this.getStatsByCommune(electionId),
      this.getStatsByArrondissement(electionId),
      this.getStatsByCentreDeVote(electionId),
      this.getResumeNational(electionId)
    ]);

    return {
      electionId,
      type: election.type,
      dateVote: election.dateVote,
      
      stats: {
        parCommune,
        parArrondissement,
        parCentreDeVote
      },
      
      resume
    };
  }
}

module.exports = new ElectionStatsService();
