# Étape de construction
FROM node:18.18-alpine3.17 AS builder

# Création des dossiers nécessaires
RUN mkdir -p /app/config /app/src
WORKDIR /app

# Copie des fichiers de configuration et de dépendances
COPY prisma ./prisma/
COPY @types ./@types/
COPY tsconfig.json ./
COPY .eslintrc.js ./
COPY package*.json ./

# Installation des dépendances et génération du client Prisma
RUN npm install
RUN npx prisma generate

# Copie du code source
COPY . .

# Construction de l'application
RUN npm run build

# Suppression des dépendances de développement
RUN npm prune --production

# Étape d'exécution
FROM node:18.18-alpine3.17

# Création des dossiers nécessaires
RUN mkdir -p /app/config /app/src
WORKDIR /app

# Copie des fichiers nécessaires depuis le builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Installation de Prisma et des outils nécessaires
RUN npm install -g prisma
RUN apk --no-cache add openssl

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "run", "start:migrate:prod"]