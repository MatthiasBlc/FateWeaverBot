#!/bin/sh
# Fix imports in compiled JavaScript files for Docker
# This script adjusts require() paths after TypeScript compilation

echo "🔧 Fixing compiled JavaScript imports..."

# Fix seed.js: require("../../shared") -> require("../shared")
if [ -f "prisma/seed.js" ]; then
  sed -i.bak 's|require("../../shared/|require("../shared/|g' prisma/seed.js && rm prisma/seed.js.bak
  echo "✅ Fixed prisma/seed.js"
  echo "Verifying seed.js import:"
  grep "require.*shared/constants" prisma/seed.js || echo "⚠️  Warning: Could not verify seed.js import"
else
  echo "⚠️  Warning: prisma/seed.js not found"
fi

# Fix towns.controller.js: require("../../../shared") -> require("../../shared")
if [ -f "dist/src/controllers/towns.js" ]; then
  sed -i.bak 's|require("../../../shared/|require("../../shared/|g' dist/src/controllers/towns.js && rm dist/src/controllers/towns.js.bak
  echo "✅ Fixed dist/src/controllers/towns.js"
else
  echo "⚠️  Warning: dist/src/controllers/towns.js not found"
fi

echo "✅ JavaScript imports fixed"
