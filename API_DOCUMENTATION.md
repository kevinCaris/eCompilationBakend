# Documentation API - eCompilation

## Configuration de base

**URL de base :** `http://localhost:3000/api`

**Authentification :** Bearer Token (JWT)
- Le token se met dans le header : `Authorization: Bearer {token}`
- Vous le recevez après login

---

## Authentification

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmk45kdkl00050hz74su9fpzb",
      "email": "user@example.com",
      "firstName": "Kevin",
      "role": "SUPER_ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## CENTRES DE VOTE

### 1. Créer un centre de vote
```
POST /centres-de-vote
Authorization: Bearer {token}
Content-Type: application/json

{
  "quartierId": "cmk45kdkl00050hz74su9fpzc",
  "nom": "Centre de Vote Principal",
  "adresse": "Rue Principale, Cotonou",
  "nombrePostes": 5
}
```
**Permissions :** SUPER_ADMIN uniquement

**Réponse (201) :**
```json
{
  "success": true,
  "data": {
    "id": "cmk45kdkl00050hz74su9fpzd",
    "quartierId": "cmk45kdkl00050hz74su9fpzc",
    "nom": "Centre de Vote Principal",
    "adresse": "Rue Principale, Cotonou",
    "nombrePostes": 5,
    "createdAt": "2026-01-07T15:30:00Z",
    "updatedAt": "2026-01-07T15:30:00Z"
  }
}
```

---

### 2. Récupérer tous les centres
```
GET /centres-de-vote
Authorization: Bearer {token}
```

**Query parameters (optionnels) :**
- `quartierId=xxx` - Filtrer par quartier
- `arrondissementId=xxx` - Filtrer par arrondissement
- `limit=50` - Nombre de résultats (défaut: 100)
- `offset=0` - Pagination (défaut: 0)

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmk45kdkl00050hz74su9fpzd",
      "nom": "Centre de Vote Principal",
      "adresse": "Rue Principale, Cotonou",
      "nombrePostes": 5,
      "quartier": {
        "id": "cmk45kdkl00050hz74su9fpzc",
        "nom": "Quartier XYZ",
        "arrondissement": { ... }
      },
      "postesDeVote": [...]
    }
  ]
}
```

---

### 3. Récupérer un centre par ID
```
GET /centres-de-vote/{id}
Authorization: Bearer {token}
```

---

### 4. Mettre à jour un centre
```
PUT /centres-de-vote/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "Centre Modifié",
  "adresse": "Nouvelle adresse",
  "nombrePostes": 10
}
```
**Permissions :** SUPER_ADMIN uniquement

---

### 5. Supprimer un centre
```
DELETE /centres-de-vote/{id}
Authorization: Bearer {token}
```
**Permissions :** SUPER_ADMIN uniquement

---

## POSTES DE VOTE

### 1. Créer des postes
```
POST /postes
Authorization: Bearer {token}
Content-Type: application/json

{
  "centreDeVoteId": "cmk45kdkl00050hz74su9fpzd",
  "nombrePostes": 5
}
```
**Permissions :** Tous les utilisateurs authentifiés

**Réponse (201) :**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmk45kdkl00050hz74su9fpze",
      "centreDeVoteId": "cmk45kdkl00050hz74su9fpzd",
      "numero": 1,
      "libelle": null,
      "createdAt": "2026-01-07T15:35:00Z"
    },
    {
      "id": "cmk45kdkl00050hz74su9fpzf",
      "numero": 2,
      "libelle": null
    }
  ]
}
```

---

### 2. Récupérer les postes d'un centre
```
GET /postes/centre/{centreId}
Authorization: Bearer {token}
```

---

### 3. Récupérer un poste par ID
```
GET /postes/{id}
Authorization: Bearer {token}
```

---

### 4. Mettre à jour un poste
```
PUT /postes/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "numero": 5,
  "libelle": "Poste de Vote Modifié"
}
```
**Permissions :** SUPER_ADMIN uniquement

