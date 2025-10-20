# Étape de construction
FROM node:18.18-alpine3.17 AS builder

# Création des dossiers nécessaires
WORKDIR /app

# Copie du dossier shared d'abord
COPY ./shared /shared

# Copie des fichiers de configuration et de dépendances
COPY ./backend/package*.json ./
COPY ./backend/prisma ./prisma/

# Installation des dépendances
RUN npm ci

# Génération du client Prisma
RUN npx prisma generate

# Copie du code source (sans écraser les fichiers de config déjà copiés)
COPY ./backend/src ./src
COPY ./backend/tsconfig.json ./

# Construction de l'application
RUN npm run build

# Vérification de la structure du build avec plus de détails
RUN echo "=== Vérification après build ===" && \
    ls -la /app/dist/ && \
    echo "=== Fichiers JS générés ===" && \
    find /app/dist -maxdepth 2 -name "*.js" | head -20 && \
    echo "=== Vérification server.js à la racine ===" && \
    test -f /app/dist/server.js && echo "✅ server.js trouvé à /app/dist/server.js" || echo "❌ server.js manquant à la racine"

# Compilation du fichier de seeding
RUN cd prisma && npx tsc seed.ts --module commonjs --target es2020 --moduleResolution node --allowJs

# Suppression des dépendances de développement
RUN npm prune --production

# Étape d'exécution
FROM node:18.18-alpine3.17

WORKDIR /app

# Copie du dossier shared
COPY --from=builder /shared /shared

# Copie des fichiers nécessaires depuis le builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Installation de Prisma et des outils nécessaires
RUN npm install -g prisma && \
    apk update && \
    apk add --no-cache openssl wget

# Exposition du port
EXPOSE 3000

# Commande de démarrage (applique les migrations puis lance le serveur compilé)
CMD ["npm", "run", "start:migrate:prod"]