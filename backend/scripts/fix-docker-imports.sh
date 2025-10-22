#!/bin/sh
# Fix imports for Docker build (rootDir: . instead of ../)
# This script adjusts relative paths for shared imports

echo "🔧 Fixing imports for Docker build..."

# Fix towns.ts: ../../../shared -> ../../shared (Alpine sed compatible)
sed -i.bak 's|"../../../shared/|"../../shared/|g' src/controllers/towns.ts && rm src/controllers/towns.ts.bak

# Fix seed.ts: ../../shared -> ../shared (Alpine sed compatible)
sed -i.bak 's|"../../shared/|"../shared/|g' prisma/seed.ts && rm prisma/seed.ts.bak

echo "✅ Imports fixed for Docker (rootDir: .)"
echo "Checking seed.ts import:"
grep "shared/constants" prisma/seed.ts || echo "⚠️  Warning: Could not verify seed.ts import"
