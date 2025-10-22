#!/bin/sh
# Fix imports for Docker build (rootDir: . instead of ../)
# This script adjusts relative paths for shared imports

echo "🔧 Fixing imports for Docker build..."

# Fix towns.ts: ../../../shared -> ../../shared
sed -i 's|"../../../shared/|"../../shared/|g' src/controllers/towns.ts

# Fix seed.ts: ../../shared -> ../shared
sed -i 's|"../../shared/|"../shared/|g' prisma/seed.ts

echo "✅ Imports fixed for Docker (rootDir: .)"
