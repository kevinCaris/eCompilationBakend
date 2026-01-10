const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAudit() {
  console.log('🔍 Test du système d\'audit\n');
  
  try {
    // 1. Compter les logs actuels
    const countBefore = await prisma.auditLog.count();
    console.log(`📊 Nombre de logs avant test : ${countBefore}`);
    
    // 2. Récupérer les 5 derniers logs
    const recentLogs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { email: true, role: true, firstName: true, lastName: true }
        }
      }
    });
    
    console.log('\n📋 Les 5 derniers logs :');
    console.log('─'.repeat(80));
    
    if (recentLogs.length === 0) {
      console.log('❌ Aucun log trouvé. Effectuez une action (login, création, etc.) pour générer des logs.');
    } else {
      recentLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Action: ${log.action}`);
        console.log(`   Utilisateur: ${log.user?.email || 'Anonyme'} (${log.user?.role || 'N/A'})`);
        console.log(`   Ressource: ${log.resource || 'N/A'} ${log.resourceId ? `(ID: ${log.resourceId})` : ''}`);
        console.log(`   Méthode: ${log.method || 'N/A'} | Path: ${log.path || 'N/A'}`);
        console.log(`   IP: ${log.ipAddress || 'N/A'}`);
        console.log(`   Status: ${log.statusCode || 'N/A'} | Durée: ${log.duration ? log.duration + 'ms' : 'N/A'}`);
        console.log(`   Date: ${log.timestamp.toLocaleString('fr-FR')}`);
        
        if (log.oldValues) {
          console.log(`   Anciennes valeurs: ${log.oldValues.substring(0, 100)}${log.oldValues.length > 100 ? '...' : ''}`);
        }
        if (log.newValues) {
          console.log(`   Nouvelles valeurs: ${log.newValues.substring(0, 100)}${log.newValues.length > 100 ? '...' : ''}`);
        }
      });
    }
    
    // 3. Statistiques par action
    console.log('\n\n📊 Statistiques par action :');
    console.log('─'.repeat(80));
    
    const statsByAction = await prisma.$queryRaw`
      SELECT action, COUNT(*)::int as count 
      FROM audit_logs 
      GROUP BY action 
      ORDER BY count DESC 
      LIMIT 10
    `;
    
    if (statsByAction.length > 0) {
      statsByAction.forEach(stat => {
        console.log(`   ${stat.action.padEnd(35)} : ${stat.count} fois`);
      });
    } else {
      console.log('   Aucune statistique disponible');
    }
    
    // 4. Statistiques par utilisateur
    console.log('\n\n👥 Top 5 utilisateurs les plus actifs :');
    console.log('─'.repeat(80));
    
    const statsByUser = await prisma.$queryRaw`
      SELECT u.email, u.role, COUNT(a.*)::int as actions
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.user_id IS NOT NULL
      GROUP BY u.email, u.role
      ORDER BY actions DESC
      LIMIT 5
    `;
    
    if (statsByUser.length > 0) {
      statsByUser.forEach(stat => {
        console.log(`   ${(stat.email || 'N/A').padEnd(30)} (${stat.role}) : ${stat.actions} actions`);
      });
    } else {
      console.log('   Aucune action utilisateur enregistrée');
    }
    
    console.log('\n✅ Test terminé avec succès !\n');
    
  } catch (error) {
    console.error('❌ Erreur lors du test :', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAudit();
