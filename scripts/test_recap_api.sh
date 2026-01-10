#!/bin/bash
# Script pour tester l'API récapitulatif électoral

EMAIL="kamaldinemoustapha229@gmail.com"
BASE_URL="http://localhost:3000/api"

echo "🔐 Connexion..."
curl -s -X POST "$BASE_URL/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\"}" >/dev/null

# Récupérer le code
CODE=$(node scripts/otp_test.js fetch "$EMAIL" 2>/dev/null | grep "LATEST_CODE:" | awk '{print $2}')
echo "Code OTP: $CODE"

# Vérifier
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify" -H "Content-Type: application/json" -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}")
TOKEN=$(echo "$VERIFY_RESPONSE" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0));console.log(d.data?.token||'')")

if [ -z "$TOKEN" ]; then
  echo "❌ Échec de connexion"
  echo "$VERIFY_RESPONSE"
  exit 1
fi

echo "✅ Connecté! Token: ${TOKEN:0:30}..."

# Test check-status
echo ""
echo "📋 Test check-status..."
curl -s -X GET "$BASE_URL/recapitulatifs-electoraux/check-status" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test get me
echo ""
echo "👤 Test get me..."
curl -s -X GET "$BASE_URL/recapitulatifs-electoraux/me" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Créer un récapitulatif
echo ""
echo "➕ Création d'un récapitulatif..."
ELECTION_ID=$(node -e "const prisma=require('./src/config/database');(async()=>{const e=await prisma.election.findFirst();console.log(e.id);await prisma.\$disconnect()})()" 2>/dev/null)

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/recapitulatifs-electoraux" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"electionId\":\"$ELECTION_ID\",\"nombreElecteurs\":25000,\"nombreCentresDeVote\":15,\"nombrePostesDeVote\":35}")

echo "$CREATE_RESPONSE" | jq .

# Re-test check-status
echo ""
echo "📋 Re-test check-status après création..."
curl -s -X GET "$BASE_URL/recapitulatifs-electoraux/check-status" \
  -H "Authorization: Bearer $TOKEN" | jq .
