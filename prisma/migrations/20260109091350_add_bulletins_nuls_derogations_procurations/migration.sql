-- DropForeignKey
ALTER TABLE "compilations" DROP CONSTRAINT "compilations_agent_id_fkey";

-- DropForeignKey
ALTER TABLE "recapitulatifs_electoraux" DROP CONSTRAINT "recapitulatifs_electoraux_sa_id_fkey";

-- DropForeignKey
ALTER TABLE "resultats_saisies" DROP CONSTRAINT "resultats_saisies_poste_de_vote_id_fkey";

-- DropForeignKey
ALTER TABLE "resultats_saisies" DROP CONSTRAINT "resultats_saisies_sa_id_fkey";

-- AlterTable
ALTER TABLE "recapitulatifs_electoraux" ADD COLUMN     "status" "StatusResultat" NOT NULL DEFAULT 'COMPLETEE';

-- AlterTable
ALTER TABLE "resultats_saisies" ADD COLUMN     "bulletins_nuls" INTEGER,
ADD COLUMN     "derogations" INTEGER,
ADD COLUMN     "procurations" INTEGER;

-- CreateIndex
CREATE INDEX "recapitulatifs_electoraux_status_idx" ON "recapitulatifs_electoraux"("status");

-- AddForeignKey
ALTER TABLE "resultats_saisies" ADD CONSTRAINT "resultats_saisies_poste_de_vote_id_fkey" FOREIGN KEY ("poste_de_vote_id") REFERENCES "postes_de_vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats_saisies" ADD CONSTRAINT "resultats_saisies_sa_id_fkey" FOREIGN KEY ("sa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compilations" ADD CONSTRAINT "compilations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recapitulatifs_electoraux" ADD CONSTRAINT "recapitulatifs_electoraux_sa_id_fkey" FOREIGN KEY ("sa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
