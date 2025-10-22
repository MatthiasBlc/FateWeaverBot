#!/bin/sh
# Wrapper script to run seed with Docker-specific tsconfig

# Use tsconfig.docker.json if it exists (Docker environment), otherwise tsconfig.json
if [ -f "tsconfig.docker.json" ]; then
  echo "🐳 Running seed with Docker tsconfig..."
  tsx --tsconfig tsconfig.docker.json prisma/seed.ts
else
  echo "💻 Running seed with local tsconfig..."
  tsx --tsconfig tsconfig.json prisma/seed.ts
fi
