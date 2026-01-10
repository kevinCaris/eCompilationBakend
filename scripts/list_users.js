const prisma = require('../src/config/database');

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log('USERS:', users);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