---

### 5. Supprimer un poste
```
DELETE /postes/{id}
Authorization: Bearer {token}
```
**Permissions :** SUPER_ADMIN uniquement

---

## ÉLECTIONS

### 1. Créer une élection
```
POST /elections
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "LEGISLATIVE",
  "dateVote": "2026-03-15T00:00:00Z"
}
```
**Permissions :** SUPER_ADMIN uniquement

**Types valides :** `LEGISLATIVE` ou `COMMUNALES`

**Réponse (201) :**
```json
{
  "success": true,
  "data": {
    "id": "cmk45kdkl00050hz74su9fpzg",
    "type": "LEGISLATIVE",
    "statut": "PLANIFIEE",
    "dateVote": "2026-03-15T00:00:00Z",
    "createdBy": "cmk45kdkl00050hz74su9fpzb",
    "createdAt": "2026-01-07T16:00:00Z",
    "updatedAt": "2026-01-07T16:00:00Z",
    "partis": []
  }
}
```

---

### 2. Récupérer toutes les élections
```
GET /elections
Authorization: Bearer {token}
```

**Query parameters (optionnels) :**
- `type=LEGISLATIVE` - Filtrer par type
- `limit=50` - Nombre de résultats
- `offset=0` - Pagination

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmk45kdkl00050hz74su9fpzg",
      "type": "LEGISLATIVE",
      "statut": "EN_COURS",
      "dateVote": "2026-01-11T00:00:00Z",
      "createdAt": "2026-01-07T16:00:00Z",
      "updatedAt": "2026-01-09T10:30:00Z",
      "partis": [...],
      "_count": {
        "resultSaisies": 5,
        "compilations": 1
      }
    }
  ]
}
```

---

### 3. Récupérer une élection par ID
```
GET /elections/{id}
Authorization: Bearer {token}
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": "cmk45kdkl00050hz74su9fpzg",
    "type": "LEGISLATIVE",
    "statut": "EN_COURS",
    "dateVote": "2026-01-11T00:00:00Z",
    "createdBy": "cmk45kdkl00050hz74su9fpzb",
    "createdAt": "2026-01-07T16:00:00Z",
    "updatedAt": "2026-01-09T10:30:00Z",
    "partis": [...],
    "resultSaisies": [...],
    "compilations": [...],
    "_count": {
      "resultSaisies": 5,
      "compilations": 1
    }
  }
}
```

---

### 4. Mettre à jour une élection
```
PUT /elections/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "COMMUNALES",
  "dateVote": "2026-04-20T00:00:00Z",
  "statut": "EN_COURS"
}
```
**Permissions :** SUPER_ADMIN uniquement

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": "cmk45kdkl00050hz74su9fpzg",
    "type": "COMMUNALES",
    "statut": "EN_COURS",
    "dateVote": "2026-04-20T00:00:00Z",
    "updatedAt": "2026-01-09T10:35:00Z"
  }
}
```

---

### 5. Modifier le statut d'une élection
```
PATCH /elections/{id}/statut
Authorization: Bearer {token}
Content-Type: application/json

{
  "statut": "FERMEE"
}
```
**Permissions :** SUPER_ADMIN uniquement

**Statuts valides :**
- `PLANIFIEE` - Créée mais pas encore votée (par défaut)
- `EN_COURS` - Le jour du vote ou collecte de résultats
- `FERMEE` - Terminée, compilation lancée
- `ARCHIVEE` - Données finalisées

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Statut de l'élection mis à jour avec succès",
  "data": {
    "id": "cmk45kdkl00050hz74su9fpzg",
    "type": "LEGISLATIVE",
    "statut": "FERMEE",
    "dateVote": "2026-01-11T00:00:00Z",
    "updatedAt": "2026-01-09T11:00:00Z",
    "partis": [...],
    "_count": {
      "resultSaisies": 10,
      "compilations": 2
    }
  }
}
```

**Erreurs possibles :**
- `400` - Statut invalide ou requis
- `404` - Élection non trouvée

---

### 6. Supprimer une élection
```
DELETE /elections/{id}
Authorization: Bearer {token}
```
**Permissions :** SUPER_ADMIN uniquement

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "message": "Élection supprimée avec succès",
    "id": "cmk45kdkl00050hz74su9fpzg"
  }
}
```

