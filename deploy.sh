#!/bin/bash
set -e

echo "=== DÉBUT DU SCRIPT DE DÉPLOIEMENT ==="

# Installation des dépendances
echo "=== INSTALLATION DES DÉPENDANCES ==="
npm install

# Compilation TypeScript
echo "=== COMPILATION TYPESCRIPT ==="
npx tsc

# Génération du client Prisma
echo "=== GÉNÉRATION DU CLIENT PRISMA ==="
npx prisma generate

# Attente que la base de données soit prête
echo "=== ATTENTE DE LA BASE DE DONNÉES ==="
until nc -z $POSTGRES_HOST 5432; do
  echo "En attente de la base de données..."
  sleep 2
done

# Application des migrations
echo "=== APPLICATION DES MIGRATIONS ==="
npx prisma migrate deploy || {
  echo "=== ÉCHEC DE LA MIGRATION - TENTATIVE DE DB PUSH ==="
  npx prisma db push --accept-data-loss
}

# Démarrage de l'application
echo "=== DÉMARRAGE DE L'APPLICATION ==="
node dist/main.js