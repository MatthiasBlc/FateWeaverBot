#!/bin/bash
set -e

echo "[deploy_prod] Vérification des variables critiques..."
: "${PORTAINER_URL:?Missing PORTAINER_URL}"
: "${PORTAINER_API:?Missing PORTAINER_API}"
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
echo "[deploy_prod] - PORTAINER_URL: $PORTAINER_URL"
echo "[deploy_prod] - IMAGE_NAME: $IMAGE_NAME"
echo "[deploy_prod] - TAG: ${TAG:0:7}..."

# Nettoyer l'URL et ajouter /api si nécessaire
PORTAINER_URL=${PORTAINER_URL%/}
[[ ! $PORTAINER_URL =~ /api$ ]] && PORTAINER_URL="${PORTAINER_URL}/api"

# Récupérer le YAML actuel de la stack depuis Portainer
echo "[deploy_prod] Récupération du docker-compose existant depuis Portainer..."
STACK_YAML=$(curl -s -H "X-API-Key: $PORTAINER_API" \
  "$PORTAINER_URL/stacks/$STACK_ID?endpointId=$ENDPOINT_ID" \
  | jq -r '.StackFileContent')

if [ -z "$STACK_YAML" ]; then
  echo "[deploy_prod] ERREUR: Impossible de récupérer le docker-compose de la stack"
  exit 1
fi

# Construire le bloc env à partir des variables critiques
ENV_VARS_JSON=$(jq -n \
  --arg POSTGRES_PASSWORD "$POSTGRES_PASSWORD" \
  --arg DISCORD_TOKEN "$DISCORD_TOKEN" \
  --arg SESSION_SECRET "$SESSION_SECRET" \
  --arg PORTAINER_USERNAME "${PORTAINER_USERNAME:-}" \
  --arg PORTAINER_PASSWORD "${PORTAINER_PASSWORD:-}" \
  --arg PORTAINER_URL "$PORTAINER_URL" \
  '[
    {name: "POSTGRES_PASSWORD", value: $POSTGRES_PASSWORD},
    {name: "DISCORD_TOKEN", value: $DISCORD_TOKEN},
    {name: "SESSION_SECRET", value: $SESSION_SECRET},
    {name: "PORTAINER_USERNAME", value: $PORTAINER_USERNAME},
    {name: "PORTAINER_PASSWORD", value: $PORTAINER_PASSWORD},
    {name: "PORTAINER_URL", value: $PORTAINER_URL}
  ]'
)

# Construire le JSON final pour le PUT
STACK_JSON=$(jq -n \
  --arg yml "$STACK_YAML" \
  --argjson env "$ENV_VARS_JSON" \
  '{"prune":true,"pullImage":true,"stackFileContent":$yml,"env":$env}')

TMP_FILE=$(mktemp)
echo "$STACK_JSON" > "$TMP_FILE"

STACK_UPDATE_URL="${PORTAINER_URL}/stacks/${STACK_ID}?endpointId=${ENDPOINT_ID}"

echo "[deploy_prod] Mise à jour de la stack ID: $STACK_ID..."
HTTP_CODE=$(curl -s -o response.json -w "%{http_code}" -L \
  -X PUT \
  "$STACK_UPDATE_URL" \
  -H "X-API-Key: $PORTAINER_API" \
  -H "Content-Type: application/json" \
  --data @"$TMP_FILE"
)

echo "[deploy_prod] HTTP code: $HTTP_CODE"

if [ "$HTTP_CODE" -ne 200 ]; then
  echo "[deploy_prod] ERREUR: Échec de la mise à jour de la stack (HTTP $HTTP_CODE)"
  cat response.json
  rm -f "$TMP_FILE" response.json
  exit 1
fi

echo "[deploy_prod] Stack mise à jour avec succès !"
rm -f "$TMP_FILE" response.json
exit 0
