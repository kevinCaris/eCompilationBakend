const prisma = require('../src/config/database');

async function fetchLatest(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return console.log('USER_NOT_FOUND');
  const code = await prisma.emailVerificationCode.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  console.log('LATEST_CODE:', code ? code.code : null);
  console.log('EXPIRES_AT:', code ? code.expiresAt : null);
}

async function expireLatest(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return console.log('USER_NOT_FOUND');
  const code = await prisma.emailVerificationCode.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  if (!code) return console.log('NO_CODE');
  await prisma.emailVerificationCode.update({ where: { id: code.id }, data: { expiresAt: new Date(Date.now() - 60 * 1000) } });
  console.log('EXPIRED');
}

async function markUsed(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return console.log('USER_NOT_FOUND');
  const code = await prisma.emailVerificationCode.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  if (!code) return console.log('NO_CODE');
  await prisma.emailVerificationCode.update({ where: { id: code.id }, data: { used: true } });
  console.log('MARKED_USED');
}

async function main() {
  const cmd = process.argv[2];
  const email = process.argv[3];
  if (!cmd || !email) {
    console.log('Usage: node otp_test.js fetch|expire|markUsed <email>');
    process.exit(1);
  }

  try {
    if (cmd === 'fetch') await fetchLatest(email);
    else if (cmd === 'expire') await expireLatest(email);
    else if (cmd === 'markUsed') await markUsed(email);
    else console.log('Unknown command');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
