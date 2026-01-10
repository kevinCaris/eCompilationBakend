const prisma = require('../src/config/database');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node create_user.js email@example.com');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    console.log('ALREADY_EXISTS', existing);
    await prisma.$disconnect();
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      firstName: 'Test',
      lastName: 'User',
      role: 'AGENT'
    }
  });

  console.log('CREATED', user);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
