#!/bin/bash
set -e

echo "[deploy_prod] Vérification des variables critiques..."

# Variables critiques obligatoires
: "${PORTAINER_API:?Missing PORTAINER_API}"
: "${STACK_ID:?Missing STACK_ID}"
: "${ENDPOINT_ID:?Missing ENDPOINT_ID}"
: "${POSTGRES_PASSWORD:?Missing POSTGRES_PASSWORD}"
: "${DISCORD_TOKEN:?Missing DISCORD_TOKEN}"
: "${SESSION_SECRET:?Missing SESSION_SECRET}"

# Export des variables critiques dans l'environnement
export POSTGRES_PASSWORD
export POSTGRES_USER="${POSTGRES_USER}"
export POSTGRES_DB="${POSTGRES_DB}"
export DISCORD_TOKEN
export SESSION_SECRET
export PORTAINER_USERNAME=${PORTAINER_USERNAME}
export PORTAINER_PASSWORD=${PORTAINER_PASSWORD}
export PORTAINER_URL=${PORTAINER_URL}

echo "[deploy_prod] Variables chargées :"
echo "[deploy_prod] PORTAINER_URL=$PORTAINER_URL"
echo "[deploy_prod] STACK_ID=$STACK_ID"
echo "[deploy_prod] ENDPOINT_ID=$ENDPOINT_ID"
echo "[deploy_prod] POSTGRES_USER=$POSTGRES_USER"
echo "[deploy_prod] POSTGRES_DB=$POSTGRES_DB"

# Vérifier si le fichier docker-compose.prod.yml existe
if [ ! -f docker-compose.prod.yml ]; then
  echo "[deploy_prod] ERREUR: docker-compose.prod.yml introuvable"
  exit 1
fi

# Substituer les variables dans le docker-compose local
STACK_CONTENT=$(envsubst < docker-compose.prod.yml)
echo "[deploy_prod] YAML substitué sauvegardé dans stack_debug_subst.yml"
echo "$STACK_CONTENT" > stack_debug_subst.yml

# Construire JSON pour Portainer
STACK_JSON=$(jq -Rn --arg yml "$STACK_CONTENT" \
  '{"prune":true,"pullImage":true,"stackFileContent":$yml}')

TMP_FILE=$(mktemp)
echo "$STACK_JSON" > "$TMP_FILE"

# Déployer via l'API Portainer
STACK_UPDATE_URL="https://portainer.matthias-bouloc.fr/api/stacks/${STACK_ID}?endpointId=${ENDPOINT_ID}"

echo "[deploy_prod] Mise à jour de la stack ID: $STACK_ID..."
HTTP_CODE=$(curl -s -o response.json -w "%{http_code}" -X PUT \
  "$STACK_UPDATE_URL" \
  -H "X-API-Key: $PORTAINER_API" \
  -H "Content-Type: application/json" \
  --data @"$TMP_FILE")

echo "[deploy_prod] HTTP code: $HTTP_CODE"
cat response.json

if [ "$HTTP_CODE" -ne 200 ]; then
  echo "[deploy_prod] Stack update failed"
  rm -f "$TMP_FILE" response.json
  exit 1
fi

echo "[deploy_prod] Stack déployée avec succès !"
rm -f "$TMP_FILE" response.json
exit 0
