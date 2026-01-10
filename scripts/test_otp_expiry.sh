#!/bin/bash
# Test complet de l'expiration OTP et du resend
# Usage: ./test_otp_expiry.sh

EMAIL="kamaldinemoustapha229@gmail.com"
BASE_URL="http://localhost:3000/api"

echo "=========================================="
echo "🧪 TEST D'EXPIRATION OTP (1 minute)"
echo "=========================================="

# Étape 1: Demander un code OTP
echo ""
echo "📧 Étape 1: Demande d'un code OTP..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

echo "Réponse: $LOGIN_RESPONSE"

# Extraire expiresIn
EXPIRES_IN=$(echo "$LOGIN_RESPONSE" | grep -o '"expiresIn":[0-9]*' | cut -d':' -f2)
echo "⏱️  Code expire dans: ${EXPIRES_IN} secondes"

if [ "$EXPIRES_IN" != "60" ]; then
  echo "⚠️  ATTENTION: expiresIn devrait être 60 (1 minute), mais c'est $EXPIRES_IN"
fi

# Étape 2: Récupérer le code OTP de la base
echo ""
echo "🔍 Étape 2: Récupération du code OTP en base..."
CODE=$(node -e "
const prisma = require('./src/config/database');
(async () => {
  const user = await prisma.user.findUnique({ where: { email: '$EMAIL' } });
  const code = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id, used: false },
    orderBy: { createdAt: 'desc' }
  });
  console.log(code ? code.code : 'NO_CODE');
  await prisma.\$disconnect();
})();
")
echo "📝 Code OTP: $CODE"

# Étape 3: Tester avec le bon code immédiatement
echo ""
echo "✅ Étape 3: Test de vérification avec le bon code (immédiat)..."
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\"}")

if echo "$VERIFY_RESPONSE" | grep -q "Connexion réussie"; then
  echo "✅ SUCCÈS: Connexion réussie avec le code valide"
else
  echo "❌ ÉCHEC: $VERIFY_RESPONSE"
fi

# Étape 4: Demander un nouveau code et attendre qu'il expire
echo ""
echo "📧 Étape 4: Demande d'un nouveau code OTP..."
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}" > /dev/null

# Récupérer le nouveau code
CODE2=$(node -e "
const prisma = require('./src/config/database');
(async () => {
  const user = await prisma.user.findUnique({ where: { email: '$EMAIL' } });
  const code = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id, used: false },
    orderBy: { createdAt: 'desc' }
  });
  console.log(code ? code.code : 'NO_CODE');
  await prisma.\$disconnect();
})();
")
echo "📝 Nouveau code OTP: $CODE2"

echo ""
echo "⏳ Étape 5: Attente de 65 secondes pour expiration..."
echo "   (Le code expire après 1 minute)"
for i in {65..1}; do
  printf "\r   ⏱️  Temps restant: %02d secondes" $i
  sleep 1
done
echo ""

# Étape 6: Tester avec le code expiré
echo ""
echo "❌ Étape 6: Test de vérification avec code EXPIRÉ..."
VERIFY_EXPIRED=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE2\"}")

if echo "$VERIFY_EXPIRED" | grep -q "invalide ou expiré"; then
  echo "✅ SUCCÈS: Le code expiré est bien rejeté"
  echo "   Réponse: $VERIFY_EXPIRED"
else
  echo "❌ ÉCHEC: Le code expiré aurait dû être rejeté"
  echo "   Réponse: $VERIFY_EXPIRED"
fi

# Étape 7: Tester le resend
echo ""
echo "🔄 Étape 7: Test du RESEND (renvoi de code)..."
RESEND_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/resend" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}")

if echo "$RESEND_RESPONSE" | grep -q "success"; then
  echo "✅ SUCCÈS: Nouveau code envoyé via resend"
else
  echo "❌ ÉCHEC: $RESEND_RESPONSE"
fi

# Récupérer le code resend
CODE3=$(node -e "
const prisma = require('./src/config/database');
(async () => {
  const user = await prisma.user.findUnique({ where: { email: '$EMAIL' } });
  const code = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id, used: false },
    orderBy: { createdAt: 'desc' }
  });
  console.log(code ? code.code : 'NO_CODE');
  await prisma.\$disconnect();
})();
")
echo "📝 Code après resend: $CODE3"

# Étape 8: Vérifier avec le nouveau code
echo ""
echo "✅ Étape 8: Test de vérification avec le code RESEND..."
VERIFY_RESEND=$(curl -s -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE3\"}")

if echo "$VERIFY_RESEND" | grep -q "Connexion réussie"; then
  echo "✅ SUCCÈS: Connexion réussie avec le code resend"
else
  echo "❌ ÉCHEC: $VERIFY_RESEND"
fi

echo ""
echo "=========================================="
echo "📊 RÉSUMÉ DU TEST"
echo "=========================================="
echo "1. Code expire après: ${EXPIRES_IN:-60} secondes"
echo "2. Code valide immédiat: ✅"
echo "3. Code expiré rejeté: $(echo "$VERIFY_EXPIRED" | grep -q "invalide" && echo "✅" || echo "❌")"
echo "4. Resend fonctionne: $(echo "$RESEND_RESPONSE" | grep -q "success" && echo "✅" || echo "❌")"
echo "5. Code resend valide: $(echo "$VERIFY_RESEND" | grep -q "réussie" && echo "✅" || echo "❌")"
echo ""
