const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createElections() {
  try {
    console.log('\n🔄 Creating elections...\n');

    // Élection législative
    const legislative = await prisma.election.create({
      data: {
        nom: 'Élections Législatives 2024',
        type: 'LEGISLATIVE',
        dateVote: new Date('2024-12-15'),
        dateDeadline: new Date('2024-12-20')
      }
    });
    
    console.log('✅ Élection législative créée:');
    console.log(`   ID: ${legislative.id}`);
    console.log(`   Nom: ${legislative.nom}`);
    console.log(`   Type: ${legislative.type}`);
    console.log('');

    // Élection communale
    const communales = await prisma.election.create({
      data: {
        nom: 'Élections Communales 2024',
        type: 'COMMUNALES',
        dateVote: new Date('2024-11-15'),
        dateDeadline: new Date('2024-11-20')
      }
    });
    
    console.log('✅ Élection communale créée:');
    console.log(`   ID: ${communales.id}`);
    console.log(`   Nom: ${communales.nom}`);
    console.log(`   Type: ${communales.type}`);
    console.log('');
    
    console.log('✅ Toutes les élections ont été créées avec succès!\n');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des élections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createElections();
