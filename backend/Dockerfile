FROM node:18.18-alpine3.17

# Installer les dépendances système nécessaires
RUN apk add --no-cache netcat-openbsd wget file

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

# Installer les dépendances
RUN npm ci

# Copier le script de déploiement avant le reste
COPY deploy.sh ./
RUN chmod +x /app/deploy.sh

# Copier le reste des fichiers
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Compiler le code TypeScript
RUN npm run build

# Vérifier que le script est bien présent
RUN ls -la /app/deploy.sh && \
    file /app/deploy.sh && \
    head -n 5 /app/deploy.sh

# Exposer le port de l'application
EXPOSE 3000

# Utiliser le shell pour exécuter le script
CMD ["/bin/sh", "-c", "/app/deploy.sh"]