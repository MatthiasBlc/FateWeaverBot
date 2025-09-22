#!/bin/sh
set -e

# Déployer les commandes
echo "Deploying commands..."
if [ "$NODE_ENV" = "development" ]; then
  npm run deploy-commands:dev
else
  node dist/deploy-commands.js
fi

# Démarrer le bot
echo "Starting bot in ${NODE_ENV} mode..."
if [ "$NODE_ENV" = "development" ]; then
  npm run dev
else
  npm start
fi