#!/bin/bash
set -e

echo "=== DÉBUT DU SCRIPT DE DÉPLOIEMENT ==="

# Installer les dépendances
echo "=== INSTALLATION DES DÉPENDANCES ==="
if [ "$NODE_ENV" = "production" ]; then
  npm ci --only=production
else
  npm install
fi

# Générer le client Prisma
echo "=== GÉNÉRATION DU CLIENT PRISMA ==="
npx prisma generate

# En production, on utilise le code déjà compilé
if [ "$NODE_ENV" != "production" ]; then
  # Attendre que la base de données soit prête
  echo "=== ATTENTE DE LA BASE DE DONNÉES ==="
  until nc -z $POSTGRES_HOST 5432; do
    echo "En attente de la base de données..."
    sleep 2
  done

  # Appliquer les migrations
  echo "=== APPLICATION DES MIGRATIONS ==="
  npx prisma migrate deploy || {
    echo "=== ÉCHEC DE LA MIGRATION - TENTATIVE DE DB PUSH ==="
    npx prisma db push --accept-data-loss
  }
fi

# Démarrer l'application
echo "=== DÉMARRAGE DE L'APPLICATION ==="
if [ "$NODE_ENV" = "production" ]; then
  exec node dist/server.js
else
  exec npm start
fi