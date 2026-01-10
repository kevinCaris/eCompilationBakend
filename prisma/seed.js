const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// DONNÉES GÉOGRAPHIQUES DU BÉNIN

const departementsData = [
  { code: 'ALI', nom: 'Alibori' },
  { code: 'ATA', nom: 'Atacora' },
  { code: 'ATL', nom: 'Atlantique' },
  { code: 'BOR', nom: 'Borgou' },
  { code: 'COL', nom: 'Collines' },
  { code: 'COU', nom: 'Couffo' },
  { code: 'DON', nom: 'Donga' },
  { code: 'LIT', nom: 'Littoral' },
  { code: 'MON', nom: 'Mono' },
  { code: 'OUE', nom: 'Ouémé' },
  { code: 'PLA', nom: 'Plateau' },
  { code: 'ZOU', nom: 'Zou' },
];

const communesData = {
  'ALI': [
    { code: 'BAI', nom: 'Banikoara' },
    { code: 'GOG', nom: 'Gogounou' },
    { code: 'KAN', nom: 'Kandi' },
    { code: 'KAR', nom: 'Karimama' },
    { code: 'MAL', nom: 'Malanville' },
    { code: 'SEG', nom: 'Ségbana' },
  ],
  'ATA': [
    { code: 'BOU', nom: 'Boukoumbé' },
    { code: 'COB', nom: 'Cobly' },
    { code: 'KOU', nom: 'Kérou' },
    { code: 'KOF', nom: 'Kouandé' },
    { code: 'MAT', nom: 'Matéri' },
    { code: 'NAT', nom: 'Natitingou' },
    { code: 'PEH', nom: 'Péhunco' },
    { code: 'TAN', nom: 'Tanguiéta' },
    { code: 'TOC', nom: 'Toucountouna' },
  ],
  'ATL': [
    { code: 'ABK', nom: 'Abomey-Calavi' },
    { code: 'ALL', nom: 'Allada' },
    { code: 'KPO', nom: 'Kpomassè' },
    { code: 'OUI', nom: 'Ouidah' },
    { code: 'SOA', nom: 'Sô-Ava' },
    { code: 'TOR', nom: 'Toffo' },
    { code: 'TOR', nom: 'Tori-Bossito' },
    { code: 'ZEV', nom: 'Zè' },
  ],
  'BOR': [
    { code: 'BEM', nom: 'Bembèrèkè' },
    { code: 'KAL', nom: 'Kalalé' },
    { code: 'NDL', nom: 'N\'Dali' },
    { code: 'NIK', nom: 'Nikki' },
    { code: 'PAR', nom: 'Parakou' },
    { code: 'PER', nom: 'Pèrèrè' },
    { code: 'SIN', nom: 'Sinendé' },
    { code: 'TCH', nom: 'Tchaourou' },
  ],
  'COL': [
    { code: 'BAN', nom: 'Bantè' },
    { code: 'DAL', nom: 'Dassa-Zoumè' },
    { code: 'GLA', nom: 'Glazoué' },
    { code: 'OUE', nom: 'Ouèssè' },
    { code: 'SAV', nom: 'Savalou' },
    { code: 'SAT', nom: 'Savè' },
  ],
  'COU': [
    { code: 'APA', nom: 'Aplahoué' },
    { code: 'DJA', nom: 'Djakotomey' },
    { code: 'DOG', nom: 'Dogbo' },
    { code: 'KLO', nom: 'Klouékanmè' },
    { code: 'LAN', nom: 'Lalo' },
    { code: 'TOU', nom: 'Toviklin' },
  ],
  'DON': [
    { code: 'BAS', nom: 'Bassila' },
    { code: 'COP', nom: 'Copargo' },
    { code: 'DJO', nom: 'Djougou' },
    { code: 'OUA', nom: 'Ouaké' },
  ],
  'LIT': [
    { code: 'COT', nom: 'Cotonou' },
  ],
  'MON': [
    { code: 'ATH', nom: 'Athiémé' },
    { code: 'BOP', nom: 'Bopa' },
    { code: 'COM', nom: 'Comè' },
    { code: 'GRN', nom: 'Grand-Popo' },
    { code: 'HOU', nom: 'Houéyogbé' },
    { code: 'LOK', nom: 'Lokossa' },
  ],
  'OUE': [
    { code: 'ADJ', nom: 'Adjarra' },
    { code: 'ADH', nom: 'Adjohoun' },
    { code: 'AKP', nom: 'Akpro-Missérété' },
    { code: 'AVO', nom: 'Avrankou' },
    { code: 'BON', nom: 'Bonou' },
    { code: 'DAN', nom: 'Dangbo' },
    { code: 'PNO', nom: 'Porto-Novo' },
    { code: 'SEM', nom: 'Sèmè-Podji' },
  ],
  'PLA': [
    { code: 'ADK', nom: 'Adja-Ouèrè' },
    { code: 'IFA', nom: 'Ifangni' },
    { code: 'KET', nom: 'Kétou' },
    { code: 'POB', nom: 'Pobè' },
    { code: 'SAK', nom: 'Sakété' },
  ],
  'ZOU': [
    { code: 'ABO', nom: 'Abomey' },
    { code: 'AGD', nom: 'Agbangnizoun' },
    { code: 'BOH', nom: 'Bohicon' },
    { code: 'COV', nom: 'Covè' },
    { code: 'DJI', nom: 'Djidja' },
    { code: 'OUA', nom: 'Ouinhi' },
    { code: 'ZAK', nom: 'Za-Kpota' },
    { code: 'ZAN', nom: 'Zangnanado' },
    { code: 'ZOG', nom: 'Zogbodomey' },
  ],
};

