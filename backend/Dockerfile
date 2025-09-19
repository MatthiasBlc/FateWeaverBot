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

# Copier d'abord uniquement le script deploy.sh
COPY deploy.sh ./

# Rendre le script exécutable
RUN chmod +x /app/deploy.sh

# Copier le reste des fichiers
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Exposer le port de l'application
EXPOSE 3000

# Vérifier que le fichier existe
RUN ls -la /app/deploy.sh

# Commande par défaut
CMD ["/bin/sh", "-c", "/app/deploy.sh"]