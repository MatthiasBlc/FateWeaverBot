#!/bin/bash
set -e

echo "🔍 Vérification des variables critiques..."

# Forcer l'URL à utiliser HTTPS si ce n'est pas déjà le cas
if [[ ! "$PORTAINER_URL" =~ ^https:// ]]; then
  if [[ "$PORTAINER_URL" =~ ^http:// ]]; then
    PORTAINER_URL="https://${PORTAINER_URL#http://}"
  else
    PORTAINER_URL="https://$PORTAINER_URL"
  fi
  echo "⚠️  L'URL a été mise à jour pour utiliser HTTPS: $PORTAINER_URL"
fi

# Afficher les variables (sans les mots de passe)
echo "PORTAINER_URL: $PORTAINER_URL"
echo "PORTAINER_USERNAME: ${PORTAINER_USERNAME:0:3}***"
echo "STACK_ID: ${STACK_ID:?Missing STACK_ID}"
echo "ENDPOINT_ID: ${ENDPOINT_ID:?Missing ENDPOINT_ID}"

# Vérification des variables sensibles
: "${PORTAINER_USERNAME:?Missing PORTAINER_USERNAME}"
: "${PORTAINER_PASSWORD:?Missing PORTAINER_PASSWORD}"
: "${POSTGRES_PASSWORD:?Missing POSTGRES_PASSWORD}"
: "${SESSION_SECRET:?Missing SESSION_SECRET}"
: "${DISCORD_TOKEN:?Missing DISCORD_TOKEN}"

# Récupération du token d'authentification
echo "🔑 Authentification auprès de Portainer..."
API_URL="$PORTAINER_URL/api/auth"
echo "URL d'API: $API_URL"

echo "Envoi de la requête d'authentification..."
HTTP_RESPONSE=$(curl -L -k -s -w "\n%{http_code}\n" -X POST \
  "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$PORTAINER_USERNAME\",\"password\":\"$PORTAINER_PASSWORD\"}" 2>&1)

# Extraction du code HTTP et du corps de la réponse
HTTP_STATUS=$(echo "$HTTP_RESPONSE" | tail -n1)
AUTH_RESPONSE=$(echo "$HTTP_RESPONSE" | sed -n '/^[{[]/p' | tail -1)

echo "Code HTTP final: $HTTP_STATUS"
echo "En-têtes de la réponse:"
echo "$HTTP_RESPONSE" | grep -v '^[{}]' | grep -v '^$' | head -n -2

# Vérification du code de statut HTTP
if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "❌ Erreur lors de l'authentification (HTTP $HTTP_STATUS)"
  echo "Réponse du serveur: $AUTH_RESPONSE"
  exit 1
fi

# Extraction du token JWT
TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.jwt' 2>/dev/null || echo "$AUTH_RESPONSE" | grep -oP '(?<="jwt":")([^"]+)')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Impossible d'extraire le token JWT de la réponse"
  echo "Réponse complète: $AUTH_RESPONSE"
  exit 1
fi

echo "✅ Token JWT extrait avec succès"

# Fonction pour décoder le JWT
decode_jwt() {
  local jwt="$1"
  local payload=$(echo "$jwt" | cut -d'.' -f2)
  local len=$((${#payload} % 4))
  
  if [ $len -eq 2 ]; then payload="$payload=="
  elif [ $len -eq 3 ]; then payload="$payload="
  fi
  
  echo "$payload" | base64 -d 2>/dev/null | jq '.'
}

# Afficher les infos du token JWT (pour débogage)
echo "Décodage du JWT:"
decode_jwt "$TOKEN"
echo "--------------------------------"

# Vérification des permissions de l'utilisateur
echo "🔍 Vérification des permissions de l'utilisateur..."
USER_INFO=$(curl -s -k -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$PORTAINER_URL/api/users")

echo "Informations utilisateur:"
echo "$USER_INFO" | jq '.'

# Vérification de l'endpoint
echo "🔍 Vérification de l'endpoint (ID: $ENDPOINT_ID)..."
ENDPOINT_INFO=$(curl -s -k -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$PORTAINER_URL/api/endpoints/$ENDPOINT_ID")

echo "Informations de l'endpoint:"
echo "$ENDPOINT_INFO" | jq '.'

# Vérification de la stack
echo "🔍 Vérification de la stack (ID: $STACK_ID)..."
STACK_INFO=$(curl -s -k -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "$PORTAINER_URL/api/stacks/$STACK_ID?endpointId=$ENDPOINT_ID")

echo "Informations de la stack:"
echo "$STACK_INFO" | jq '.'

# Mise à jour de la stack
echo "🔄 Mise à jour de la stack..."
UPDATE_RESPONSE=$(curl -s -k -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"stackFileContent\": $(jq -n --arg version '3.8' --arg image "registry.matthias-bouloc.fr/${IMAGE_NAME:-fateweaver}/backend:${TAG:-latest}" --arg botImage "registry.matthias-bouloc.fr/${IMAGE_NAME:-fateweaver}/bot:${TAG:-latest}" --arg postgresPass "$POSTGRES_PASSWORD" --arg sessionSecret "$SESSION_SECRET" --arg discordToken "$DISCORD_TOKEN" --arg corsOrigin "$CORS_ORIGIN" '{
      "version": $version,
      "services": {
        "fateweaver-postgres": {
          "image": "postgres:15",
          "restart": "always",
          "container_name": "fateweaver-postgres",
          "hostname": "fateweaver-postgres",
          "environment": {
            "POSTGRES_USER": "fateweaver",
            "POSTGRES_PASSWORD": $postgresPass,
            "POSTGRES_DB": "fateweaver",
            "POSTGRES_INITDB_ARGS": "--data-checksums",
            "POSTGRES_HOST_AUTH_METHOD": "trust"
          },
          "volumes": [
            "postgres_data:/var/lib/postgresql/data"
          ],
          "networks": ["internal"],
          "healthcheck": {
            "test": ["CMD-SHELL", "pg_isready -U fateweaver -d fateweaver"],
            "interval": "10s",
            "timeout": "5s",
            "retries": 5,
            "start_period": "30s"
          }
        },
        "fateweaver-backend": {
          "image": $image,
          "container_name": "fateweaver-backend",
          "hostname": "fateweaver-backend",
          "restart": "unless-stopped",
          "environment": {
            "NODE_ENV": "production",
            "DATABASE_URL": "postgresql://fateweaver:\($postgresPass)@fateweaver-postgres:5432/fateweaver?schema=backend&connection_limit=20&pool_timeout=30",
            "PORT": "3000",
            "NODE_OPTIONS": "--max-old-space-size=1024",
            "PRISMA_CLIENT_ENGINE_TYPE": "library",
            "CORS_ORIGIN": $corsOrigin,
            "SESSION_SECRET": $sessionSecret
          },
          "ports": ["3000:3000"],
          "depends_on": {
            "fateweaver-postgres": {
              "condition": "service_healthy"
            }
          },
          "networks": ["internal"],
          "healthcheck": {
            "test": ["CMD", "wget", "--spider", "http://localhost:3000/health"],
            "interval": "30s",
            "timeout": "10s",
            "retries": 3,
            "start_period": "30s"
          }
        },
        "fateweaver-discord-bot": {
          "image": $botImage,
          "container_name": "fateweaver-discord-bot",
          "hostname": "fateweaver-discord-bot",
          "restart": "always",
          "environment": {
            "NODE_ENV": "production",
            "DISCORD_TOKEN": $discordToken,
            "API_URL": "http://fateweaver-backend:3000",
            "HEALTH_URL": "http://localhost:3001/health"
          },
          "volumes": ["bot-logs:/app/logs"],
          "healthcheck": {
            "test": ["CMD", "wget", "--spider", "-q", "http://localhost:3001/health"],
            "interval": "30s",
            "timeout": "10s",
            "retries": 3,
            "start_period": "10s"
          },
          "depends_on": {
            "fateweaver-backend": {
              "condition": "service_healthy"
            }
          },
          "networks": ["internal"]
        }
      },
      "networks": {
        "internal": {
          "driver": "bridge",
          "name": "fateweaver_internal"
        }
      },
      "volumes": {
        "postgres_data": {
          "name": "fateweaver_postgres_data"
        },
        "bot-logs": {
          "name": "fateweaver_bot_logs"
        }
      }
    }' | jq -c .)
  }" \
  "$PORTAINER_URL/api/stacks/$STACK_ID?endpointId=$ENDPOINT_ID")

echo "Réponse de la mise à jour de la stack:"
echo "$UPDATE_RESPONSE" | jq '.'

if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de la mise à jour de la stack"
  exit 1
fi

echo "✅ Déploiement réussi !"