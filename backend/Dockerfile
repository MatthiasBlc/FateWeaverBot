FROM node:18.18-alpine3.17

# Installer les dépendances système nécessaires
RUN apk add --no-cache netcat-openbsd

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste des fichiers
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Compiler le code TypeScript
RUN npm run build

# Copier le script de déploiement avec les bonnes permissions
RUN chmod +x ./deploy.sh

# Exposer le port de l'application
EXPOSE 3000

# Commande par défaut
CMD ["./deploy.sh"]