// Structure des circonscriptions par commune
const circonscriptionsData = {
  'COT': [
    { code: '15', nom: '15ème Circonscription' },
    { code: '16', nom: '16ème Circonscription' },
  ],
};

// Arrondissements groupés par circonscription
const arrondissementsByCirconscription = {
  'COT-15': [
    { code: '01', nom: '1er Arrondissement' },
    { code: '02', nom: '2ème Arrondissement' },
    { code: '03', nom: '3ème Arrondissement' },
    { code: '04', nom: '4ème Arrondissement' },
    { code: '05', nom: '5ème Arrondissement' },
    { code: '06', nom: '6ème Arrondissement' },
   
  ],
  'COT-16': [
    { code: '07', nom: '7ème Arrondissement' },
    { code: '08', nom: '8ème Arrondissement' },
    { code: '09', nom: '9ème Arrondissement' },
    { code: '10', nom: '10ème Arrondissement' },
    { code: '11', nom: '11ème Arrondissement' },
    { code: '12', nom: '12ème Arrondissement' },
    { code: '13', nom: '13ème Arrondissement' },
  ],
};

const arrondissementsData = {
  // Cotonou (13 arrondissements)
  'COT': [
    { code: '01', nom: '1er Arrondissement' },
    { code: '02', nom: '2ème Arrondissement' },
    { code: '03', nom: '3ème Arrondissement' },
    { code: '04', nom: '4ème Arrondissement' },
    { code: '05', nom: '5ème Arrondissement' },
    { code: '06', nom: '6ème Arrondissement' },
    { code: '07', nom: '7ème Arrondissement' },
    { code: '08', nom: '8ème Arrondissement' },
    { code: '09', nom: '9ème Arrondissement' },
    { code: '10', nom: '10ème Arrondissement' },
    { code: '11', nom: '11ème Arrondissement' },
    { code: '12', nom: '12ème Arrondissement' },
    { code: '13', nom: '13ème Arrondissement' },
  ],
  // Porto-Novo (5 arrondissements)
  'PNO': [
    { code: '01', nom: '1er Arrondissement' },
    { code: '02', nom: '2ème Arrondissement' },
    { code: '03', nom: '3ème Arrondissement' },
    { code: '04', nom: '4ème Arrondissement' },
    { code: '05', nom: '5ème Arrondissement' },
  ],
  // Parakou (3 arrondissements)
  'PAR': [
    { code: '01', nom: '1er Arrondissement' },
    { code: '02', nom: '2ème Arrondissement' },
    { code: '03', nom: '3ème Arrondissement' },
  ],
  // Abomey-Calavi
  'ABK': [
    { code: '01', nom: 'Abomey-Calavi' },
    { code: '02', nom: 'Akassato' },
    { code: '03', nom: 'Glo-Djigbé' },
    { code: '04', nom: 'Godomey' },
    { code: '05', nom: 'Hêvié' },
    { code: '06', nom: 'Kpanroun' },
    { code: '07', nom: 'Ouèdo' },
    { code: '08', nom: 'Togba' },
    { code: '09', nom: 'Zinvié' },
  ],
  // Bohicon
  'BOH': [
    { code: '01', nom: 'Bohicon I' },
    { code: '02', nom: 'Bohicon II' },
    { code: '03', nom: 'Lissèzoun' },
    { code: '04', nom: 'Passagon' },
    { code: '05', nom: 'Saclo' },
  ],
};