**Note :** La suppression en cascade supprime aussi :
- Tous les partis associés
- Tous les résultats saisis
- Toutes les compilations
- Tous les récapitulatifs électoraux

---

## PARTIS POLITIQUES

### 1. Créer un parti
```
POST /partis
Authorization: Bearer {token}
Content-Type: application/json

{
  "electionId": "cmk45kdkl00050hz74su9fpzg",
  "nom": "Parti Démocratique",
  "sigle": "PD",
  "logo": "https://example.com/logo.png"
}
```
**Permissions :** SUPER_ADMIN uniquement

**Réponse (201) :**
```json
{
  "success": true,
  "data": {
    "id": "cmk45kdkl00050hz74su9fpzh",
    "electionId": "cmk45kdkl00050hz74su9fpzg",
    "nom": "Parti Démocratique",
    "sigle": "PD",
    "logo": "https://example.com/logo.png",
    "createdAt": "2026-01-07T16:05:00Z",
    "election": { ... }
  }
}
```

---

### 2. Récupérer tous les partis
```
GET /partis
Authorization: Bearer {token}
```

**Query parameters (optionnels) :**
- `electionId=xxx` - Filtrer par élection
- `limit=50` - Nombre de résultats
- `offset=0` - Pagination

---

### 3. Récupérer les partis d'une élection
```
GET /elections/{electionId}/partis
Authorization: Bearer {token}
```

---

### 4. Récupérer un parti par ID
```
GET /partis/{id}
Authorization: Bearer {token}
```

---

### 5. Mettre à jour un parti
```
PUT /partis/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nom": "Parti Nouveau Nom",
  "sigle": "PNN",
  "logo": "https://example.com/new-logo.png"
}
```
**Permissions :** SUPER_ADMIN uniquement

---

### 6. Supprimer un parti
```
DELETE /partis/{id}
Authorization: Bearer {token}
```
**Permissions :** SUPER_ADMIN uniquement

---

## GÉOGRAPHIE

### Récupérer tous les départements
```
GET /departements
Authorization: Bearer {token}
```

### Récupérer toutes les communes
```
GET /communes
Authorization: Bearer {token}
```
**Query parameters :**
- `departementId=xxx` - Filtrer par département

### Récupérer tous les arrondissements
```
GET /arrondissements
Authorization: Bearer {token}
```
**Query parameters :**
- `circonscriptionId=xxx` - Filtrer par circonscription

### Récupérer tous les quartiers
```
GET /quartiers
Authorization: Bearer {token}
```
**Query parameters :**
- `arrondissementId=xxx` - Filtrer par arrondissement

---

## STATISTIQUES

### Statistiques des centres de vote
```
GET /centres-de-vote/stats
Authorization: Bearer {token}
```

---

## Codes d'erreur

| Code | Message | Signification |
|------|---------|--------------|
| 400 | Bad Request | Paramètre manquant ou invalide |
| 401 | Accès non autorisé | Token absent, expiré ou invalide |
| 403 | Accès non autorisé | Permissions insuffisantes |
| 404 | Not Found | Ressource non trouvée |
| 500 | Internal Server Error | Erreur serveur |

---

## Exemple de flux complet

### Étape 1 : Login
```
POST /auth/login
```
Récupérez le token

