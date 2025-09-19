#!/bin/bash
set -e

echo "[deploy_prod] Vérification des variables critiques..."
: "${PORTAINER_URL:?Missing PORTAINER_URL}"
: "${PORTAINER_USERNAME:?Missing PORTAINER_USERNAME}"
: "${PORTAINER_PASSWORD:?Missing PORTAINER_PASSWORD}"
: "${STACK_ID:?Missing STACK_ID}"
: "${ENDPOINT_ID:?Missing ENDPOINT_ID}"
: "${POSTGRES_PASSWORD:?Missing POSTGRES_PASSWORD}"
: "${DISCORD_TOKEN:?Missing DISCORD_TOKEN}"
: "${SESSION_SECRET:?Missing SESSION_SECRET}"

# Configuration par défaut
export REGISTRY_URL=${REGISTRY_URL:-'registry.matthias-bouloc.fr'}
export IMAGE_NAME=${IMAGE_NAME:-'fateweaver'}
export TAG=${TAG:-'latest'}
export CORS_ORIGIN=${CORS_ORIGIN:-'https://fateweaver.matthias-bouloc.fr'}

echo "[deploy_prod] Configuration:"
echo "[deploy_prod] - REGISTRY_URL: $REGISTRY_URL"
echo "[deploy_prod] - IMAGE_NAME: $IMAGE_NAME"
echo "[deploy_prod] - TAG: $TAG"
echo "[deploy_prod] - CORS_ORIGIN: $CORS_ORIGIN"

# Obtenir un jeton JWT de Portainer
echo "[deploy_prod] Authentification auprès de Portainer..."
AUTH_RESPONSE=$(curl -s \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$PORTAINER_USERNAME\",\"password\":\"$PORTAINER_PASSWORD\"}" \
  "${PORTAINER_URL}/api/auth")

if [ $? -ne 0 ] || [ -z "$AUTH_RESPONSE" ]; then
  echo "[deploy_prod] ERREUR: Échec de l'authentification auprès de Portainer"
  exit 1
fi

JWT=$(echo $AUTH_RESPONSE | jq -r '.jwt')
if [ -z "$JWT" ] || [ "$JWT" = "null" ]; then
  echo "[deploy_prod] ERREUR: JWT non reçu dans la réponse d'authentification"
  echo "[deploy_prod] Réponse: $AUTH_RESPONSE"
  exit 1
fi

echo "[deploy_prod] Authentification réussie"

# Vérifier si le fichier docker-compose.prod.yml existe
if [ ! -f docker-compose.prod.yml ]; then
  echo "[deploy_prod] ERREUR: docker-compose.prod.yml introuvable"
  exit 1
fi

# Substituer les variables d'environnement dans le fichier docker-compose
echo "[deploy_prod] Préparation de la configuration de la stack..."
STACK_CONTENT=$(envsubst < docker-compose.prod.yml)

# Créer un fichier temporaire avec le contenu de la stack
TMP_FILE=$(mktemp)
echo "$STACK_CONTENT" > "$TMP_FILE"

echo "[deploy_prod] Mise à jour de la stack ID: $STACK_ID..."
HTTP_CODE=$(curl -s -o response.json -w "%{http_code}" \
  -X PUT \
  "${PORTAINER_URL}/api/stacks/${STACK_ID}?endpointId=${ENDPOINT_ID}" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  --data @- <<EOF
{
  "prune": true,
  "pullImage": true,
  "stackFileContent": $(jq -Rs . < "$TMP_FILE")
}
EOF
)

echo "[deploy_prod] HTTP code: $HTTP_CODE"
cat response.json

# Nettoyer les fichiers temporaires
rm -f "$TMP_FILE" response.json

if [ "$HTTP_CODE" -ne 200 ]; then
  echo "[deploy_prod] ERREUR: Échec de la mise à jour de la stack"
  exit 1
fi

echo "[deploy_prod] Déploiement réussi!"
exit 0