// Quartiers de Cotonou (liste complète par arrondissement)
const quartiersData = {
  // 1er Arrondissement
  'COT-01': [
    { code: 'PLA', nom: 'Placodji' },
    { code: 'AVO', nom: 'Avotrou' },
    { code: 'TOW', nom: 'Towéta' },
    { code: 'YAG', nom: 'Yagbé' },
    { code: 'ENB', nom: 'Enagnon' },
    { code: 'XWL', nom: 'Xwlacodji' },
  ],
  // 2ème Arrondissement
  'COT-02': [
    { code: 'ZON', nom: 'Zongo' },
    { code: 'MIS', nom: 'Missèbo' },
    { code: 'AYI', nom: 'Ayiloussa' },
    { code: 'BOD', nom: 'Bodjrèko' },
    { code: 'JEG', nom: 'Jégoun' },
    { code: 'GBT', nom: 'Gbéto' },
  ],
  // 3ème Arrondissement
  'COT-03': [
    { code: 'CAD', nom: 'Cadjèhoun' },
    { code: 'HAI', nom: 'Haie Vive' },
    { code: 'AKO', nom: 'Akowondjè' },
    { code: 'DJO', nom: 'Djomèhountin' },
    { code: 'GBE', nom: 'Gbégamey' },
    { code: 'HON', nom: 'Hountonou' },
  ],
  // 4ème Arrondissement
  'COT-04': [
    { code: 'STM', nom: 'Sainte-Michel' },
    { code: 'FIF', nom: 'Fifadji' },
    { code: 'ADE', nom: 'Adeyi' },
    { code: 'AKP', nom: 'Akpakpa' },
    { code: 'VOD', nom: 'Vodje' },
    { code: 'SIK', nom: 'Sikècodji' },
  ],
  // 5ème Arrondissement
  'COT-05': [
    { code: 'KIN', nom: 'Kindonou' },
    { code: 'ZOG', nom: 'Zogbo' },
    { code: 'TAG', nom: 'Tankpè' },
    { code: 'GOD', nom: 'Godomey' },
    { code: 'GBN', nom: 'Gbènadjè' },
    { code: 'COK', nom: 'Cococodji' },
  ],
  // 6ème Arrondissement
  'COT-06': [
    { code: 'MED', nom: 'Mèdédjin' },
    { code: 'HOH', nom: 'Houéyiho' },
    { code: 'KOG', nom: 'Kpogban' },
    { code: 'AGO', nom: 'Agontikon' },
    { code: 'AGG', nom: 'Agla' },
    { code: 'FIG', nom: 'Fignonhou' },
  ],
  // 7ème Arrondissement
  'COT-07': [
    { code: 'GAN', nom: 'Ganhi' },
    { code: 'JON', nom: 'Jonquet' },
    { code: 'VED', nom: 'Vedoko' },
    { code: 'STC', nom: 'Ste-Cécile' },
    { code: 'YEN', nom: 'Yénawa' },
    { code: 'LOZ', nom: 'Lozinkpacodji' },
  ],
  // 8ème Arrondissement
  'COT-08': [
    { code: 'VON', nom: 'Vossa' },
    { code: 'AGK', nom: 'Agbokou' },
    { code: 'WAT', nom: 'Wlacodji' },
    { code: 'KPK', nom: 'Kpankpan' },
    { code: 'LAD', nom: 'Ladji' },
    { code: 'AGT', nom: 'Agatogbo' },
  ],
  // 9ème Arrondissement
  'COT-09': [
    { code: 'AKD', nom: 'Akpakpa-Dodomè' },
    { code: 'AGD', nom: 'Agbodjèdo' },
    { code: 'AKC', nom: 'Akpakpa-Centre' },
    { code: 'SEB', nom: 'Sènadé' },
    { code: 'KPB', nom: 'Kpota' },
    { code: 'YKP', nom: 'Yéyivinkpè' },
  ],
  // 10ème Arrondissement
  'COT-10': [
    { code: 'STA', nom: 'Sainte-Rita' },
    { code: 'CHM', nom: 'Camp Guézo' },
    { code: 'JAC', nom: 'Jacquot' },
    { code: 'ZOG', nom: 'Zogbohouè' },
    { code: 'AYE', nom: 'Ayélawadjè' },
    { code: 'TOT', nom: 'Tokplégbé' },
  ],
  // 11ème Arrondissement
  'COT-11': [
    { code: 'AGP', nom: 'Agla-Pahou' },
    { code: 'SIB', nom: 'Sibomey' },
    { code: 'ATT', nom: 'Attiègou' },
    { code: 'JAQ', nom: 'Jaquin-Agla' },
    { code: 'CDL', nom: 'Cocotalénou' },
    { code: 'AGL', nom: 'Agla' },
  ],
  // 12ème Arrondissement
  'COT-12': [
    { code: 'CAL', nom: 'Calavi' },
    { code: 'FIK', nom: 'Fidjrossè-Kpota' },
    { code: 'FIP', nom: 'Fidjrossè-Plage' },
    { code: 'FIC', nom: 'Fidjrossè-Centre' },
    { code: 'MIR', nom: 'Miriacodji' },
    { code: 'KON', nom: 'Koumassè' },
  ],
  // 13ème Arrondissement
  'COT-13': [
    { code: 'PLA', nom: 'Placodji-Avlékété' },
    { code: 'TOK', nom: 'Tokpa-Hoho' },
    { code: 'HAG', nom: 'Hlagba' },
    { code: 'AKO', nom: 'Akonabè' },
    { code: 'DID', nom: 'Djidjè' },
    { code: 'TON', nom: 'Tonato' },
  ],
};