### Étape 2 : Créer une élection
```
POST /elections
Header: Authorization: Bearer {token}
Body: { "type": "LEGISLATIVE", "dateVote": "2026-03-15T00:00:00Z" }
```
Récupérez l'ID de l'élection (ex: `cmk45kdkl00050hz74su9fpzg`)

### Étape 3 : Créer des partis
```
POST /partis
Header: Authorization: Bearer {token}
Body: { "electionId": "cmk45kdkl00050hz74su9fpzg", "nom": "Parti 1", "sigle": "P1" }
```

### Étape 4 : Créer un centre de vote
```
POST /centres-de-vote
Header: Authorization: Bearer {token}
Body: { "quartierId": "...", "nom": "Centre 1" }
```

### Étape 5 : Créer les postes
```
POST /postes
Header: Authorization: Bearer {token}
Body: { "centreDeVoteId": "...", "nombrePostes": 5 }
```

---

## RÉSULTATS SAISIS (Postes de vote)

### 1. Créer un résultat (saisie d'un poste)
```
POST /resultats-saisis
Authorization: Bearer {token}
Content-Type: application/json

{
  "electionId": "cmk...",
  "centreDeVoteId": "cmk...",
  "posteDeVoteId": "cmk...",
  "dateOuverture": "2026-04-15T07:00:00.000Z",
  "dateFermeture": "2026-04-15T18:00:00.000Z",
  "nombreInscrits": 500,
  "nombreVotants": 420,
  "suffragesExprimes": 400,
  "abstentions": 80,
  "resultPartis": [
    { "partiId": "cmk...", "voix": 150 },
    { "partiId": "cmk...", "voix": 120 },
    { "partiId": "cmk...", "voix": 130 }
  ]
}
```
**Permissions :** SA uniquement

---

### 2. Lister tous les résultats saisis
```
GET /resultats-saisis
Authorization: Bearer {token}
```

**Query parameters (optionnels) :**
- `electionId=xxx` - Filtrer par élection
- `centreDeVoteId=xxx` - Filtrer par centre
- `status=COMPLETEE|VALIDEE|REJETEE` - Filtrer par statut

---

### 3. Récupérer un résultat par ID
```
GET /resultats-saisis/{id}
Authorization: Bearer {token}
```

---

### 4. Résultats par élection
```
GET /elections/{electionId}/resultats
Authorization: Bearer {token}
```

---

### 5. Résultats par centre
```
GET /centres-de-vote/{centreId}/resultats
Authorization: Bearer {token}
```

---

### 6. Modifier un résultat (UNIQUEMENT SI REJETE)
```
PUT /resultats-saisis/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombreInscrits": 500,
  "nombreVotants": 425,
  "suffragesExprimes": 410,
  "abstentions": 75,
  "resultPartis": [
    { "partiId": "cmk...", "voix": 155 },
    { "partiId": "cmk...", "voix": 125 },
    { "partiId": "cmk...", "voix": 130 }
  ]
}
```
**Permissions :** SA uniquement

**Note :** Le CA ne peut modifier un poste QUE si son status est `REJETEE`. Apres modification, le status repasse a `COMPLETEE`.

---

### 7. Valider un poste (Admin)
```
PATCH /resultats-saisis/{id}/valider
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Note :** Si **TOUS les postes** du centre sont valides, la Compilation passe automatiquement a `VALIDEE`.

---

### 8. Rejeter un poste (Admin)
```
PATCH /resultats-saisis/{id}/rejeter
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Aucun body requis** - L'observation est GLOBALE dans la Compilation (pas par poste).

---

### 9. Statut des postes d'un centre (Vue Admin)
```
GET /centres-de-vote/{centreId}/elections/{electionId}/postes-status
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "centre": { "id": "...", "nom": "Centre 1" },
    "postes": [
      {
        "id": "cmk...",
        "poste": { "numero": 1, "libelle": "Poste 1" },
        "status": "VALIDEE",
        "statusLabel": "Valide"
      },
      {
        "id": "cmk...",
        "poste": { "numero": 2, "libelle": "Poste 2" },
        "status": "REJETEE",
        "statusLabel": "Rejete"
      }
    ],
    "stats": {
      "totalPostes": 3,
      "valides": 1,
      "rejetes": 1,
      "enAttente": 1
    }
  }
}
```

