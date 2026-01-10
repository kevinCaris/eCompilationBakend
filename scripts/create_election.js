const prisma = require('../src/config/database');

async function main() {
  // Créer une élection de test si elle n'existe pas
  const election = await prisma.election.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (election) {
    console.log('ELECTION_EXISTS:', election);
    await prisma.$disconnect();
    return;
  }

  // Créer un admin pour être le créateur
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@mairie.bj',
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN'
      }
    });
  }

  const newElection = await prisma.election.create({
    data: {
      type: 'LEGISLATIVE',
      dateVote: new Date('2026-04-15'),
      createdBy: admin.id
    }
  });

  console.log('ELECTION_CREATED:', newElection);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
