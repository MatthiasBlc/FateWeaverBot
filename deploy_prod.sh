#!/bin/bash
set -e

echo "🔍 Vérification des variables critiques..."
echo "PORTAINER_URL: ${PORTAINER_URL:?Missing PORTAINER_URL}"
echo "PORTAINER_USERNAME: [REDACTED]"
echo "PORTAINER_PASSWORD: [REDACTED]"
echo "STACK_ID: ${STACK_ID:?Missing STACK_ID}"
echo "ENDPOINT_ID: ${ENDPOINT_ID:?Missing ENDPOINT_ID}"

# Vérification des variables sensibles (sans les afficher)
: "${PORTAINER_USERNAME:?Missing PORTAINER_USERNAME}"
: "${PORTAINER_PASSWORD:?Missing PORTAINER_PASSWORD}"

# Récupération du token d'authentification
echo "🔑 Authentification auprès de Portainer..."
echo "URL d'API: $PORTAINER_URL/api/auth"

# Ajout de l'option -v pour le débogage et capture du code de statut HTTP
HTTP_STATUS=$(curl -s -o /tmp/auth_response -w "%{http_code}" -X POST \
  "$PORTAINER_URL/api/auth" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$PORTAINER_USERNAME\",\"password\":\"$PORTAINER_PASSWORD\"}")

AUTH_RESPONSE=$(cat /tmp/auth_response)
echo "Code HTTP: $HTTP_STATUS"
echo "Réponse brute: $AUTH_RESPONSE"

# Vérification du code de statut HTTP
if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "❌ Erreur lors de l'authentification (HTTP $HTTP_STATUS)"
  echo "Réponse du serveur: $AUTH_RESPONSE"
  exit 1
fi

# Vérification que la réponse est un JSON valide
if ! jq -e . >/dev/null 2>&1 <<<"$AUTH_RESPONSE"; then
  echo "❌ La réponse de l'API n'est pas un JSON valide"
  echo "Réponse reçue: $AUTH_RESPONSE"
  exit 1
fi

# Extraction du token JWT
TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.jwt')
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Échec de l'authentification: JWT non trouvé dans la réponse"
  echo "Réponse complète: $AUTH_RESPONSE"
  exit 1
fi

# Vérification du fichier docker-compose
if [ ! -f "docker-compose.prod.yml" ]; then
  echo "❌ Fichier docker-compose.prod.yml introuvable"
  exit 1
fi

# Préparation du contenu en utilisant envsubst si nécessaire
echo "📄 Préparation du contenu du docker-compose..."
if command -v envsubst >/dev/null 2>&1; then
  COMPOSE_CONTENT=$(envsubst < docker-compose.prod.yml)
  echo "$COMPOSE_CONTENT" > /tmp/docker-compose-substituted.yml
  COMPOSE_CONTENT=$(cat /tmp/docker-compose-substituted.yml | jq -Rs .)
else
  echo "⚠️ envsubst non trouvé, utilisation du fichier brut"
  COMPOSE_CONTENT=$(cat docker-compose.prod.yml | jq -Rs .)
fi

# Création du payload dans un fichier temporaire
echo "📦 Préparation du payload..."
TMP_PAYLOAD=$(mktemp)
jq -n \
  --arg content "$COMPOSE_CONTENT" \
  --arg registry_url "${REGISTRY_URL:-registry.matthias-bouloc.fr}" \
  --arg image_name "${IMAGE_NAME:-fateweaver}" \
  --arg tag "${GITHUB_SHA:-latest}" \
  '{
    "stackFileContent": $content,
    "prune": true,
    "pullImage": true,
    "env": [
      {"name": "REGISTRY_URL", "value": $registry_url},
      {"name": "IMAGE_NAME", "value": $image_name},
      {"name": "TAG", "value": $tag}
    ]
  }' > "$TMP_PAYLOAD"

# Debug: Afficher le payload
echo "📄 Payload généré :"
cat "$TMP_PAYLOAD" | jq .

# Mise à jour de la stack
echo "🔄 Mise à jour de la stack Portainer (ID: $STACK_ID)..."
RESPONSE_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" -X PUT \
  "$PORTAINER_URL/api/stacks/$STACK_ID?endpointId=$ENDPOINT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @"$TMP_PAYLOAD")

# Affichage de la réponse
echo "📥 Réponse de l'API (HTTP $RESPONSE_CODE):"
cat /tmp/response.json | jq .

# Nettoyage
rm -f "$TMP_PAYLOAD" /tmp/response.json /tmp/docker-compose-substituted.yml 2>/dev/null || true

# Vérification du code de statut
if [ "$RESPONSE_CODE" -eq 200 ]; then
  echo "✅ Stack mise à jour avec succès !"
  exit 0
else
  echo "❌ Erreur lors de la mise à jour de la stack"
  exit 1
fi