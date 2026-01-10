const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkElections() {
  try {
    const elections = await prisma.election.findMany({
      orderBy: { dateVote: 'desc' }
    });
    
    console.log(`\n✅ Total elections found: ${elections.length}\n`);
    
    if (elections.length === 0) {
      console.log('⚠️  No elections found in database!\n');
    } else {
      elections.forEach((election, index) => {
        console.log(`${index + 1}. ${election.nom}`);
        console.log(`   ID: ${election.id}`);
        console.log(`   Type: ${election.type}`);
        console.log(`   Date vote: ${election.dateVote}`);
        console.log(`   Deadline: ${election.dateDeadline}`);
        console.log('');
      });
    }
    
    // Check for each type
    const legislative = await prisma.election.findFirst({
      where: { type: 'LEGISLATIVE' }
    });
    
    const communales = await prisma.election.findFirst({
      where: { type: 'COMMUNALES' }
    });
    
    console.log('Type availability:');
    console.log(`  LEGISLATIVE: ${legislative ? '✅ Available' : '❌ Missing'}`);
    console.log(`  COMMUNALES: ${communales ? '✅ Available' : '❌ Missing'}`);
    
  } catch (error) {
    console.error('Error checking elections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkElections();
