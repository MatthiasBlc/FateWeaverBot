#!/bin/bash

# Script to find exported functions without explicit return types
# Usage: ./scripts/check-return-types.sh

echo "🔍 Recherche des fonctions exportées sans type de retour..."
echo ""

# Find all TypeScript files except node_modules and dist
find src -name "*.ts" -type f | while read -r file; do
  # Look for exported async functions without ": Promise<" return type
  # Also look for exported regular functions without return type

  # Pattern: export async function name( ... ) { without ): Promise<
  if grep -n "export async function" "$file" | grep -v ": Promise<" > /dev/null; then
    echo "📄 $file"
    grep -n "export async function" "$file" | grep -v ": Promise<" | head -3
    echo ""
  fi

  # Pattern: export function name( ... ) { without ): type
  if grep -n "export function" "$file" | grep -v "export async" | grep -v "): " > /dev/null; then
    echo "📄 $file"
    grep -n "export function" "$file" | grep -v "export async" | grep -v "): " | head -3
    echo ""
  fi
done

echo "✅ Recherche terminée"
