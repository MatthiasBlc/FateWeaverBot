# Phase 1: Quick Wins - État d'Avancement

**Date**: 2025-11-04
**Priorité**: 🟡 Moyenne (après Phase 4 terminée)

---

## 1.1 Centralisation Emojis 🎯

### État Actuel
- **Status**: ⏸️ EN COURS (30% complété)
- **Fichiers avec emojis hardcodés**: 33 fichiers identifiés
- **Occurrences totales**: ~119 emojis hardcodés

### Fichiers Déjà Conformes ✅
- `constants/messages.ts` - ✅ Utilise déjà `${STATUS.ERROR}` partout
- Handlers Phase 4 (projects, chantiers) - ✅ Conformes

### Fichiers À Corriger (33 fichiers)

#### Deploy Scripts (3 fichiers)
- [ ] `deploy-commands-force.ts` - 7 occurrences
- [ ] `deploy-commands.ts` - 1 occurrence
- [ ] `commands/_template.ts` - 1 occurrence

#### Expeditions Handlers (8 fichiers) - 🔴 PRIORITAIRE
- [ ] `expedition-create.ts` - 5 occurrences
- [ ] `expedition-create-resources.ts` - 1 occurrence
- [ ] `expedition-display.ts` - 4 occurrences
- [ ] `expedition-emergency.ts` - 4 occurrences
- [ ] `expedition-join.ts` - 2 occurrences
- [ ] `expedition-leave.ts` - 2 occurrences
- [ ] `expedition-resource-management.ts` - ? occurrences
- [ ] `expedition-transfer.ts` - 2+ occurrences

#### Admin Handlers (13 fichiers)
- [ ] `character-admin/character-capabilities.ts`
- [ ] `character-admin/character-objects.ts`
- [ ] `character-admin/character-skills.ts`
- [ ] `character-admin/character-stats.ts`
- [ ] `emoji-admin.handlers.ts`
- [ ] `expedition-admin.handlers.ts`
- [ ] `expedition-admin-resource-handlers.ts`
- [ ] `projects-admin/project-add/step-1-init.ts`
- [ ] `projects-admin/project-add/step-2-types.ts`
- [ ] `projects-admin/project-add/step-5-finalize.ts`
- [ ] `projects-admin/project-delete.ts`
- [ ] `projects-admin/project-edit.ts`
- [ ] `stock-admin/stock-add.ts`
- [ ] `stock-admin/stock-remove.ts`

#### Projects/Users (6 fichiers)
- [ ] `projects/handlers/projects-display.ts`
- [ ] `projects/handlers/projects-helpers.ts`
- [ ] `projects/handlers/projects-view.ts`
- [ ] `projects/project-creation.ts`
- [ ] `users/give-object.handlers.ts`
- [ ] `users/users.handlers.ts`

#### Utils (2 fichiers)
- [ ] `utils/button-handler.ts`
- [ ] `utils/embeds.ts`

---

## Pattern de Remplacement

### Avant (❌ À éviter)
```typescript
content: "❌ Erreur lors de l'opération"
logger.warn("⚠️  Attention !")
await reply({ content: "✅ Succès" })
```

### Après (✅ Correct)
```typescript
import { STATUS, SYSTEM } from "@shared/constants/emojis";

content: `${STATUS.ERROR} Erreur lors de l'opération`
logger.warn(`${SYSTEM.WARNING} Attention !`)
await reply({ content: `${STATUS.SUCCESS} Succès` })
```

---

## Métriques

| Métrique | Valeur |
|----------|--------|
| **Fichiers totaux** | 33 |
| **Fichiers corrigés** | 0 |
| **Progression** | 0% |
| **Emojis hardcodés restants** | ~119 |
| **Token savings estimés** | 200-250 tokens |
| **Temps estimé** | 4-6 heures |

---

## Script d'Automatisation

Un script de remplacement automatique a été créé:
- **Localisation**: `bot/scripts/centralize-emojis.js`
- **Usage**: `node scripts/centralize-emojis.js`
- **Attention**: Tester sur un fichier d'abord!

---

## Prochaines Étapes

### Option 1: Automatisation Complète
1. Tester le script sur 1-2 fichiers
2. Vérifier que le build passe
3. Exécuter sur tous les fichiers
4. Créer commit unique

### Option 2: Correction Progressive (RECOMMANDÉ)
1. Corriger fichiers expeditions (impact utilisateur)
2. Corriger fichiers admin
3. Corriger utils/projects/users
4. Créer commit par groupe

---

## Impact

### Token Savings
- **Estimé**: 200-250 tokens par session AI
- **% du total**: ~5% du budget tokens

### Qualité Code
- **Maintenabilité**: ++ (centralisation)
- **Consistency**: ++ (même pattern partout)
- **Documentation**: ++ (emojis constants avec noms explicites)

---

**Dernière mise à jour**: 2025-11-04
**Par**: Claude Code
**Status**: ⏸️ Documenté, prêt pour implémentation progressive
