# Étape de construction
FROM node:18.18-alpine3.17 AS builder

# Création des dossiers nécessaires
WORKDIR /app

# Copie des fichiers de configuration
COPY ./backend/package*.json ./
COPY ./backend/prisma ./prisma/
COPY ./backend/tsconfig.json ./
COPY ./backend/tsconfig.docker.json ./

# Installation des dépendances
RUN npm ci

# Génération du client Prisma
RUN npx prisma generate

# Copie du dossier shared AVANT la compilation (nécessaire pour les imports)
COPY ./shared ./shared

# Copie du code source et scripts
COPY ./backend/src ./src
COPY ./backend/scripts ./scripts

# Fix imports pour Docker (rootDir: . au lieu de ../)
RUN sh ./scripts/fix-docker-imports.sh

# Construction de l'application avec tsconfig Docker
RUN npx tsc -p tsconfig.docker.json

# Vérification de la structure du build
RUN echo "=== Vérification après build ===" && \
    ls -la /app/dist/ && \
    echo "=== Vérification server.js ===" && \
    test -f /app/dist/src/server.js && echo "✅ server.js trouvé à /app/dist/src/server.js" || echo "❌ server.js manquant"

# Compilation du fichier de seeding (déjà ajusté par le script)
RUN npx tsc prisma/seed.ts --module commonjs --target es2020 --moduleResolution node --allowJs --outDir prisma

# Suppression des dépendances de développement
RUN npm prune --production

# Étape d'exécution
FROM node:18.18-alpine3.17

WORKDIR /app

# Copie des fichiers nécessaires depuis le builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/prisma ./prisma

# Installation de Prisma et des outils nécessaires
RUN npm install -g prisma && \
    apk update && \
    apk add --no-cache openssl wget

# Exposition du port
EXPOSE 3000

# Commande de démarrage (applique les migrations puis lance le serveur compilé)
CMD ["npm", "run", "start:migrate:prod"]