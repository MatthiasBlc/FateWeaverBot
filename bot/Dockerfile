FROM node:20-alpine

WORKDIR /app

# Install dependencies (include devDeps for tsx/typescript)
COPY package.json package-lock.json ./
RUN npm ci && npm install winston

# Create logs directory
RUN mkdir -p /app/logs && \
    chown -R node:node /app/logs

# Copy source code
COPY --chown=node:node . .

# Expose health port (default 3001)
EXPOSE 3001

# Switch to non-root user
USER node

# Start the bot using tsx
CMD ["npm", "run", "dev"]