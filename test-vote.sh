#!/bin/bash

# ============================================
# TEST AJOUT DE VOTE
# ============================================

# 🔐 TOKENS (À récupérer depuis /api/login)
# Pour l'instant, on utilise ces données de test

# 1️⃣  D'ABORD, CRÉER UN TOKEN
echo "🔐 Connexion et création du token..."
LOGIN=$(curl -s -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "super@admin.com",
    "password": "SuperAdmin123!"
  }')

TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✓ Token: $TOKEN"

# 2️⃣  RÉCUPÉRER LES IDs NÉCESSAIRES
echo ""
echo "📋 Récupération des données de test..."

# Élection
ELECTION=$(curl -s -X GET http://localhost:3000/api/elections \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "✓ Election ID: $ELECTION"

# Centre de vote
CENTRE=$(curl -s -X GET "http://localhost:3000/api/centres-de-vote?limit=1" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "✓ Centre de vote ID: $CENTRE"

# Poste de vote
POSTE=$(curl -s -X GET "http://localhost:3000/api/postes?centreId=$CENTRE&limit=1" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "✓ Poste de vote ID: $POSTE"

# SA (Super Admin ou Agent)
SA=$(curl -s -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | grep -v "null" | head -1 | cut -d'"' -f4)
echo "✓ SA ID: $SA"

# Partis
echo ""
echo "📊 Récupération des partis..."
PARTIS=$(curl -s -X GET "http://localhost:3000/api/elections/$ELECTION/partis" \
  -H "Authorization: Bearer $TOKEN")

# 3️⃣  AJOUTER UN RÉSULTAT (VOTE)
echo ""
echo "📝 Ajout d'un résultat de vote..."

curl -X POST http://localhost:3000/api/resultats-saisies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"electionId\": \"$ELECTION\",
    \"centreDeVoteId\": \"$CENTRE\",
    \"posteDeVoteId\": \"$POSTE\",
    \"saId\": \"$SA\",
    \"nombreInscrits\": 150,
    \"nombreVotants\": 120,
    \"suffragesExprimes\": 110,
    \"abstentions\": 30
  }" | jq .

echo ""
echo "✓ Test terminer !"
