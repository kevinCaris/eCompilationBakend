const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDemo() {
  console.log('🌱 Démarrage du seed de données de test...\n');

  try {
    // ============ NETTOYAGE DES ENTITÉS LIÉES AUX ÉLECTIONS ============
    console.log('🗑️  Nettoyage des élections et données associées...');
    await prisma.resultatParti.deleteMany({});
    await prisma.resultSaisi.deleteMany({});
    await prisma.compilation.deleteMany({});
    await prisma.recapitulatifElectoral.deleteMany({});
    await prisma.parti.deleteMany({});
    await prisma.election.deleteMany({});
    await prisma.posteDeVote.deleteMany({});
    await prisma.centreDeVote.deleteMany({});
    console.log('✅ Nettoyage terminé\n');

    // ============ RÉCUPÉRATION DES DONNÉES EXISTANTES ============
    console.log('📍 Récupération de la géographie et utilisateurs existants...');
    
    // Récupérer les SA existants
    const saUsers = await prisma.user.findMany({
      where: { role: 'SA' },
      include: { arrondissement: true }
    });

    if (saUsers.length === 0) {
      throw new Error('❌ Aucun utilisateur SA trouvé. Assurez-vous que seed.js a été exécuté d\'abord!');
    }

    console.log(`✅ Trouvé ${saUsers.length} utilisateurs SA\n`);

    // ============ CRÉATION DES ÉLECTIONS ============
    console.log('🗳️  Création des élections...');
    
    const election1 = await prisma.election.create({
      data: {
        type: 'LEGISLATIVE',
        dateVote: new Date('2026-02-22'),
        createdBy: (await prisma.user.findFirst({ where: { role: 'ADMIN' } })).id
      }
    });

    const election2 = await prisma.election.create({
      data: {
        type: 'COMMUNALES',
        dateVote: new Date('2026-03-29'),
        createdBy: (await prisma.user.findFirst({ where: { role: 'ADMIN' } })).id
      }
    });

    console.log('✅ Élections créées\n');

    // ============ CRÉATION DES PARTIS ============
    console.log('🎪 Création des partis...');
    
    const partis = await Promise.all([
      prisma.parti.create({
        data: {
          electionId: election1.id,
          nom: 'Bloc Républicain',
          sigle: 'BR',
          logo: 'logo_br.png'
        }
      }),
      prisma.parti.create({
        data: {
          electionId: election1.id,
          nom: 'Forces Cauris pour un Bénin Émergent',
          sigle: 'FCBE',
          logo: 'logo_fcbe.png'
        }
      }),
      prisma.parti.create({
        data: {
          electionId: election1.id,
          nom: 'Bénin Debout',
          sigle: 'BD',
          logo: 'logo_bd.png'
        }
      }),
      prisma.parti.create({
        data: {
          electionId: election1.id,
          nom: 'Mouvance Patriotique du Bénin',
          sigle: 'MPB',
          logo: 'logo_mpb.png'
        }
      })
    ]);

    console.log(`✅ ${partis.length} partis créés\n`);

    // ============ CRÉATION DES CENTRES ET POSTES DE VOTE ============
    console.log('🏛️  Création des centres et postes de vote...');
    
    let centresCount = 0;
    let postesCount = 0;
    
    for (const sa of saUsers) {
      if (!sa.arrondissementId) continue;
      
      // Récupérer les quartiers du SA
      const quartiers = await prisma.quartier.findMany({
        where: {
          arrondissement: { id: sa.arrondissementId }
        },
        take: 2
      });
      
      for (const quartier of quartiers) {
        // Créer un centre de vote
        const centre = await prisma.centreDeVote.create({
          data: {
            quartierId: quartier.id,
            nom: `Centre de Vote - ${quartier.nom}`,
            adresse: `Adresse ${quartier.nom}`,
            nombrePostes: 3
          }
        });
        centresCount++;
        
        // Créer 3 postes de vote pour ce centre
        for (let i = 1; i <= 3; i++) {
          await prisma.posteDeVote.create({
            data: {
              centreDeVoteId: centre.id,
              numero: i,
              libelle: `Poste ${i} - ${centre.nom}`
            }
          });
          postesCount++;
        }
      }
    }
    
    console.log(`✅ ${centresCount} centres et ${postesCount} postes créés\n`);

    // ...existing code...

    // ============ CRÉATION DES RÉCAPITULATIFS ÉLECTORAUX ============
    console.log('📋 Création des récapitulatifs électoraux...');

    for (const sa of saUsers) {
      if (!sa.arrondissementId) {
        console.warn(`⚠️  SA ${sa.id} n'a pas d'arrondissementId, ignoré.`);
        continue;
      }
      const postesCount = await prisma.posteDeVote.count({
        where: {
          centreDeVote: {
            quartier: {
              arrondissement: {
                is: { id: sa.arrondissementId }
              }
            }
          }
        }
      });

      const centresCount = await prisma.centreDeVote.count({
        where: {
          quartier: {
            arrondissement: {
              is: { id: sa.arrondissementId }
            }
          }
        }
      });

      await prisma.recapitulatifElectoral.create({
        data: {
          electionId: election1.id,
          saId: sa.id,
          nombreElecteurs: Math.floor(Math.random() * (3000 - 1500 + 1)) + 1500,
          nombreCentresDeVote: centresCount || 1,
          nombrePostesDeVote: postesCount || 1
        }
      });
    }

    console.log(`✅ ${saUsers.length} récapitulatifs électoraux créés\n`);

    console.log('✨ Seed de données de test réussi!');
    console.log('\n📊 Résumé des données créées:');
    console.log(`  - 2 Élections (1 Législative, 1 Communale)`);
    console.log(`  - 4 Partis pour l'élection législative`);
    console.log(`  - ${centresCount} Centres de Vote`);
    console.log(`  - ${postesCount} Postes de Vote`);
    console.log(`  - ${saUsers.length} Récapitulatifs Électoraux`);
    console.log('\n✅ Les données sont prêtes pour les tests en Postman!\n');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemo();