---

### 10. Mes postes rejetes (Vue CA)
```
GET /mes-postes-rejetes
Authorization: Bearer {token}
```
**Permissions :** SA uniquement

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "postesRejetes": [
      {
        "id": "cmk...",
        "poste": { "numero": 3, "libelle": "Poste 3" },
        "centre": { "nom": "École Primaire Godomey" },
        "status": "REJETEE"
      }
    ],
    "observationGlobale": "Veuillez corriger le poste 3 (suffrages incohérents)",
    "total": 1
  }
}
```

---

## RÉSULTATS PAR PARTI (Voix)

### 1. Ajouter des voix pour un parti
```
POST /resultats-saisis/{resultSaisiId}/voix-partis
Authorization: Bearer {token}
Content-Type: application/json

{
  "partiId": "cmk...",
  "voix": 150
}
```
**Permissions :** SA uniquement

---

### 2. Lister les voix d'un résultat
```
GET /resultats-saisis/{resultSaisiId}/voix-partis
Authorization: Bearer {token}
```

---

### 3. Résumé des voix avec pourcentages
```
GET /resultats-saisis/{resultSaisiId}/voix-partis/resume
Authorization: Bearer {token}
```

---

### 4. Modifier les voix d'un parti
```
PUT /resultats-saisis/{resultSaisiId}/voix-partis/{partiId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "voix": 175
}
```
**Permissions :** SA uniquement

---

## COMPILATIONS

### 1. Créer une compilation
```
POST /compilations
Authorization: Bearer {token}
Content-Type: application/json

{
  "electionId": "cmk...",
  "centreDeVoteId": "cmk...",
  "urlPhoto": "https://storage.example.com/photos/pv_centre1.jpg"
}
```
**Permissions :** SA, ADMIN

---

### 2. Lister les compilations
```
GET /compilations
Authorization: Bearer {token}
```

**Query parameters (optionnels) :**
- `electionId=xxx` - Filtrer par élection
- `centreDeVoteId=xxx` - Filtrer par centre
- `status=EN_COURS|VALIDEE|REJETEE` - Filtrer par statut

---

### 3. Statistiques des compilations
```
GET /compilations/elections/{electionId}/stats
Authorization: Bearer {token}
```

---

### 4. DASHBOARD - Vue complete d'une compilation (Admin)
```
GET /compilations/{id}/dashboard
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "compilation": {
      "id": "cmk...",
      "status": "EN_COURS",
      "urlPhoto": "https://...",
      "raisonRejet": null,
      "agent": { "firstName": "Jean", "lastName": "Dupont" }
    },
    "centre": {
      "nom": "École Primaire Godomey",
      "quartier": "Togoudo",
      "arrondissement": "Godomey"
    },
    "postes": [
      {
        "id": "cmk...",
        "poste": { "numero": 1, "libelle": "Poste 1" },
        "status": "VALIDEE",
        "statusLabel": "Valide",
        "resultPartis": [
          { "parti": "FCBE", "voix": 150 },
          { "parti": "BR", "voix": 120 }
        ]
      }
    ],
    "stats": {
      "totalPostes": 3,
      "postesValides": 1,
      "postesRejetes": 1,
      "postesEnAttente": 1
    },
    "observationGlobale": "Corriger le poste 3",
    "peutEtreValidee": false,
    "messageValidation": "1 poste(s) rejeté(s) à corriger"
  }
}
```

---

### 5. Récupérer une compilation par ID
```
GET /compilations/{id}
Authorization: Bearer {token}
```

---

### 6. Modifier une compilation
```
PUT /compilations/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "urlPhoto": "https://new-url.com/photo.jpg"
}
```

---

### 7. Valider une compilation (manuel)
```
PATCH /compilations/{id}/valider
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Note :** Necessite que TOUS les postes soient valides et qu'une photo soit presente.

