# Phase 2.1: Error Handler Utility - STARTED ✅

**Date**: 2025-10-30
**Status**: 🚧 **FOUNDATION CREATED** (~20% done)
**Tokens restants**: ~8%

---

## ✅ Ce qui a été fait

### 1. Fichier créé: `/bot/src/utils/error-handlers.ts`

**Fonctions implémentées**:

1. **`handleApiError()`** - Gère erreurs API avec réponse Discord
2. **`withErrorHandler()`** - Wrapper pour try-catch automatique
3. **`is404Error()`** - Détecte erreurs 404
4. **`errorContains()`** - Cherche texte dans erreur
5. **`getErrorMessage()`** - Extrait message lisible

**Build status**: ✅ PASSING

---

## 📊 Impact attendu

**Blocs try-catch dans le code**: 623+ occurrences

**Pattern actuel** (répété 623 fois):
```typescript
try {
  // API call
} catch (error: any) {
  logger.error("Error in X:", { error });
  await interaction.reply({
    content: `❌ Erreur : ${error.message}`,
    ephemeral: true
  });
}
```

**Nouveau pattern** (avec utility):
```typescript
await withErrorHandler(interaction, async () => {
  // API call
}, { context: "operation name" });
```

**Réduction**: ~10-15 lignes → 3 lignes par bloc = **~80% de code en moins**

---

## 🎯 Prochaines étapes

### Phase 2.1 (suite) - ~4h restantes

1. ✅ Créer utility de base
2. ⏳ Appliquer à 5-10 fichiers pilotes
3. ⏳ Créer script d'automatisation (optionnel)
4. ⏳ Documenter patterns d'utilisation

**Estimation tokens savings**: ~200-300 tokens

---

## 💡 Utilisation

### Pattern 1: Wrapper automatique
```typescript
import { withErrorHandler } from "../../utils/error-handlers";

export async function myHandler(interaction: ButtonInteraction) {
  await withErrorHandler(interaction, async () => {
    const data = await apiService.getData();
    // Logique métier
  }, {
    context: "récupération des données",
    customMessage: "Impossible de charger les données"
  });
}
```

### Pattern 2: Gestion manuelle
```typescript
import { handleApiError } from "../../utils/error-handlers";

try {
  // Code
} catch (error) {
  await handleApiError(error, interaction, {
    context: "opération",
    ephemeral: true
  });
}
```

---

## 📈 Progrès Phase 2

| Task | Status |
|------|--------|
| 2.1 Error handler utility | 🚧 20% |
| 2.2 Add return types | ⏳ 0% |
| 2.3 Reduce type assertions | ⏳ 0% |

---

**Créé**: 2025-10-30 ~17:15
**Tokens utilisés**: ~2,000
**À continuer**: Appliquer aux fichiers réels (nécessite plus de tokens)
