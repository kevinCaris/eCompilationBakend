/*
  Warnings:

  - You are about to drop the column `date_rejet` on the `resultats_saisies` table. All the data in the column will be lost.
  - You are about to drop the column `raison_rejet` on the `resultats_saisies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "resultats_saisies" DROP COLUMN "date_rejet",
DROP COLUMN "raison_rejet";