---

### 8. Rejeter une compilation
```
PATCH /compilations/{id}/rejeter
Authorization: Bearer {token}
Content-Type: application/json

{
  "raison": "Plusieurs postes contiennent des erreurs."
}
```
**Permissions :** ADMIN, SUPER_ADMIN

---

### 9. Ecrire/modifier l'observation globale
```
PATCH /compilations/{id}/observation
Authorization: Bearer {token}
Content-Type: application/json

{
  "observation": "Veuillez corriger les postes 3 et 5."
}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Note :** C'est cette observation que le CA voit quand il consulte ses postes rejetes.

---

## RÉCAPITULATIFS ÉLECTORAUX

### 1. Créer un récapitulatif
```
POST /recapitulatifs-electoraux
Authorization: Bearer {token}
Content-Type: application/json

{
  "electionId": "cmk...",
  "nombreElecteurs": 15000,
  "nombreCentresDeVote": 25,
  "nombrePostesDeVote": 75
}
```
**Permissions :** SA uniquement

---

### 2. Lister tous les récapitulatifs
```
GET /recapitulatifs-electoraux
Authorization: Bearer {token}
```

---

### 3. Récapitulatifs par élection
```
GET /recapitulatifs-electoraux/election/{electionId}
Authorization: Bearer {token}
```

---

### 4. Rapport hierarchique
```
GET /recapitulatifs-electoraux/election/{electionId}/rapport
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

---

### 5. Export PDF
```
GET /recapitulatifs-electoraux/election/{electionId}/export-pdf
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

---

## STATISTIQUES ADMIN

### 1. Récupérer les stats globales d'une élection
```
GET /admin/elections/{electionId}/stats
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "electionId": "cmk45kdkl00050hz74su9fpzg",
    "type": "LEGISLATIVE",
    "statut": "EN_COURS",
    "totalCentres": 75,
    "centresAvecResultats": 45,
    "pourcentageCouverture": 60,
    "totalResultatsSaisis": 450,
    "totalVotes": 125000,
    "derniereMAJ": "2026-01-09T11:30:00Z"
  }
}
```

---

### 2. Stats par commune
```
GET /admin/elections/{electionId}/stats/commune
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "communeId": "comm_001",
      "nom": "Cotonou",
      "totalCentres": 75,
      "centresAvecResultats": 45,
      "pourcentageCouverture": 60,
      "totalVotes": 125000,
      "dernierResultat": "2026-01-09T11:30:00Z"
    }
  ]
}
```

---

### 3. Stats par arrondissement
```
GET /admin/elections/{electionId}/stats/arrondissement
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "arrondissementId": "arr_001",
      "nom": "1er Arrondissement",
      "totalCentres": 8,
      "centresAvecResultats": 5,
      "pourcentageCouverture": 62.5,
      "totalVotes": 15000
    }
  ]
}
```

---

### 4. Stats par centre de vote
```
GET /admin/elections/{electionId}/stats/centre
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "centreId": "centre_001",
      "nom": "École Primaire XYZ",
      "nombrePostes": 3,
      "postesAvecResultats": 3,
      "pourcentageCompletion": 100,
      "totalVotes": 650,
      "dateMAJ": "2026-01-09T10:45:00Z"
    }
  ]
}
```

---

### 5. Résumé national
```
GET /admin/elections/{electionId}/stats/resume-national
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "totalCentres": 75,
    "centresTermines": 45,
    "tauxCompletion": 60,
    "totalVotes": 125000,
    "totalCompilations": 5,
    "electionsTerminees": 1,
    "derniereMAJ": "2026-01-09T11:30:00Z",
    "classementParti": [
      {
        "sigle": "UP",
        "nom": "Union Progressiste",
        "votes": 45000,
        "pourcentage": 36
      },
      {
        "sigle": "BR",
        "nom": "Bloc Républicain",
        "votes": 35000,
        "pourcentage": 28
      }
    ]
  }
}
```

---

### 6. Stream temps réel (SSE)
```
GET /admin/elections/{electionId}/stats/stream/live
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Query parameters :**
- `interval=2000` - Intervalle de mise à jour en millisecondes (défaut: 2000)

