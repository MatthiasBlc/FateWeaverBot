FROM node:20-alpine

WORKDIR /app

# Copy shared folder
COPY ./shared ./shared

# Install dependencies as root first
COPY ./bot/package.json ./bot/package-lock.json ./
RUN npm ci && npm install -g tsx

# Create logs directory and set permissions
RUN mkdir -p /app/logs && \
    chown -R node:node /app

# Copy source code
COPY --chown=node:node ./bot .

# Switch to non-root user
USER node

# Install app dependencies as non-root user
RUN npm ci --no-optional

# Expose health port (default 3001)
EXPOSE 3001

# Default command (can be overridden in docker-compose)
CMD ["npm", "start"]