#!/bin/sh
set -e

echo "=== DÉBUT DU SCRIPT DE DÉPLOIEMENT ==="
echo "Répertoire de travail: $(pwd)"
echo "Contenu du répertoire:"
ls -la

# Vérifier que le fichier existe
if [ ! -f "/app/package.json" ]; then
  echo "ERREUR: Le fichier package.json est introuvable dans /app/"
  exit 1
fi

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

# Vérifier si on est en production
if [ "$NODE_ENV" = "production" ]; then
  echo "=== MODE PRODUCTION ==="
  
  # Vérifier que le répertoire dist existe
  if [ ! -d "dist" ]; then
    echo "ERREUR: Le répertoire dist/ est manquant. Le build a-t-il échoué ?"
    exit 1
  fi
  
  # Démarrer l'application
  echo "=== DÉMARRAGE DE L'APPLICATION ==="
  exec node dist/server.js
else
  echo "=== MODE DÉVELOPPEMENT ==="
  
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

  # Démarrer l'application en mode développement
  echo "=== DÉMARRAGE EN MODE DÉVELOPPEMENT ==="
  exec npm start
fi