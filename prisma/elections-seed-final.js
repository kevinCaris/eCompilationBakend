const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============ DONNÉES ============
const departementsData = [
  { code: 'ALI', nom: 'Alibori' }, { code: 'ATA', nom: 'Atacora' }, { code: 'ATL', nom: 'Atlantique' },
  { code: 'BOR', nom: 'Borgou' }, { code: 'COL', nom: 'Collines' }, { code: 'COU', nom: 'Couffo' },
  { code: 'DON', nom: 'Donga' }, { code: 'LIT', nom: 'Littoral' }, { code: 'MON', nom: 'Mono' },
  { code: 'OUE', nom: 'Ouémé' }, { code: 'PLA', nom: 'Plateau' }, { code: 'ZOU', nom: 'Zou' },
];

const communesData = {
  'ALI': [{ code: 'BAI', nom: 'Banikoara' }, { code: 'KAN', nom: 'Kandi' }, { code: 'KAR', nom: 'Karimama' }, { code: 'MAL', nom: 'Malanville' }, { code: 'SEG', nom: 'Ségbana' }],
  'ATA': [{ code: 'BOU', nom: 'Boukoumbé' }, { code: 'COB', nom: 'Cobly' }, { code: 'KOU', nom: 'Kérou' }, { code: 'KOF', nom: 'Kouandé' }, { code: 'MAT', nom: 'Matéri' }, { code: 'NAT', nom: 'Natitingou' }, { code: 'PEH', nom: 'Péhunco' }, { code: 'TAN', nom: 'Tanguiéta' }, { code: 'TOC', nom: 'Toucountouna' }],
  'ATL': [{ code: 'ABK', nom: 'Abomey-Calavi' }, { code: 'ALL', nom: 'Allada' }, { code: 'KPO', nom: 'Kpomassè' }, { code: 'OUI', nom: 'Ouidah' }, { code: 'SOA', nom: 'Sô-Ava' }, { code: 'TOR', nom: 'Toffo' }, { code: 'TRI', nom: 'Tori-Bossito' }, { code: 'ZEV', nom: 'Zè' }],
  'BOR': [{ code: 'BEM', nom: 'Bembèrèkè' }, { code: 'KAL', nom: 'Kalalé' }, { code: 'NDL', nom: 'N\'Dali' }, { code: 'NIK', nom: 'Nikki' }, { code: 'PAR', nom: 'Parakou' }, { code: 'PER', nom: 'Pèrèrè' }, { code: 'SIN', nom: 'Sinendé' }, { code: 'TCH', nom: 'Tchaourou' }],
  'COL': [{ code: 'BAN', nom: 'Bantè' }, { code: 'DAL', nom: 'Dassa-Zoumé' }, { code: 'GLA', nom: 'Glazoué' }, { code: 'OUE', nom: 'Ouèssè' }, { code: 'SAV', nom: 'Savalou' }, { code: 'SAT', nom: 'Savè' }],
  'COU': [{ code: 'APA', nom: 'Aplahoué' }, { code: 'DJA', nom: 'Djakotomey' }, { code: 'DOG', nom: 'Dogbo' }, { code: 'KLO', nom: 'Klouékanmè' }, { code: 'LAN', nom: 'Lalo' }, { code: 'TOU', nom: 'Toviklin' }],
  'DON': [{ code: 'BAS', nom: 'Bassila' }, { code: 'COP', nom: 'Copargo' }, { code: 'DJO', nom: 'Djougou' }, { code: 'OUA', nom: 'Ouaké' }],
  'LIT': [{ code: 'COT', nom: 'Cotonou' }],
  'MON': [{ code: 'ATH', nom: 'Athiémé' }, { code: 'BOP', nom: 'Bopa' }, { code: 'COM', nom: 'Comè' }, { code: 'GRN', nom: 'Grand-Popo' }, { code: 'HOU', nom: 'Houéyogbé' }, { code: 'LOK', nom: 'Lokossa' }],
  'OUE': [{ code: 'ADJ', nom: 'Adjarra' }, { code: 'ADH', nom: 'Adjohoun' }, { code: 'AGU', nom: 'Aguégués' }, { code: 'AKP', nom: 'Akpro-Missérété' }, { code: 'AVO', nom: 'Avrankou' }, { code: 'BON', nom: 'Bonou' }, { code: 'DAN', nom: 'Dangbo' }, { code: 'PNO', nom: 'Porto-Novo' }, { code: 'SEM', nom: 'Sèmè-Kpodji' }],
  'PLA': [{ code: 'ADK', nom: 'Adja-Ouèrè' }, { code: 'IFA', nom: 'Ifangni' }, { code: 'KET', nom: 'Kétou' }, { code: 'POB', nom: 'Pobè' }, { code: 'SAK', nom: 'Sakété' }],
  'ZOU': [{ code: 'ABO', nom: 'Abomey' }, { code: 'AGD', nom: 'Agbangnizoun' }, { code: 'BOH', nom: 'Bohicon' }, { code: 'COV', nom: 'Covè' }, { code: 'DJI', nom: 'Djidja' }, { code: 'OUA', nom: 'Ouinhi' }, { code: 'ZAK', nom: 'Za-Kpota' }, { code: 'ZAN', nom: 'Zagnanado' }, { code: 'ZOG', nom: 'Zogbodomey' }],
};