**Description :** Flux Server-Sent Events (SSE) qui envoie les stats en temps réel à l'intervalle spécifié.

**Exemple d'utilisation (JavaScript):**
```javascript
const eventSource = new EventSource(`/api/admin/elections/${electionId}/stats/stream/live?interval=3000`);

eventSource.onmessage = (event) => {
  const stats = JSON.parse(event.data);
  console.log('Stats actualisées:', stats);
  // Mettre à jour le dashboard
};

eventSource.onerror = (error) => {
  console.error('Erreur SSE:', error);
  eventSource.close();
};
```

---

## AUDIT & LOGS

### 1. Récupérer tous les logs d'audit
```
GET /audit-logs
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Query parameters (optionnels) :**
- `limit=50` - Nombre de résultats
- `offset=0` - Pagination
- `sortBy=createdAt` - Tri

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": "log_001",
      "userId": "user_123",
      "action": "CREATE_ELECTION",
      "entityType": "Election",
      "entityId": "cmk45kdkl00050hz74su9fpzg",
      "details": {
        "type": "LEGISLATIVE",
        "dateVote": "2026-01-11T00:00:00Z"
      },
      "timestamp": "2026-01-07T16:00:00Z",
      "ipAddress": "192.168.1.100"
    }
  ]
}
```

---

### 2. Logs par utilisateur
```
GET /audit-logs/user/{userId}
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Réponse (200) :** Liste des actions effectuées par l'utilisateur

---

### 3. Logs par action
```
GET /audit-logs/action/{action}
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Actions disponibles :**
- `CREATE_ELECTION`, `UPDATE_ELECTION`, `DELETE_ELECTION`
- `CREATE_PARTI`, `UPDATE_PARTI`, `DELETE_PARTI`
- `CREATE_RESULT_SAISI`, `UPDATE_RESULT_SAISI`, `VALIDATE_RESULT_SAISI`
- `CREATE_COMPILATION`, `UPDATE_COMPILATION`
- `CREATE_USER`, `UPDATE_USER`, `DELETE_USER`
- `LOGIN`, `LOGOUT`

---

### 4. Filtrer les logs
```
GET /audit-logs/filter
Authorization: Bearer {token}
```
**Permissions :** ADMIN, SUPER_ADMIN

**Query parameters :**
- `userId={userId}` - Filtrer par utilisateur
- `action={action}` - Filtrer par action
- `entityType={type}` - Filtrer par type d'entité
- `startDate={ISO_DATE}` - Date de début
- `endDate={ISO_DATE}` - Date de fin
- `limit=50` - Nombre de résultats
- `offset=0` - Pagination

---

## SCENARIOS DE TEST POSTMAN

### Scénario 1 : Flux Admin - Validation des postes

```
# 1. Login Admin
POST /auth/login
Body: { "email": "admin@mairie.bj" }

# 2. Vérifier OTP (voir console serveur)
POST /auth/verify
Body: { "email": "admin@mairie.bj", "code": "123456" }
# Recuperer le token

# 3. Voir le dashboard d'une compilation
GET /compilations/{compilationId}/dashboard
Headers: Authorization: Bearer {token}

# 4. Valider un poste correct
PATCH /resultats-saisis/{posteId}/valider

# 5. Rejeter un poste incorrect
PATCH /resultats-saisis/{posteId}/rejeter

# 6. Écrire une observation globale pour le CA
PATCH /compilations/{compilationId}/observation
Body: { "observation": "Poste 3 à corriger: suffrages incohérents" }
```