async function main() {
  console.log(' Début du seeding des données géographiques...');

  // 1. Créer les départements
  console.log('Création des départements...');
  const departements = {};
  for (const dept of departementsData) {
    const created = await prisma.departement.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    departements[dept.code] = created;
    console.log(`  Département: ${dept.nom}`);
  }

  // 2. Créer les communes
  console.log('Création des communes...');
  const communes = {};
  for (const [deptCode, communesList] of Object.entries(communesData)) {
    const departement = departements[deptCode];
    for (const commune of communesList) {
      try {
        const created = await prisma.commune.upsert({
          where: {
            departementId_code: {
              departementId: departement.id,
              code: commune.code,
            },
          },
          update: {},
          create: {
            ...commune,
            departementId: departement.id,
          },
        });
        communes[commune.code] = created;
        console.log(`  Commune: ${commune.nom} (${deptCode})`);
      } catch (error) {
        console.log(`   Commune ${commune.nom} ignorée (doublon possible)`);
      }
    }
  }

  // 3. Créer les circonscriptions et arrondissements
  console.log('Création des circonscriptions et arrondissements...');
  const circonscriptions = {};
  const arrondissements = {};
  
  for (const [communeCode, arrList] of Object.entries(arrondissementsData)) {
    const commune = communes[communeCode];
    if (!commune) {
      console.log(`   Commune ${communeCode} non trouvée, arrondissements ignorés`);
      continue;
    }
    
    // Vérifier si cette commune a plusieurs circonscriptions définies
    const circData = circonscriptionsData[communeCode];
    
    if (circData && circData.length > 0) {
      // Créer les circonscriptions spécifiées
      for (const circ of circData) {
        const circonscription = await prisma.circonscription.upsert({
          where: {
            communeId_code: {
              communeId: commune.id,
              code: circ.code,
            },
          },
          update: {},
          create: {
            code: circ.code,
            nom: circ.nom,
            communeId: commune.id,
          },
        });
        circonscriptions[`${communeCode}-${circ.code}`] = circonscription;
        console.log(`  Circonscription: ${circonscription.nom}`);
        
        // Créer les arrondissements pour cette circonscription
        const circKey = `${communeCode}-${circ.code}`;
        const arrondissementsForCirc = arrondissementsByCirconscription[circKey] || [];
        
        for (const arr of arrondissementsForCirc) {
          const created = await prisma.arrondissement.upsert({
            where: {
              circonscriptionId_code: {
                circonscriptionId: circonscription.id,
                code: arr.code,
              },
            },
            update: {},
            create: {
              ...arr,
              circonscriptionId: circonscription.id,
            },
          });
          arrondissements[`${communeCode}-${arr.code}`] = created;
          console.log(`    Arrondissement: ${arr.nom}`);
        }
      }
    } else {
      // Créer une circonscription par défaut (code '01') pour les autres communes
      const circonscription = await prisma.circonscription.upsert({
        where: {
          communeId_code: {
            communeId: commune.id,
            code: '01',
          },
        },
        update: {},
        create: {
          code: '01',
          nom: `Circonscription de ${commune.nom}`,
          communeId: commune.id,
        },
      });
      circonscriptions[`${communeCode}-01`] = circonscription;
      console.log(`  Circonscription: ${circonscription.nom}`);
      
      // Créer tous les arrondissements sous cette circonscription
      for (const arr of arrList) {
        const created = await prisma.arrondissement.upsert({
          where: {
            circonscriptionId_code: {
              circonscriptionId: circonscription.id,
              code: arr.code,
            },
          },
          update: {},
          create: {
            ...arr,
            circonscriptionId: circonscription.id,
          },
        });
        arrondissements[`${communeCode}-${arr.code}`] = created;
        console.log(`    Arrondissement: ${arr.nom}`);
      }
    }
  }

  // 4. Créer les quartiers
  console.log('Création des quartiers...');
  for (const [arrKey, quartiersList] of Object.entries(quartiersData)) {
    const arrondissement = arrondissements[arrKey];
    if (!arrondissement) {
      console.log(`   Arrondissement ${arrKey} non trouvé, quartiers ignorés`);
      continue;
    }
    for (const quartier of quartiersList) {
      await prisma.quartier.upsert({
        where: {
          arrondissementId_code: {
            arrondissementId: arrondissement.id,
            code: quartier.code,
          },
        },
        update: {},
        create: {
          ...quartier,
          arrondissementId: arrondissement.id,
        },
      });
      console.log(`  Quartier: ${quartier.nom} (${arrKey})`);
    }
  }


  console.log('\n=== Création des utilisateurs ===');
  // Admin Principal de la Mairie
  const adminPrincipal = await prisma.user.upsert({
    where: { email: 'admin.mairie@ecompilation.com' },
    update: {},
    create: {
      email: 'admin.mairie@ecompilation.com',
      firstName: 'Ismaël',
      lastName: 'Adossou',
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`Admin Principal: ${adminPrincipal.firstName} ${adminPrincipal.lastName}`);

  // Admin secondaires
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin1@mairie.bj' },
    update: {},
    create: {
      email: 'admin1@mairie.bj',
      firstName: 'Jean',
      lastName: 'Michel',
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin 1: ${admin1.firstName} ${admin1.lastName}`);

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@mairie.bj' },
    update: {},
    create: {
      email: 'admin2@mairie.bj',
      firstName: 'Marie',
      lastName: 'Sègnon',
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin 2: ${admin2.firstName} ${admin2.lastName}`);

  // Créer des centres de vote de test
  const quartiers = await prisma.quartier.findMany({ take: 5 });
  const centresCreated = [];
  for (let i = 0; i < quartiers.length; i++) {
    const centre = await prisma.centreDeVote.upsert({
      where: { id: `centre-test-${i+1}` },
      update: {},
      create: {
        id: `centre-test-${i+1}`,
        quartierId: quartiers[i].id,
        nom: `Centre de Vote ${i + 1}`,
        adresse: `Adresse Centre ${i + 1}`,
        nombrePostes: 3,
      },
    }).catch(() => null);
    if (centre) centresCreated.push(centre);
  }
  console.log(`✓ ${centresCreated.length} centres de vote créés`);

  // Superviseurs Arrondissements (SA) - pour test
  const arrondissementsForSA = await prisma.arrondissement.findMany({ take: 3 });
  
  for (let i = 0; i < arrondissementsForSA.length; i++) {
    const sa = await prisma.user.upsert({
      where: { email: `sa.arr${i + 1}@mairie.bj` },
      update: {},
      create: {
        email: `sa.arr${i + 1}@mairie.bj`,
        firstName: `Superviseur`,
        lastName: `Arrondissement ${i + 1}`,
        role: 'SA',
        arrondissementId: arrondissementsForSA[i].id,
      },
    });
    console.log(`✓ SA ${i + 1}: ${sa.firstName} ${sa.lastName} - ${arrondissementsForSA[i].nom}`);
  }

  // Agents de centres de vote (AGENT) - pour test
  const centres = await prisma.centreDeVote.findMany({ take: 5 });
  
  for (let i = 0; i < centres.length; i++) {
    const agent = await prisma.user.upsert({
      where: { email: `agent.centre${i + 1}@mairie.bj` },
      update: {},
      create: {
        email: `agent.centre${i + 1}@mairie.bj`,
        firstName: `Agent`,
        lastName: `Centre ${i + 1}`,
        role: 'AGENT',
        centreDeVoteId: centres[i].id,
      },
    });
    console.log(`✓ Agent ${i + 1}: ${agent.firstName} ${agent.lastName} - ${centres[i].nom}`);
  }

  console.log('\nSeeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error(' Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
