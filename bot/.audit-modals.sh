#!/bin/bash
# Audit script to find all modal handler imports and check if they exist

echo "=== MODAL HANDLER AUDIT ==="
echo ""
echo "Extracting all import statements from modal-handler.ts..."
echo ""

grep -A 2 'await import' src/utils/modal-handler.ts | \
grep -E 'const.*handleCharacterCreation|const.*handleReroll|const.*handleAdvancedStatsModalSubmit|const.*handleExpeditionCreationModal|const.*handleExpeditionResourceQuantityModal|const.*handleExpeditionResourceAddQuantity|const.*handleExpeditionResourceRemoveQuantity|const.*handleExpeditionModifyModal|const.*handleExpeditionTransferModal|const.*handleExpeditionDurationModal|const.*handleExpeditionResourceAddModal|const.*handleExpeditionResourceModifyModal|const.*handleInvestModalSubmit|const.*handleStockAdminAddModal|const.*handleStockAdminRemoveModal|const.*handleProjectAdminAddStep1Modal|const.*handleProjectAdminEditModal|const.*handleProjectAddQuantityModal|const.*handleProjectAddResourceQuantityModal' | \
while IFS= read -r line; do
    # Extract function name
    func=$(echo "$line" | sed -E 's/.*const \{ ([a-zA-Z0-9_]+).*/\1/')
    # Extract file path
    file=$(echo "$line" | sed -E 's/.*"([^"]+)".*/\1/' | sed 's/\.\.\//.\/src\//')

    if [ -f "$file" ]; then
        echo "Checking $func in $file..."
        if grep -q "export.*$func" "$file"; then
            echo "  ✅ FOUND: $func is exported"
        else
            echo "  ❌ MISSING: $func is NOT exported"
            echo "  Available exports:"
            grep -E 'export (async )?function|export const' "$file" | head -3
        fi
    else
        echo "  ⚠️  FILE NOT FOUND: $file"
    fi
    echo ""
done
