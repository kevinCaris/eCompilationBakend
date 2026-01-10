#!/usr/bin/env node
/**
 * Script pour ajouter la colonne `status` à la table `recapitulatifs_electoraux`
 * Sans utiliser Prisma Migrate
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addStatusColumn() {
  try {
    console.log('🔍 Vérification de la colonne status...');
    
    // Vérifier si la colonne existe déjà
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recapitulatifs_electoraux' 
      AND column_name = 'status'
    `);
    
    if (result.length > 0) {
      console.log('✅ La colonne status existe déjà');
      return;
    }
    
    console.log('📝 Ajout de la colonne status...');
    
    // Vérifier si l'enum existe
    const enumExists = await prisma.$queryRawUnsafe(`
      SELECT 1 FROM pg_type WHERE typname = 'StatusResultat'
    `);
    
    if (enumExists.length === 0) {
      console.log('📝 Création de l\'enum StatusResultat...');
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "StatusResultat" AS ENUM ('COMPLETEE', 'VALIDEE', 'REJETEE')
      `);
    }
    
    // Ajouter la colonne
    await prisma.$executeRawUnsafe(`
      ALTER TABLE recapitulatifs_electoraux
      ADD COLUMN status "StatusResultat" NOT NULL DEFAULT 'COMPLETEE'
    `);
    
    console.log('📝 Création de l\'index...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS recapitulatifs_electoraux_status_idx 
      ON recapitulatifs_electoraux(status)
    `);
    
    console.log('✅ Colonne status ajoutée avec succès !');
    console.log('✅ Index créé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la colonne:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
addStatusColumn()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    console.log('👉 Redémarrez le backend: npm run dev');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Le script a échoué:', error);
    process.exit(1);
  });
