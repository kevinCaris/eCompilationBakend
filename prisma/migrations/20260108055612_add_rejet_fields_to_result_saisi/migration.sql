/*
  Warnings:

  - You are about to drop the column `status` on the `recapitulatifs_electoraux` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "recapitulatifs_electoraux_status_idx";

-- AlterTable
ALTER TABLE "recapitulatifs_electoraux" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "resultats_saisies" ADD COLUMN     "date_rejet" TIMESTAMP(3),
ADD COLUMN     "raison_rejet" TEXT;
