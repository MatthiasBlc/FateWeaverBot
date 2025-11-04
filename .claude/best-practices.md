# Best Practices - FateWeaverBot

Conventions de code et règles critiques pour le développement. **Lire systématiquement avant toute modification.**

---

## 🚨 Règles Critiques (NE PAS IGNORER)

### 1. Modal Handlers - registerHandler vs registerHandlerByPrefix

**Fichier concerné:** `bot/src/utils/modal-handler.ts`

**Règle absolue:**
- Si l'ID du modal contient une variable dynamique (`${...}`), utilisez **TOUJOURS** `registerHandlerByPrefix()`
- Si l'ID du modal est statique (pas de template literal), utilisez `registerHandler()`

**Pourquoi c'est critique:**
- Un modal avec ID dynamique + `registerHandler()` → **handler jamais trouvé** → erreur générique "Une erreur s'est produite"
- Difficulté de debug : aucun log d'erreur spécifique, symptôme silencieux

**Exemples:**

```typescript
// ❌ MAUVAIS - ID dynamique avec registerHandler
// Le modal ne sera JAMAIS intercepté
.setCustomId(`chantier_resource_quantity_${resourceId}`)
this.registerHandler("chantier_resource_quantity_", handler)

// ✅ BON - ID dynamique avec registerHandlerByPrefix
.setCustomId(`chantier_resource_quantity_${resourceId}`)
this.registerHandlerByPrefix("chantier_resource_quantity_", handler)

// ✅ BON - ID statique avec registerHandler
.setCustomId("chantier_create_modal")
this.registerHandler("chantier_create_modal", handler)
```

**Historique des bugs corrigés (2025-11-04):**
- `chantier_resource_quantity_` (ligne 552)
- `project_resource_quantity_` (ligne 615)
- `character_admin_advanced_modal_` (ligne 105)
- `expedition_transfer_amount_modal_` (ligne 215)

**Vérification rapide:**
```bash
# Chercher les modals avec IDs dynamiques
grep "setCustomId.*\${" bot/src/**/*.ts

# Vérifier les handlers correspondants dans modal-handler.ts
grep "registerHandler\|registerHandlerByPrefix" bot/src/utils/modal-handler.ts
```

---

## 📋 Conventions de Code

### Emojis
- ❌ **JAMAIS** hardcoder d'emojis dans le code (`"🎉"`, `"✅"`)
- ✅ **TOUJOURS** importer depuis `@shared/constants/emojis`
- Tous les emojis doivent être documentés avec leur usage

**Fichier:** `shared/constants/emojis.ts`

---

## 🔍 Checklist de Vérification

Avant de commit du code impliquant des modals Discord:

- [ ] Tous les modals avec `${...}` utilisent `registerHandlerByPrefix()`
- [ ] Tous les modals statiques utilisent `registerHandler()`
- [ ] Les emojis sont importés, pas hardcodés
- [ ] Compilation TypeScript sans erreurs (`npm run build`)
- [ ] Test manuel de la fonctionnalité ajoutée/modifiée

---

## 📚 Ressources Additionnelles

- **Architecture complète:** `.claude/reference.md`
- **Protocole Supernova:** `.claude/supernova-quick-ref.md`
- **Erreurs à éviter:** `.claude/lessons-learned.md`
- **Contexte intelligent:** `.claude/context-guide.md`

---

**Dernière mise à jour:** 2025-11-04
**Mainteneur:** Système de mémoire Claude Code
