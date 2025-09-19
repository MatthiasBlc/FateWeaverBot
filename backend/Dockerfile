FROM node:18.18-alpine3.17

# Installer les dépendances système nécessaires
RUN apk add --no-cache netcat-openbsd

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production

# Copier le script avec les bonnes permissions
COPY --chmod=755 deploy.sh ./

# Copier le reste des fichiers
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Exposer le port de l'application
EXPOSE 3000

# Vérifier les permissions
RUN ls -la /app/deploy.sh && \
    id && \
    whoami

# Commande par défaut
CMD ["/bin/sh", "/app/deploy.sh"]