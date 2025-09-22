FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances de développement
RUN npm ci

# Copier les fichiers sources
COPY src/ ./src/

# Compiler le code TypeScript
RUN npm run build

# Étape d'exécution
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (y compris les devDependencies en développement)
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "$NODE_ENV" = "development" ]; then \
      npm ci; \
    else \
      npm ci --only=production; \
    fi

# Copier les fichiers compilés et le point d'entrée
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh /usr/local/bin/

# Rendre le point d'entrée exécutable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Créer le dossier des logs
RUN mkdir -p /app/logs && \
    chown -R node:node /app/logs

# Utilisateur non-root
USER node

# Exposer le port de santé
EXPOSE 3001

# Point d'entrée personnalisé
ENTRYPOINT ["docker-entrypoint.sh"]