const circonscriptionsDataCotonou = [{ code: '15', nom: '15ème Circonscription' }, { code: '16', nom: '16ème Circonscription' }];
const arrondissementsByCirconscription = {
  'COT-15': [{ code: '01', nom: '1er Arrondissement' }, { code: '02', nom: '2ème Arrondissement' }, { code: '03', nom: '3ème Arrondissement' }, { code: '04', nom: '4ème Arrondissement' }, { code: '05', nom: '5ème Arrondissement' }, { code: '06', nom: '6ème Arrondissement' }],
  'COT-16': [{ code: '07', nom: '7ème Arrondissement' }, { code: '08', nom: '8ème Arrondissement' }, { code: '09', nom: '9ème Arrondissement' }, { code: '10', nom: '10ème Arrondissement' }, { code: '11', nom: '11ème Arrondissement' }, { code: '12', nom: '12ème Arrondissement' }, { code: '13', nom: '13ème Arrondissement' }],
};

const partisDataLegislative = [
  { nom: 'Force Cauris pour un Bénin émergent', sigle: 'FCBE' },
  { nom: 'Mouvement des élites engagées pour l\'émancipation du Bénin', sigle: 'Moele-Bénin' },
  { nom: 'Union progressiste le Renouveau', sigle: 'UP-R' },
  { nom: 'Bloc républicain', sigle: 'BR' },
  { nom: 'Les Démocrates', sigle: 'LD' },
];

const partisDataCommunales = [
  { nom: 'Force Cauris pour un Bénin émergent', sigle: 'FCBE' },
  { nom: 'Bloc républicain', sigle: 'BR' },
  { nom: 'Union progressiste le Renouveau', sigle: 'UP-R' },
];

// COTONOU DATA - SIMPLIFIÉ (structure: arr => [quartiers avec centres])
const cotonnouData = require('./cotonou-data.js'); // À créer séparément

