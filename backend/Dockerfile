FROM node:18.18-alpine3.17

# Installer les dépendances système nécessaires
RUN apk add --no-cache netcat-openbsd

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances (y compris les dépendances de développement pour TypeScript)
RUN npm ci

# Copier le script avec les bonnes permissions
COPY --chmod=755 deploy.sh ./

# Copier le reste des fichiers
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Installer ts-node globalement pour exécuter les fichiers TypeScript directement
RUN npm install -g ts-node

# Vérifier les dépendances installées
RUN npm list typescript ts-node

# Exposer le port de l'application
EXPOSE 3000

# Commande par défaut
CMD ["/bin/sh", "/app/deploy.sh"]