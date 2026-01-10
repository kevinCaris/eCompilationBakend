-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SA', 'AGENT');

-- CreateEnum
CREATE TYPE "TypeElection" AS ENUM ('LEGISLATIVE', 'COMMUNALES');

-- CreateEnum
CREATE TYPE "StatusResultat" AS ENUM ('COMPLETEE', 'VALIDEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "StatusCompilation" AS ENUM ('EN_COURS', 'VALIDEE', 'REJETEE');

-- CreateTable
CREATE TABLE "departements" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communes" (
    "id" TEXT NOT NULL,
    "departement_id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circonscriptions" (
    "id" TEXT NOT NULL,
    "commune_id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circonscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arrondissements" (
    "id" TEXT NOT NULL,
    "circonscription_id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "population" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arrondissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quartiers" (
    "id" TEXT NOT NULL,
    "arrondissement_id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quartiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centres_de_vote" (
    "id" TEXT NOT NULL,
    "quartier_id" TEXT NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "adresse" VARCHAR(255),
    "nombre_postes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centres_de_vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postes_de_vote" (
    "id" TEXT NOT NULL,
    "centre_de_vote_id" TEXT NOT NULL,
    "numero" INTEGER,
    "libelle" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postes_de_vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "telephone" VARCHAR(20),
    "role" "Role" NOT NULL,
    "arrondissement_id" TEXT,
    "centre_de_vote_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elections" (
    "id" TEXT NOT NULL,
    "type" "TypeElection" NOT NULL,
    "date_vote" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partis" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "sigle" VARCHAR(20),
    "logo" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultats_saisies" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "centre_de_vote_id" TEXT NOT NULL,
    "poste_de_vote_id" TEXT NOT NULL,
    "sa_id" TEXT NOT NULL,
    "nombre_inscrits" INTEGER,
    "nombre_votants" INTEGER,
    "suffrages_exprimes" INTEGER,
    "abstentions" INTEGER,
    "taux_participation" DOUBLE PRECISION,
    "status" "StatusResultat" NOT NULL DEFAULT 'COMPLETEE',
    "date_saisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_validation" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultats_saisies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultats_partis" (
    "id" TEXT NOT NULL,
    "result_saisie_id" TEXT NOT NULL,
    "parti_id" TEXT NOT NULL,
    "voix" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultats_partis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compilations" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "centre_de_vote_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "url_photo" VARCHAR(500),
    "status" "StatusCompilation" NOT NULL DEFAULT 'EN_COURS',
    "date_compilation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_validation" TIMESTAMP(3),
    "date_rejet" TIMESTAMP(3),
    "raison_rejet" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compilations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recapitulatifs_electoraux" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "sa_id" TEXT NOT NULL,
    "nombre_electeurs" INTEGER NOT NULL,
    "nombre_centres_de_vote" INTEGER NOT NULL,
    "nombre_postes_de_vote" INTEGER NOT NULL,
    "raison_modification" TEXT,
    "status" "StatusResultat" NOT NULL DEFAULT 'COMPLETEE',
    "date_saisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recapitulatifs_electoraux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departements_code_key" ON "departements"("code");

-- CreateIndex
CREATE INDEX "communes_departement_id_idx" ON "communes"("departement_id");

-- CreateIndex
CREATE UNIQUE INDEX "communes_departement_id_code_key" ON "communes"("departement_id", "code");

-- CreateIndex
CREATE INDEX "circonscriptions_commune_id_idx" ON "circonscriptions"("commune_id");

-- CreateIndex
CREATE UNIQUE INDEX "circonscriptions_commune_id_code_key" ON "circonscriptions"("commune_id", "code");

-- CreateIndex
CREATE INDEX "arrondissements_circonscription_id_idx" ON "arrondissements"("circonscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "arrondissements_circonscription_id_code_key" ON "arrondissements"("circonscription_id", "code");

-- CreateIndex
CREATE INDEX "quartiers_arrondissement_id_idx" ON "quartiers"("arrondissement_id");

-- CreateIndex
CREATE UNIQUE INDEX "quartiers_arrondissement_id_code_key" ON "quartiers"("arrondissement_id", "code");

-- CreateIndex
CREATE INDEX "centres_de_vote_quartier_id_idx" ON "centres_de_vote"("quartier_id");

-- CreateIndex
CREATE INDEX "postes_de_vote_centre_de_vote_id_idx" ON "postes_de_vote"("centre_de_vote_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_arrondissement_id_idx" ON "users"("arrondissement_id");

-- CreateIndex
CREATE INDEX "users_centre_de_vote_id_idx" ON "users"("centre_de_vote_id");

-- CreateIndex
CREATE INDEX "email_verification_codes_user_id_expires_at_idx" ON "email_verification_codes"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "elections_type_idx" ON "elections"("type");

-- CreateIndex
CREATE INDEX "partis_election_id_idx" ON "partis"("election_id");

-- CreateIndex
CREATE INDEX "resultats_saisies_election_id_idx" ON "resultats_saisies"("election_id");

-- CreateIndex
CREATE INDEX "resultats_saisies_centre_de_vote_id_idx" ON "resultats_saisies"("centre_de_vote_id");

-- CreateIndex
CREATE INDEX "resultats_saisies_poste_de_vote_id_idx" ON "resultats_saisies"("poste_de_vote_id");

-- CreateIndex
CREATE INDEX "resultats_saisies_sa_id_idx" ON "resultats_saisies"("sa_id");

-- CreateIndex
CREATE INDEX "resultats_saisies_status_idx" ON "resultats_saisies"("status");

-- CreateIndex
CREATE UNIQUE INDEX "resultats_saisies_election_id_poste_de_vote_id_key" ON "resultats_saisies"("election_id", "poste_de_vote_id");

-- CreateIndex
CREATE INDEX "resultats_partis_result_saisie_id_idx" ON "resultats_partis"("result_saisie_id");

-- CreateIndex
CREATE INDEX "resultats_partis_parti_id_idx" ON "resultats_partis"("parti_id");

-- CreateIndex
CREATE UNIQUE INDEX "resultats_partis_result_saisie_id_parti_id_key" ON "resultats_partis"("result_saisie_id", "parti_id");

-- CreateIndex
CREATE INDEX "compilations_election_id_idx" ON "compilations"("election_id");

-- CreateIndex
CREATE INDEX "compilations_centre_de_vote_id_idx" ON "compilations"("centre_de_vote_id");

-- CreateIndex
CREATE INDEX "compilations_agent_id_idx" ON "compilations"("agent_id");

-- CreateIndex
CREATE INDEX "compilations_status_idx" ON "compilations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "compilations_election_id_centre_de_vote_id_key" ON "compilations"("election_id", "centre_de_vote_id");

-- CreateIndex
CREATE INDEX "recapitulatifs_electoraux_election_id_idx" ON "recapitulatifs_electoraux"("election_id");

-- CreateIndex
CREATE INDEX "recapitulatifs_electoraux_sa_id_idx" ON "recapitulatifs_electoraux"("sa_id");

-- CreateIndex
CREATE INDEX "recapitulatifs_electoraux_status_idx" ON "recapitulatifs_electoraux"("status");

-- CreateIndex
CREATE UNIQUE INDEX "recapitulatifs_electoraux_election_id_sa_id_key" ON "recapitulatifs_electoraux"("election_id", "sa_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- AddForeignKey
ALTER TABLE "communes" ADD CONSTRAINT "communes_departement_id_fkey" FOREIGN KEY ("departement_id") REFERENCES "departements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circonscriptions" ADD CONSTRAINT "circonscriptions_commune_id_fkey" FOREIGN KEY ("commune_id") REFERENCES "communes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arrondissements" ADD CONSTRAINT "arrondissements_circonscription_id_fkey" FOREIGN KEY ("circonscription_id") REFERENCES "circonscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quartiers" ADD CONSTRAINT "quartiers_arrondissement_id_fkey" FOREIGN KEY ("arrondissement_id") REFERENCES "arrondissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centres_de_vote" ADD CONSTRAINT "centres_de_vote_quartier_id_fkey" FOREIGN KEY ("quartier_id") REFERENCES "quartiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postes_de_vote" ADD CONSTRAINT "postes_de_vote_centre_de_vote_id_fkey" FOREIGN KEY ("centre_de_vote_id") REFERENCES "centres_de_vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_arrondissement_id_fkey" FOREIGN KEY ("arrondissement_id") REFERENCES "arrondissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_centre_de_vote_id_fkey" FOREIGN KEY ("centre_de_vote_id") REFERENCES "centres_de_vote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partis" ADD CONSTRAINT "partis_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats_saisies" ADD CONSTRAINT "resultats_saisies_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats_saisies" ADD CONSTRAINT "resultats_saisies_centre_de_vote_id_fkey" FOREIGN KEY ("centre_de_vote_id") REFERENCES "centres_de_vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats_saisies" ADD CONSTRAINT "resultats_saisies_poste_de_vote_id_fkey" FOREIGN KEY ("poste_de_vote_id") REFERENCES "postes_de_vote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats_saisies" ADD CONSTRAINT "resultats_saisies_sa_id_fkey" FOREIGN KEY ("sa_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats_partis" ADD CONSTRAINT "resultats_partis_result_saisie_id_fkey" FOREIGN KEY ("result_saisie_id") REFERENCES "resultats_saisies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultats_partis" ADD CONSTRAINT "resultats_partis_parti_id_fkey" FOREIGN KEY ("parti_id") REFERENCES "partis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compilations" ADD CONSTRAINT "compilations_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compilations" ADD CONSTRAINT "compilations_centre_de_vote_id_fkey" FOREIGN KEY ("centre_de_vote_id") REFERENCES "centres_de_vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compilations" ADD CONSTRAINT "compilations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recapitulatifs_electoraux" ADD CONSTRAINT "recapitulatifs_electoraux_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recapitulatifs_electoraux" ADD CONSTRAINT "recapitulatifs_electoraux_sa_id_fkey" FOREIGN KEY ("sa_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