async function main() {
  console.log('\nSeeding Bénin Elections (COMPLET)...\n');

  // NETTOYAGE
  console.log('Nettoyage...');
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
  console.log('✓ Base nettoyée\n');

  // GÉOGRAPHIE
  console.log('Géographie...');
  const departements = {};
  for (const dept of departementsData) {
    const d = await prisma.departement.create({ data: dept });
    departements[dept.code] = d;
  }

  const communes = {};
  for (const [deptCode, list] of Object.entries(communesData)) {
    for (const c of list) {
      const comm = await prisma.commune.create({
        data: { ...c, departementId: departements[deptCode].id },
      });
      communes[c.code] = comm;
    }
  }
  console.log(`✓ 12 Depts + 77 Communes`);

  // COTONOU GÉOGRAPHIE
  const communeCotonou = communes['COT'];
  const circonscriptions = {};
  const arrondissements = {};

  for (const circ of circonscriptionsDataCotonou) {
    const c = await prisma.circonscription.create({
      data: { ...circ, communeId: communeCotonou.id },
    });
    circonscriptions[`COT-${circ.code}`] = c;
  }

  for (const [circKey, arrList] of Object.entries(arrondissementsByCirconscription)) {
    const circ = circonscriptions[circKey];
    for (const arr of arrList) {
      const a = await prisma.arrondissement.create({
        data: { ...arr, circonscriptionId: circ.id },
      });
      arrondissements[`COT-${arr.code}`] = a;
    }
  }
  console.log(`✓ Cotonou: 2 Circ + 13 Arr\n`);

  // COTONOU - QUARTIERS, CENTRES, POSTES
  console.log('Cotonou: Quartiers, Centres, Postes...');
  let qCount = 0, cCount = 0, pCount = 0;
  const postesBuffer = [];

  for (const [arrCode, data] of Object.entries(cotonnouData)) {
    const arr = arrondissements[`COT-${arrCode.padStart(2, '0')}`];
    let qIndex = 0;
    
    for (const qData of data) {
      qIndex++;
      const q = await prisma.quartier.create({
        data: {
          nom: qData.q,
          code: `Q${arrCode.padStart(2, '0')}${String(qIndex).padStart(3, '0')}`,
          arrondissementId: arr.id,
        },
      });
      qCount++;

      for (const cData of qData.c) {
        const centre = await prisma.centreDeVote.create({
          data: {
            nom: cData.n,
            adresse: `Cotonou, Arr. ${arrCode}`,
            nombrePostes: cData.p,
            quartierId: q.id,
          },
        });
        cCount++;

        for (let i = 1; i <= cData.p; i++) {
          postesBuffer.push({ numero: i, libelle: `Poste ${i}`, centreDeVoteId: centre.id });
          pCount++;
        }
      }
    }
  }
  
  // Insérer tous les postes en batch
  await prisma.posteDeVote.createMany({ data: postesBuffer });
  console.log(`✓ ${qCount} Quartiers, ${cCount} Centres, ${pCount} Postes\n`);

  // UTILISATEURS
  console.log('Utilisateurs...');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'Jesusoldafrik@gmail.com',
      firstName: 'Olivier',
      lastName: 'TOBOSSI',
      role: 'SUPER_ADMIN',
      telephone: '+229 60 65 04 04',
    },
  });

  // Super admins supplémentaires
  await prisma.user.create({
    data: { email: 'okekristen@gmail.com', firstName: 'Kristen', lastName: 'OKE', role: 'SUPER_ADMIN', telephone: '+229 67 00 00 03' },
  });
  await prisma.user.create({
    data: { email: 'kevinadossou2@gmail.com', firstName: 'Kevin', lastName: 'ADOSSOU', role: 'SUPER_ADMIN', telephone: '+229 67 00 00 04' },
  });
  await prisma.user.create({
    data: { email: 'konnonulrich@gmail.com', firstName: 'Ulrich', lastName: 'KONNON', role: 'SUPER_ADMIN', telephone: '+229 67 00 00 05' },
  });

  // Admin
  await prisma.user.create({
    data: { email: 'donaelielle@gmail.com', firstName: 'Donaelle', lastName: 'ADMIN', role: 'ADMIN', telephone: '+229 67 00 00 06' },
  });
  console.log(`✓ 4 SUPER_ADMIN + 1 ADMIN`);

  // SA Cotonou (13) - Avec vrais noms et prénoms
  const saDataCotonou = [
    { firstName: 'Janvier', lastName: 'BONOU GANGAN', telephone: '+229 97 890915', email: 'jbonougangan@gmail.com' },
    { firstName: 'Etienne Kouassi', lastName: 'ABALO', telephone: '+229 97 09 59 47', email: 'etienneabalo96@gmail.com' },
    { firstName: 'Thierry', lastName: 'AGUENOUDE', telephone: '+229 95 01 20 22', email: 'aguethy@gmail.com' },
    { firstName: 'Tokandji Marius Etienne', lastName: 'AGOUGOU', telephone: '+229 95 340635', email: 'marius.agougouetienne1@gmail.com' },
    { firstName: 'Romaric', lastName: 'ATCHO', telephone: '+229 97 56 26 88', email: 'djehoue09@gmail.com' },
    { firstName: 'Adam', lastName: 'SOULE', telephone: '+229 95 26 27 49', email: 'souleadam897@gmail.com' },
    { firstName: 'Djima Patrice', lastName: 'AMOUSSOU', telephone: '+229 61 527448', email: 'amoussoupatrice1583@gmail.com' },
    { firstName: 'Serge', lastName: 'DOSSOU-YOVO', telephone: '+229 97 24 65 05', email: 'sergedossouyovo2020@gmail.com' },
    { firstName: 'Assiba Yollande Mahugbé', lastName: 'DEHOUI', telephone: '+229 94 02 70 48', email: 'yollandedehoui1980@gmail.com' },
    { firstName: 'Sophie Angèle Akoua', lastName: 'ADJOVI', telephone: '+229 95253652', email: 'sophieadjovi5@gmail.com' },
    { firstName: 'Alain', lastName: 'CHINKOUN', telephone: '+229 40 58 65 59', email: 'chinkalain@gmail.com' },
    { firstName: 'Nonvidé Nicolas Marius', lastName: 'SOSSOU-VOVO', telephone: '+229 95 41 33 01', email: 'msossouvovonicolas@gmail.com' },
    { firstName: 'Oscar', lastName: 'BEHANZIN', telephone: '+229 66 03 25 40', email: 'lamarreceline32@gmail.com' },
  ];

  for (let i = 0; i < saDataCotonou.length; i++) {
    const arr = arrondissements[`COT-${String(i + 1).padStart(2, '0')}`];
    const saData = saDataCotonou[i];
    const email = saData.email || `sa.${saData.lastName.toLowerCase().replace(/\s+/g, '.')}.arr${i + 1}@mairie.bj`;
    await prisma.user.create({
      data: {
        email: email,
        firstName: saData.firstName,
        lastName: saData.lastName,
        role: 'SA',
        telephone: saData.telephone,
        arrondissementId: arr.id,
      },
    });
  }

  // 3 SUPER_ADMIN supplémentaires
  const extraSuperAdmins = [
    { firstName: 'Clément', lastName: 'Ahyi', telephone: '+229 97 00 00 50', email: 'clement.ahyi@gmail.com' },
    { firstName: 'Kamal', lastName: 'Diop', telephone: '+229 97 00 00 51', email: 'kamaldinemoustapha229@gmail.com' },
    { firstName: 'Dokponou', lastName: 'Regina', telephone: '+229 97 00 00 52', email: 'dokponoureginaemmanuella@gmail.com' },
  ];

  for (const adminData of extraSuperAdmins) {
    await prisma.user.create({
      data: {
        email: adminData.email,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: 'SUPER_ADMIN',
        telephone: adminData.telephone,
      },
    });
  }

  // 1 SA supplémentaire (sans arrondissement assigné)
  await prisma.user.create({
    data: {
      email: 'dokponoureginaemma@gmail.com',
      firstName: 'Dokponou Regina',
      lastName: 'Emma',
      role: 'SA',
      telephone: '+229 97 00 00 53',
    },
  });

  // 1 autre SA supplémentaire
  await prisma.user.create({
    data: {
      email: 'emmanuelladokponou@gmail.com',
      firstName: 'Emmanuella',
      lastName: 'DOKPONOU',
      role: 'SA',
      telephone: '+229 97 00 00 54',
    },
  });

  console.log(`✓ 13 SA Cotonou + 2 SA supplémentaires`);
  console.log(`✓ 3 SUPER_ADMIN supplémentaires`);

  // AGENT Cotonou - DÉSACTIVÉ
  // const centres = await prisma.centreDeVote.findMany();
  // const agentsData = centres.map((c, index) => ({
  //   email: `agent.${c.id.substring(0, 8)}@mairie.bj`,
  //   firstName: 'Agent',
  //   lastName: c.nom.substring(0, 30),
  //   role: 'AGENT',
  //   telephone: `+229 67 ${String(index).padStart(2, '0')} ${String(Math.floor(index / 100)).padStart(2, '0')} ${String(index % 100).padStart(2, '0')}`,
  //   centreDeVoteId: c.id,
  // }));
  // 
  // await prisma.user.createMany({ data: agentsData });
  // console.log(`✓ ${agentsData.length} AGENT (1 par centre)\n`);
  console.log(`✓ Agents non créés (désactivé)\n`);

  // ÉLECTIONS
  console.log('Élections...');
  const e1 = await prisma.election.create({
    data: { type: 'COMMUNALES', dateVote: new Date('2026-01-11'), createdBy: superAdmin.id },
  });
  const e2 = await prisma.election.create({
    data: { type: 'LEGISLATIVE', dateVote: new Date('2026-01-11'), createdBy: superAdmin.id },
  });

  // Partis COMMUNALES
  for (const p of partisDataCommunales) {
    await prisma.parti.create({ data: { ...p, electionId: e1.id } });
  }

  // Partis LEGISLATIVE
  for (const p of partisDataLegislative) {
    await prisma.parti.create({ data: { ...p, electionId: e2.id } });
  }

  console.log(`✓ 2 Élections + ${partisDataCommunales.length} Partis COMMUNALES + ${partisDataLegislative.length} Partis LEGISLATIVE\n`);

  console.log('═══════════════════════════════════════════════');
  console.log('              ✓ SEEDING COMPLET!');
  console.log('═══════════════════════════════════════════════');
  console.log(`✓ Quartiers: ${qCount} | Centres: ${cCount} | Postes: ${pCount}`);
  console.log(`✓ Utilisateurs: 7 SUPER_ADMIN + 1 ADMIN + 15 SA`);
  console.log('═══════════════════════════════════════════════\n');
}

main()
  .catch(e => { console.error('Erreur:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());