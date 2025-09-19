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

# Générer le client Prisma
RUN npx prisma generate

# Copier le reste des fichiers
COPY . .

# Rendre le script deploy.sh exécutable
RUN chmod +x /app/deploy.sh

# Exposer le port de l'application
EXPOSE 3000

# Commande par défaut
CMD ["/app/deploy.sh"]