---

### Scénario 2 : Flux CA - Correction d'un poste rejeté

```
# 1. Login CA
POST /auth/login
Body: { "email": "ca1@mairie.bj" }

# 2. Vérifier OTP
POST /auth/verify
Body: { "email": "ca1@mairie.bj", "code": "123456" }

# 3. Voir mes postes rejetés (avec l'observation de l'Admin)
GET /mes-postes-rejetes
Headers: Authorization: Bearer {token}

# 4. Corriger le poste rejeté
PUT /resultats-saisis/{posteId}
Body: {
  "nombreInscrits": 500,
  "nombreVotants": 420,
  "suffragesExprimes": 400,
  "abstentions": 80,
  "resultPartis": [...]
}

# Le status repasse a COMPLETEE
# L'Admin peut maintenant re-valider
```

---

### Scénario 3 : Validation automatique de la Compilation

```
# Valider tous les postes un par un
PATCH /resultats-saisis/{poste1Id}/valider
PATCH /resultats-saisis/{poste2Id}/valider
PATCH /resultats-saisis/{poste3Id}/valider

# Quand le dernier poste est valide,
# la compilation passe AUTO à VALIDEE

# Vérifier :
GET /compilations/{compilationId}
# Reponse: { "status": "VALIDEE", "dateValidation": "..." }
```

---

## WORKFLOW COMPLET DE VALIDATION

1. CA saisit les resultats (POST /resultats-saisis)
2. CA cree la compilation avec photo PV (POST /compilations) - Status: EN_COURS
3. ADMIN consulte le dashboard (GET /compilations/{id}/dashboard)
4. ADMIN valide/rejette CHAQUE POSTE individuellement
   - PATCH /resultats-saisis/{id}/valider - Status devient VALIDEE
   - PATCH /resultats-saisis/{id}/rejeter - Status devient REJETEE
5. Si poste(s) rejete(s): ADMIN ecrit observation globale (PATCH /compilations/{id}/observation)
6. CA voit ses postes rejetes + observation (GET /mes-postes-rejetes)
7. CA corrige le poste rejete (PUT /resultats-saisis/{id}) - Status repasse a COMPLETEE
8. ADMIN re-valide le poste corrige
9. Quand TOUS les postes sont VALIDEE: Compilation passe automatiquement a VALIDEE

---

## Utilisateurs de Test

Après `npm run db:seed-test` :

| Email | Rôle | Description |
|-------|------|-------------|
| superadmin@mairie.bj | SUPER_ADMIN | Accès total |
| admin@mairie.bj | ADMIN | Validation des postes |
| ca1@mairie.bj | SA | Centre 1 |
| ca2@mairie.bj | SA | Centre 2 |
| agent@mairie.bj | AGENT | Agent terrain |

---

## Codes d'erreur specifiques

| Code | Message | Signification |
|------|---------|---------------|
| 422 | RESULT_ALREADY_VALIDATED | Poste déjà validé |
| 422 | POSTE_NOT_REJECTED | CA ne peut modifier qu'un poste rejeté |
| 422 | NOT_ALL_POSTES_VALIDATED | Tous les postes doivent être validés |
| 422 | PHOTO_REQUIRED | Photo requise pour valider compilation |

---

## Notes importantes

- Les opérations pour SUPER_ADMIN sont réservées uniquement aux administrateurs
- Les opérations pour les utilisateurs authentifiés sont disponibles pour tous les utilisateurs connectés
- Tous les IDs utilisant le format CUID (chaîne aléatoire)
- Les dates doivent être au format ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
- Les réponses réussies retournent un code HTTP 200 (sauf 201 pour les créations)

---

**Version :** 2.0  
**Dernière mise à jour :** 8 janvier 2026
