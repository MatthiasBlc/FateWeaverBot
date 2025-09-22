#!/bin/bash
# fichier: prisma-docker.sh
# usage: ./prisma-docker.sh [all|generate|migrate]
# depuis la racine du projet

set -e

COMMAND=${1:-all}
MIGRATION_NAME=${2:-auto_migration}
MIGRATIONS_DIR="./backend/prisma/migrations"
SCHEMA_FILE="./backend/prisma/schema.prisma"
SCHEMA_HASH_FILE="$MIGRATIONS_DIR/.schema_hash"

echo "🌟 Prisma Docker Helper"

run_in_backend() {
  docker compose run --rm backenddev npx prisma "$@"
}

generate_client() {
  echo "💡 Génération du client Prisma..."
  run_in_backend generate
}

apply_migrations() {
  if [ ! -d "$MIGRATIONS_DIR" ] || [ ! "$(ls -A $MIGRATIONS_DIR)" ]; then
    echo "💡 Pas de migrations existantes, création initiale..."
    run_in_backend migrate dev --name "$MIGRATION_NAME"
    save_schema_hash
  elif [ ! -f "$SCHEMA_HASH_FILE" ] || [ "$(sha256sum "$SCHEMA_FILE" | awk '{print $1}')" != "$(cat $SCHEMA_HASH_FILE)" ]; then
    echo "💡 Schema modifié, création d'une nouvelle migration..."
    run_in_backend migrate dev --name "$MIGRATION_NAME"
    save_schema_hash
  else
    echo "💡 Application des migrations existantes..."
    run_in_backend migrate deploy
  fi
}

save_schema_hash() {
  mkdir -p "$MIGRATIONS_DIR"
  sha256sum "$SCHEMA_FILE" | awk '{print $1}' > "$SCHEMA_HASH_FILE"
}

case "$COMMAND" in
  generate)
    generate_client
    ;;

  migrate)
    apply_migrations
    ;;

  all)
    generate_client
    apply_migrations
    ;;

  *)
    echo "Usage: $0 [generate|migrate|all]"
    exit 1
    ;;
esac

echo "✅ Terminé !"
