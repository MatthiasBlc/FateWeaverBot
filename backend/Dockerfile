# Étape de construction
FROM node:18.18-alpine3.17 AS builder

# Création des dossiers nécessaires
WORKDIR /app

# Copie du dossier shared d'abord
COPY ./shared /shared

# Copie des fichiers de configuration et de dépendances
COPY ./backend/package*.json ./
COPY ./backend/prisma ./prisma/
COPY ./backend/tsconfig.json ./

# Installation des dépendances
RUN npm ci

# Génération du client Prisma
RUN npx prisma generate

# Copie du code source
COPY ./backend .

# Construction de l'application
RUN npm run build

# Compilation du fichier de seeding
RUN npx tsc prisma/seed.ts --outDir prisma --module commonjs --target es2020 --moduleResolution node --allowJs

# Vérification de la structure du build
# RUN find /app/dist -type f -print

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