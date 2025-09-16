FROM node:20-alpine

WORKDIR /app

# Install dependencies (include devDeps for tsx/typescript)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose health port (default 3001)
EXPOSE 3001

# Start the bot using tsx
CMD ["npm", "run", "dev"]