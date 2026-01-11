/**
 * SEED POUR COMMUNE DE TEST
 * 
 * Ce script crée une commune de test (Porto-Novo) avec :
 * - 3 arrondissements
 * - Des quartiers
 * - Des centres de vote
 * - Des postes de vote
 * - Des utilisateurs SA (un par arrondissement)
 * 
 * IMPORTANT: Ce script n'affecte PAS les données de Cotonou
 * 
 * Usage: node prisma/seed-test-commune.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============ CONFIGURATION ============
const TEST_COMMUNE = {
  departement: { code: 'OUE', nom: 'Ouémé' },
  commune: { code: 'PNO', nom: 'Porto-Novo' },
  circonscription: { code: '17', nom: '17ème Circonscription (Test)' }
};

// Structure de test: 3 arrondissements avec quartiers, centres et postes
const TEST_DATA = {
  '01': [
    { 
      q: 'Djassin', 
      c: [
        { n: 'EPP DJASSIN CENTRE', p: 4 }, 
        { n: 'CEG DJASSIN', p: 3 }
      ] 
    },
    { 
      q: 'Tokpota', 
      c: [
        { n: 'EPP TOKPOTA', p: 5 },
        { n: 'CENTRE DE SANTE TOKPOTA', p: 2 }
      ] 
    },
    { 
      q: 'Ouando', 
      c: [
        { n: 'COMPLEXE SCOLAIRE OUANDO', p: 6 }
      ] 
    },
  ],
  '02': [
    { 
      q: 'Houinmey', 
      c: [
        { n: 'EPP HOUINMEY', p: 4 }, 
        { n: 'MAISON DES JEUNES HOUINMEY', p: 3 }
      ] 
    },
    { 
      q: 'Zèbè', 
      c: [
        { n: 'EPP ZEBE', p: 5 }
      ] 
    },
    { 
      q: 'Lokpodji', 
      c: [
        { n: 'COMPLEXE SCOLAIRE LOKPODJI', p: 4 },
        { n: 'CENTRE CULTUREL LOKPODJI', p: 2 }
      ] 
    },
  ],
  '03': [
    { 
      q: 'Attakè', 
      c: [
        { n: 'EPP ATTAKE', p: 5 }, 
        { n: 'CEG ATTAKE', p: 4 }
      ] 
    },
    { 
      q: 'Agbokou', 
      c: [
        { n: 'EPP AGBOKOU', p: 3 }
      ] 
    },
    { 
      q: 'Gbozounmey', 
      c: [
        { n: 'COMPLEXE SCOLAIRE GBOZOUNMEY', p: 6 },
        { n: 'ECOLE MATERNELLE GBOZOUNMEY', p: 2 }
      ] 
    },
  ],
};

// Utilisateurs SA de test (un par arrondissement)
const TEST_USERS = [
  { 
    email: 'sa.pno1@test.bj', 
    firstName: 'Amadou', 
    lastName: 'SOKPON', 
    telephone: '22990001001',
    arrondissementCode: '01' 
  },
  { 
    email: 'sa.pno2@test.bj', 
    firstName: 'Fatou', 
    lastName: 'DOSSOU', 
    telephone: '22990001002',
    arrondissementCode: '02' 
  },
  { 
    email: 'sa.pno3@test.bj', 
    firstName: 'Kofi', 
    lastName: 'AHOUNOU', 
    telephone: '22990001003',
    arrondissementCode: '03' 
  },
];

async function seedTestCommune() {
  console.log('🚀 Démarrage du seed pour la commune de test (Porto-Novo)...\n');

  try {
    // ============ ÉTAPE 1: Vérifier/Créer le département ============
    console.log('📍 Étape 1: Création du département...');
    
    let departement = await prisma.departement.findUnique({
      where: { code: TEST_COMMUNE.departement.code }
    });

    if (!departement) {
      departement = await prisma.departement.create({
        data: TEST_COMMUNE.departement
      });
      console.log(`   ✅ Département "${departement.nom}" créé`);
    } else {
      console.log(`   ℹ️  Département "${departement.nom}" existe déjà`);
    }

    // ============ ÉTAPE 2: Vérifier/Créer la commune ============
    console.log('📍 Étape 2: Création de la commune...');
    
    let commune = await prisma.commune.findFirst({
      where: { 
        departementId: departement.id,
        code: TEST_COMMUNE.commune.code 
      }
    });

    if (!commune) {
      commune = await prisma.commune.create({
        data: {
          departementId: departement.id,
          code: TEST_COMMUNE.commune.code,
          nom: TEST_COMMUNE.commune.nom
        }
      });
      console.log(`   ✅ Commune "${commune.nom}" créée`);
    } else {
      console.log(`   ℹ️  Commune "${commune.nom}" existe déjà`);
    }

    // ============ ÉTAPE 3: Créer la circonscription ============
    console.log('📍 Étape 3: Création de la circonscription...');
    
    let circonscription = await prisma.circonscription.findFirst({
      where: { 
        communeId: commune.id,
        code: TEST_COMMUNE.circonscription.code 
      }
    });

    if (!circonscription) {
      circonscription = await prisma.circonscription.create({
        data: {
          communeId: commune.id,
          code: TEST_COMMUNE.circonscription.code,
          nom: TEST_COMMUNE.circonscription.nom
        }
      });
      console.log(`   ✅ Circonscription "${circonscription.nom}" créée`);
    } else {
      console.log(`   ℹ️  Circonscription "${circonscription.nom}" existe déjà`);
    }

    // ============ ÉTAPE 4: Créer les arrondissements, quartiers, centres et postes ============
    console.log('📍 Étape 4: Création des arrondissements et structure électorale...');
    
    const arrondissementsMap = {}; // Pour stocker les arrondissements créés
    
    for (const [arrCode, quartiers] of Object.entries(TEST_DATA)) {
      // Créer l'arrondissement
      const arrNom = arrCode === '01' ? '1er Arrondissement' : `${parseInt(arrCode)}ème Arrondissement`;
      
      let arrondissement = await prisma.arrondissement.findFirst({
        where: { 
          circonscriptionId: circonscription.id,
          code: arrCode 
        }
      });

      if (!arrondissement) {
        arrondissement = await prisma.arrondissement.create({
          data: {
            circonscriptionId: circonscription.id,
            code: arrCode,
            nom: arrNom,
            population: Math.floor(Math.random() * 50000) + 20000
          }
        });
        console.log(`   ✅ Arrondissement "${arrNom}" créé`);
      } else {
        console.log(`   ℹ️  Arrondissement "${arrNom}" existe déjà`);
      }

      arrondissementsMap[arrCode] = arrondissement;

      // Créer les quartiers et centres
      for (const quartierData of quartiers) {
        let quartier = await prisma.quartier.findFirst({
          where: {
            arrondissementId: arrondissement.id,
            nom: quartierData.q
          }
        });

        if (!quartier) {
          quartier = await prisma.quartier.create({
            data: {
              arrondissementId: arrondissement.id,
              code: quartierData.q.substring(0, 3).toUpperCase(),
              nom: quartierData.q
            }
          });
          console.log(`      📁 Quartier "${quartierData.q}" créé`);
        }

        // Créer les centres de vote
        for (const centreData of quartierData.c) {
          let centre = await prisma.centreDeVote.findFirst({
            where: {
              quartierId: quartier.id,
              nom: centreData.n
            }
          });

          if (!centre) {
            centre = await prisma.centreDeVote.create({
              data: {
                quartierId: quartier.id,
                nom: centreData.n,
                adresse: `${quartierData.q}, Porto-Novo`,
                nombrePostes: centreData.p
              }
            });
            console.log(`         🏫 Centre "${centreData.n}" créé (${centreData.p} postes)`);

            // Créer les postes de vote
            for (let i = 1; i <= centreData.p; i++) {
              await prisma.posteDeVote.create({
                data: {
                  centreDeVoteId: centre.id,
                  numero: i,
                  libelle: `PV ${String(i).padStart(2, '0')}`
                }
              });
            }
          }
        }
      }
    }

    // ============ ÉTAPE 5: Créer les utilisateurs SA ============
    console.log('\n📍 Étape 5: Création des utilisateurs SA de test...');
    
    for (const userData of TEST_USERS) {
      const arrondissement = arrondissementsMap[userData.arrondissementCode];
      
      if (!arrondissement) {
        console.log(`   ⚠️  Arrondissement ${userData.arrondissementCode} non trouvé pour ${userData.email}`);
        continue;
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        // Récupérer les centres de l'arrondissement (on prendra le premier pour l'assignation)
        const centres = await prisma.centreDeVote.findMany({
          where: {
            quartier: {
              arrondissementId: arrondissement.id
            }
          }
        });

        // Le modèle User a centreDeVoteId (un seul centre), pas de relation many-to-many
        // On assigne le premier centre de l'arrondissement
        const firstCentre = centres.length > 0 ? centres[0] : null;

        await prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            telephone: userData.telephone,
            role: 'SA',
            arrondissementId: arrondissement.id,
            centreDeVoteId: firstCentre?.id || null
          }
        });
        
        console.log(`   ✅ SA "${userData.firstName} ${userData.lastName}" créé`);
        console.log(`      📧 Email: ${userData.email}`);
        console.log(`      🏘️  Arrondissement: ${arrondissement.nom}`);
        console.log(`      🏫 Centres dans l'arrondissement: ${centres.length}`);
      } else {
        console.log(`   ℹ️  Utilisateur "${userData.email}" existe déjà`);
      }
    }

    // ============ ÉTAPE 6: Associer les élections existantes aux partis pour Porto-Novo ============
    console.log('\n📍 Étape 6: Vérification des élections et partis...');
    
    const elections = await prisma.election.findMany({
      where: {
        statut: { in: ['PLANIFIEE', 'EN_COURS'] }
      }
    });

    if (elections.length > 0) {
      console.log(`   ℹ️  ${elections.length} élection(s) active(s) trouvée(s)`);
      for (const election of elections) {
        console.log(`      - ${election.type} (${election.statut})`);
      }
    } else {
      console.log('   ⚠️  Aucune élection active trouvée');
    }

    // ============ RÉSUMÉ ============
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RÉSUMÉ DE LA COMMUNE DE TEST');
    console.log('═'.repeat(60));
    console.log(`📍 Commune: ${TEST_COMMUNE.commune.nom}`);
    console.log(`📍 Département: ${TEST_COMMUNE.departement.nom}`);
    console.log(`📍 Circonscription: ${TEST_COMMUNE.circonscription.nom}`);
    console.log(`📍 Arrondissements: ${Object.keys(TEST_DATA).length}`);
    
    // Compter les totaux
    const totalQuartiers = Object.values(TEST_DATA).flat().length;
    const totalCentres = Object.values(TEST_DATA).flat().reduce((sum, q) => sum + q.c.length, 0);
    const totalPostes = Object.values(TEST_DATA).flat().reduce((sum, q) => 
      sum + q.c.reduce((s, c) => s + c.p, 0), 0);
    
    console.log(`📍 Quartiers: ${totalQuartiers}`);
    console.log(`📍 Centres de vote: ${totalCentres}`);
    console.log(`📍 Postes de vote: ${totalPostes}`);
    console.log(`👥 Utilisateurs SA: ${TEST_USERS.length}`);
    console.log('═'.repeat(60));
    
    console.log('\n🔐 IDENTIFIANTS DE CONNEXION POUR LES TESTS:');
    console.log('─'.repeat(60));
    console.log('   ℹ️  Le système utilise un OTP par email');
    console.log('   ℹ️  Connectez-vous avec l\'email du SA');
    console.log('   ℹ️  Le code OTP sera envoyé à cet email');
    console.log('─'.repeat(60));
    for (const user of TEST_USERS) {
      console.log(`   📧 ${user.email}`);
      console.log(`   🏘️  Arrondissement: ${user.arrondissementCode === '01' ? '1er' : user.arrondissementCode + 'ème'}`);
      console.log('─'.repeat(60));
    }

    console.log('\n✅ Seed de la commune de test terminé avec succès!');
    console.log('💡 Vous pouvez maintenant tester avec ces comptes SA.\n');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le seed
seedTestCommune()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
