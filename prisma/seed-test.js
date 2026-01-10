const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Début du seeding de test...\n');

    // ============ NETTOYAGE ============
    console.log('🧹 Nettoyage de la base de données...');
    await prisma.auditLog.deleteMany();
    await prisma.resultatParti.deleteMany();
    await prisma.resultSaisi.deleteMany();
    await prisma.compilation.deleteMany();
    await prisma.recapitulatifElectoral.deleteMany();
    await prisma.parti.deleteMany();
    await prisma.election.deleteMany();
    await prisma.emailVerificationCode.deleteMany();
    await prisma.user.deleteMany();
    await prisma.posteDeVote.deleteMany();
    await prisma.centreDeVote.deleteMany();
    await prisma.quartier.deleteMany();
    await prisma.arrondissement.deleteMany();
    await prisma.circonscription.deleteMany();
    await prisma.commune.deleteMany();
    await prisma.departement.deleteMany();
    console.log('✅ Base nettoyée\n');

    // ============ GÉOGRAPHIE ============
    console.log('🗺️ Création de la géographie...');
    
    const departement = await prisma.departement.create({
        data: {
            code: 'ATL',
            nom: 'Atlantique'
        }
    });

    const commune = await prisma.commune.create({
        data: {
            departementId: departement.id,
            code: 'ABY',
            nom: 'Abomey-Calavi'
        }
    });

    const circonscription = await prisma.circonscription.create({
        data: {
            communeId: commune.id,
            code: 'C01',
            nom: 'Circonscription 1'
        }
    });

    const arrondissement = await prisma.arrondissement.create({
        data: {
            circonscriptionId: circonscription.id,
            code: 'ARR01',
            nom: 'Godomey',
            population: 150000
        }
    });

    const quartier = await prisma.quartier.create({
        data: {
            arrondissementId: arrondissement.id,
            code: 'Q01',
            nom: 'Quartier Togoudo'
        }
    });

    console.log('✅ Géographie créée\n');

    // ============ CENTRES ET POSTES DE VOTE ============
    console.log('🏫 Création des centres et postes de vote...');

    const centre1 = await prisma.centreDeVote.create({
        data: {
            quartierId: quartier.id,
            nom: 'EPP Togoudo A',
            adresse: 'Rue principale Togoudo',
            nombrePostes: 3
        }
    });

    const centre2 = await prisma.centreDeVote.create({
        data: {
            quartierId: quartier.id,
            nom: 'EPP Togoudo B',
            adresse: 'Rue secondaire Togoudo',
            nombrePostes: 2
        }
    });

    // Postes pour centre 1
    const poste1_1 = await prisma.posteDeVote.create({
        data: { centreDeVoteId: centre1.id, numero: 1, libelle: 'Poste 1' }
    });
    const poste1_2 = await prisma.posteDeVote.create({
        data: { centreDeVoteId: centre1.id, numero: 2, libelle: 'Poste 2' }
    });
    const poste1_3 = await prisma.posteDeVote.create({
        data: { centreDeVoteId: centre1.id, numero: 3, libelle: 'Poste 3' }
    });

    // Postes pour centre 2
    const poste2_1 = await prisma.posteDeVote.create({
        data: { centreDeVoteId: centre2.id, numero: 1, libelle: 'Poste 1' }
    });
    const poste2_2 = await prisma.posteDeVote.create({
        data: { centreDeVoteId: centre2.id, numero: 2, libelle: 'Poste 2' }
    });

    console.log('✅ Centres et postes créés\n');

    // ============ UTILISATEURS ============
    console.log('👥 Création des utilisateurs...');

    const superAdmin = await prisma.user.create({
        data: {
            email: 'superadmin@mairie.bj',
            firstName: 'Super',
            lastName: 'Administrateur',
            telephone: '+22990000001',
            role: 'SUPER_ADMIN',
            arrondissementId: arrondissement.id
        }
    });

    const admin = await prisma.user.create({
        data: {
            email: 'admin@mairie.bj',
            firstName: 'Jean',
            lastName: 'Admin',
            telephone: '+22990000002',
            role: 'ADMIN',
            arrondissementId: arrondissement.id
        }
    });

    const ca1 = await prisma.user.create({
        data: {
            email: 'ca1@mairie.bj',
            firstName: 'Pierre',
            lastName: 'Superviseur',
            telephone: '+22990000003',
            role: 'SA',
            arrondissementId: arrondissement.id,
            centreDeVoteId: centre1.id
        }
    });

    const ca2 = await prisma.user.create({
        data: {
            email: 'ca2@mairie.bj',
            firstName: 'Marie',
            lastName: 'Superviseur',
            telephone: '+22990000004',
            role: 'SA',
            arrondissementId: arrondissement.id,
            centreDeVoteId: centre2.id
        }
    });

    const agent = await prisma.user.create({
        data: {
            email: 'agent@mairie.bj',
            firstName: 'Paul',
            lastName: 'Agent',
            telephone: '+22990000005',
            role: 'AGENT',
            arrondissementId: arrondissement.id
        }
    });

    console.log('✅ Utilisateurs créés\n');

    // ============ ÉLECTION ============
    console.log('🗳️ Création de l\'élection et partis...');

    const election = await prisma.election.create({
        data: {
            type: 'COMMUNALES',
            dateVote: new Date('2026-01-15'),
            createdBy: superAdmin.id
        }
    });

    const parti1 = await prisma.parti.create({
        data: {
            electionId: election.id,
            nom: 'Union Progressiste',
            sigle: 'UP'
        }
    });

    const parti2 = await prisma.parti.create({
        data: {
            electionId: election.id,
            nom: 'Bloc Républicain',
            sigle: 'BR'
        }
    });

    const parti3 = await prisma.parti.create({
        data: {
            electionId: election.id,
            nom: 'Force Cauris',
            sigle: 'FC'
        }
    });

    console.log('✅ Élection et partis créés\n');

    // ============ RÉSULTATS SAISIS (pour Centre 1) ============
    console.log('📝 Création des résultats saisis pour Centre 1...');

    // Poste 1 - Complet (prêt pour validation)
    const result1 = await prisma.resultSaisi.create({
        data: {
            electionId: election.id,
            centreDeVoteId: centre1.id,
            posteDeVoteId: poste1_1.id,
            saId: ca1.id,
            dateOuverture: new Date('2026-01-15T07:00:00'),
            dateFermeture: new Date('2026-01-15T18:00:00'),
            nombreInscrits: 500,
            nombreVotants: 420,
            suffragesExprimes: 400,
            abstentions: 80,
            tauxParticipation: 84,
            status: 'COMPLETEE'
        }
    });

    await prisma.resultatParti.createMany({
        data: [
            { resultSaisiId: result1.id, partiId: parti1.id, voix: 180 },
            { resultSaisiId: result1.id, partiId: parti2.id, voix: 150 },
            { resultSaisiId: result1.id, partiId: parti3.id, voix: 70 }
        ]
    });

    // Poste 2 - Complet (prêt pour validation)
    const result2 = await prisma.resultSaisi.create({
        data: {
            electionId: election.id,
            centreDeVoteId: centre1.id,
            posteDeVoteId: poste1_2.id,
            saId: ca1.id,
            dateOuverture: new Date('2026-01-15T07:00:00'),
            dateFermeture: new Date('2026-01-15T18:00:00'),
            nombreInscrits: 480,
            nombreVotants: 390,
            suffragesExprimes: 380,
            abstentions: 90,
            tauxParticipation: 81.25,
            status: 'COMPLETEE'
        }
    });

    await prisma.resultatParti.createMany({
        data: [
            { resultSaisiId: result2.id, partiId: parti1.id, voix: 160 },
            { resultSaisiId: result2.id, partiId: parti2.id, voix: 140 },
            { resultSaisiId: result2.id, partiId: parti3.id, voix: 80 }
        ]
    });

    // Poste 3 - Avec erreur volontaire (pour tester le rejet)
    const result3 = await prisma.resultSaisi.create({
        data: {
            electionId: election.id,
            centreDeVoteId: centre1.id,
            posteDeVoteId: poste1_3.id,
            saId: ca1.id,
            dateOuverture: new Date('2026-01-15T07:00:00'),
            dateFermeture: new Date('2026-01-15T18:00:00'),
            nombreInscrits: 520,
            nombreVotants: 450,
            suffragesExprimes: 999, // ERREUR VOLONTAIRE
            abstentions: 70,
            tauxParticipation: 86.5,
            status: 'COMPLETEE'
        }
    });

    await prisma.resultatParti.createMany({
        data: [
            { resultSaisiId: result3.id, partiId: parti1.id, voix: 200 },
            { resultSaisiId: result3.id, partiId: parti2.id, voix: 180 },
            { resultSaisiId: result3.id, partiId: parti3.id, voix: 50 }
        ]
    });

    console.log('✅ Résultats Centre 1 créés (3 postes)\n');

    // ============ COMPILATION CENTRE 1 ============
    console.log('📸 Création de la compilation pour Centre 1...');

    const compilation1 = await prisma.compilation.create({
        data: {
            electionId: election.id,
            centreDeVoteId: centre1.id,
            agentId: ca1.id,
            urlPhoto: 'https://example.com/photos/centre1_pv.jpg',
            status: 'EN_COURS'
        }
    });

    console.log('✅ Compilation Centre 1 créée\n');

    // ============ RÉSULTATS CENTRE 2 (partiellement saisis) ============
    console.log('📝 Création des résultats pour Centre 2 (partiel)...');

    const result4 = await prisma.resultSaisi.create({
        data: {
            electionId: election.id,
            centreDeVoteId: centre2.id,
            posteDeVoteId: poste2_1.id,
            saId: ca2.id,
            dateOuverture: new Date('2026-01-15T07:00:00'),
            dateFermeture: new Date('2026-01-15T18:00:00'),
            nombreInscrits: 400,
            nombreVotants: 320,
            suffragesExprimes: 310,
            abstentions: 80,
            tauxParticipation: 80,
            status: 'COMPLETEE'
        }
    });

    await prisma.resultatParti.createMany({
        data: [
            { resultSaisiId: result4.id, partiId: parti1.id, voix: 130 },
            { resultSaisiId: result4.id, partiId: parti2.id, voix: 120 },
            { resultSaisiId: result4.id, partiId: parti3.id, voix: 60 }
        ]
    });

    // Poste 2 du centre 2 - pas encore saisi (pour tester saisie)

    console.log('✅ Résultats Centre 2 créés (1/2 postes)\n');

    // ============ RÉSUMÉ ============
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    📋 RÉSUMÉ DU SEEDING                        ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('👥 UTILISATEURS DE TEST:');
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│ Rôle         │ Email                  │ Centre assigné      │');
    console.log('├────────────────────────────────────────────────────────────┤');
    console.log('│ SUPER_ADMIN  │ superadmin@mairie.bj   │ -                   │');
    console.log('│ ADMIN        │ admin@mairie.bj        │ -                   │');
    console.log('│ SA (CA)      │ ca1@mairie.bj          │ EPP Togoudo A       │');
    console.log('│ SA (CA)      │ ca2@mairie.bj          │ EPP Togoudo B       │');
    console.log('│ AGENT        │ agent@mairie.bj        │ -                   │');
    console.log('└────────────────────────────────────────────────────────────┘\n');

    console.log('🗳️ ÉLECTION:');
    console.log(`   Type: COMMUNALES`);
    console.log(`   Date: 15 janvier 2026`);
    console.log(`   ID: ${election.id}\n`);

    console.log('🏫 CENTRES DE VOTE:');
    console.log(`   1. EPP Togoudo A (ID: ${centre1.id})`);
    console.log(`      - 3 postes saisis, compilation EN_COURS`);
    console.log(`      - Poste 3 avec erreur (suffrages=999) pour tester rejet`);
    console.log(`   2. EPP Togoudo B (ID: ${centre2.id})`);
    console.log(`      - 1/2 postes saisis, pas de compilation\n`);

    console.log('📸 COMPILATION:');
    console.log(`   Centre 1 - ID: ${compilation1.id}`);
    console.log(`   Status: EN_COURS\n`);

    console.log('🎯 SCÉNARIOS DE TEST:');
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│ 1. Login avec ca1@mairie.bj → voir ses saisies            │');
    console.log('│ 2. Login avec admin@mairie.bj → voir dashboard            │');
    console.log('│    GET /api/compilations/' + compilation1.id.substring(0,8) + '.../dashboard │');
    console.log('│ 3. Admin valide Poste 1 et 2                               │');
    console.log('│ 4. Admin rejette Poste 3 (erreur suffrages)               │');
    console.log('│ 5. Admin écrit observation globale                        │');
    console.log('│ 6. CA1 voit ses postes rejetés                            │');
    console.log('│ 7. CA1 corrige Poste 3                                    │');
    console.log('│ 8. Admin re-valide → Compilation VALIDEE                  │');
    console.log('│ 9. CA2 saisit Poste 2 manquant du Centre 2                │');
    console.log('│ 10. CA2 crée compilation Centre 2                         │');
    console.log('└────────────────────────────────────────────────────────────┘\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('               ✅ SEEDING TERMINÉ AVEC SUCCÈS!                 ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Afficher les IDs importants pour les tests
    console.log('📌 IDs POUR POSTMAN:');
    console.log(`   Election ID:     ${election.id}`);
    console.log(`   Centre 1 ID:     ${centre1.id}`);
    console.log(`   Centre 2 ID:     ${centre2.id}`);
    console.log(`   Compilation ID:  ${compilation1.id}`);
    console.log(`   Poste 1 (à valider): ${result1.id}`);
    console.log(`   Poste 2 (à valider): ${result2.id}`);
    console.log(`   Poste 3 (à rejeter): ${result3.id}`);
    console.log(`   Poste Centre2 (manquant): ${poste2_2.id}`);
}

main()
    .catch((e) => {
        console.error('❌ Erreur:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
