# PROMPT SUPERNOVA - Phase 2: Harmonisation Complète Messages + Emojis

## 📋 CONTEXTE

Tu continues le travail d'harmonisation commencé. La structure est déjà en place :
- `/bot/src/constants/messages.ts` existe avec ~70 constantes
- `/bot/src/constants/emojis.ts` existe avec toutes les catégories

**Fichiers déjà traités:**
- ✅ `expedition-join.ts` - Messages harmonisés
- ✅ `expedition-create.ts` - Messages harmonisés
- ✅ `users.handlers.ts` - sendLogMessage corrigé (Point 5a)

## 🎯 OBJECTIF

Remplacer TOUS les messages hardcodés restants et emojis hardcodés dans les fichiers identifiés.

---

## 📝 PARTIE 1: Messages d'Erreur Restants

### Fichiers Prioritaires (11 fichiers)

#### 1. `/bot/src/features/chantiers/chantiers.handlers.ts`

**Remplacements:**

Ajouter import:
```typescript
import { ERROR_MESSAGES } from "../../constants/messages.js";
```

Remplacer:
- Ligne 156: `"Une erreur est survenue lors de la récupération des chantiers."` → `ERROR_MESSAGES.CHANTIER_FETCH_ERROR`
- Ligne 212: `"Une erreur est survenue lors de la récupération des chantiers."` → `ERROR_MESSAGES.CHANTIER_FETCH_ERROR`
- Ligne 373: `"Une erreur est survenue lors de la préparation de la participation."` → `ERROR_MESSAGES.CHANTIER_PARTICIPATE_ERROR`
- Ligne 379: `"Une erreur est survenue lors de la préparation de la participation."` → `ERROR_MESSAGES.CHANTIER_PARTICIPATE_ERROR`
- Ligne 508: `"Une erreur est survenue lors de la préparation de l'investissement."` → `ERROR_MESSAGES.CHANTIER_INVEST_ERROR`
- Ligne 514: `"Une erreur est survenue lors de la préparation de l'investissement."` → `ERROR_MESSAGES.CHANTIER_INVEST_ERROR`
- Ligne 908: `"❌ Une erreur est survenue lors du traitement de votre investissement. Veuillez réessayer."` → `ERROR_MESSAGES.CHANTIER_PROCESSING_ERROR`
- Ligne 1007: `"Une erreur est survenue lors de la préparation de la suppression."` → `ERROR_MESSAGES.CHANTIER_DELETE_PREP_ERROR`
- Ligne 1013: `"Une erreur est survenue lors de la préparation de la suppression."` → `ERROR_MESSAGES.CHANTIER_DELETE_PREP_ERROR`

---

#### 2. `/bot/src/features/users/users.handlers.ts`

**Remplacements:**

Ajouter import:
```typescript
import { ERROR_MESSAGES, INFO_MESSAGES } from "../../constants/messages.js";
```

Remplacer:
- Ligne 232: `"❌ Une erreur est survenue lors de l'affichage de votre profil."` → `INFO_MESSAGES.PROFILE_ERROR`
- Ligne 221: `"❌ Impossible de déterminer l'état de votre personnage. Veuillez contacter un administrateur."` → `INFO_MESSAGES.CHARACTER_STATUS_UNKNOWN`
- Ligne 205: `"❌ Votre personnage est mort. Utilisez la commande de reroll pour créer un nouveau personnage."` → `INFO_MESSAGES.REROLL_PROMPT`

---

#### 3. `/bot/src/features/admin/stock-admin/stock-add.ts`

**Remplacements:**

Ajouter import:
```typescript
import { ERROR_MESSAGES } from "../../../constants/messages.js";
```

Chercher et remplacer:
- `"❌ Une erreur est survenue lors de la préparation de l'ajout de ressources."` → `ERROR_MESSAGES.ADMIN_STOCK_ADD_PREP_ERROR`
- `"❌ Une erreur est survenue lors de la sélection de la ressource."` → `ERROR_MESSAGES.ADMIN_STOCK_RESOURCE_SELECT_ERROR`

---

#### 4. `/bot/src/features/admin/stock-admin/stock-display.ts`

**Remplacements:**

Ajouter import:
```typescript
import { ERROR_MESSAGES } from "../../../constants/messages.js";
```

Remplacer:
- `"❌ Une erreur est survenue lors de l'affichage de l'interface."` → `ERROR_MESSAGES.ADMIN_STOCK_DISPLAY_ERROR`
- `"❌ Une erreur est survenue lors de la récupération des ressources."` → `ERROR_MESSAGES.ADMIN_STOCK_FETCH_ERROR`

---

#### 5. `/bot/src/features/admin/stock-admin/stock-remove.ts`

**Remplacements:**

Ajouter import:
```typescript
import { ERROR_MESSAGES } from "../../../constants/messages.js";
```

Remplacer:
- `"❌ Une erreur est survenue lors de la préparation du retrait de ressources."` → `ERROR_MESSAGES.ADMIN_STOCK_REMOVE_PREP_ERROR`
- `"❌ Une erreur est survenue lors de la sélection de la ressource."` → `ERROR_MESSAGES.ADMIN_STOCK_RESOURCE_SELECT_ERROR`

---

#### 6. `/bot/src/features/admin/expedition-admin.handlers.ts`

**Remplacements:**

Ajouter import:
```typescript
import { ERROR_MESSAGES } from "../../constants/messages.js";
```

Remplacer:
- `"❌ Une erreur est survenue lors de la récupération des expéditions."` → `ERROR_MESSAGES.ADMIN_EXPEDITION_FETCH_ERROR`
- `"❌ Une erreur est survenue lors de la récupération des détails de l'expédition."` → `ERROR_MESSAGES.ADMIN_EXPEDITION_DETAILS_ERROR`
- `"❌ Une erreur est survenue lors de l'ouverture du formulaire de modification."` → `ERROR_MESSAGES.ADMIN_EXPEDITION_EDIT_FORM_ERROR`
- `"❌ Une erreur est survenue lors de l'affichage de la gestion des membres."` → `ERROR_MESSAGES.ADMIN_EXPEDITION_MEMBERS_ERROR`

---

#### 7. `/bot/src/features/admin/character-admin.handlers.ts`

**Remplacements:**

Ajouter import:
```typescript
import { ERROR_MESSAGES } from "../../constants/messages.js";
```

Remplacer:
- `"❌ Une erreur est survenue lors de la préparation de la commande."` → `ERROR_MESSAGES.ADMIN_COMMAND_PREP_ERROR`

---

## 🎨 PARTIE 2: Emojis Hardcodés

### Fichiers Prioritaires (15+ fichiers)

#### 1. `/bot/src/utils/discord-components.ts`

**Remplacements:**

Ajouter import:
```typescript
import { ACTIONS, UI } from "../constants/emojis.js";
```

Remplacer:
- Ligne 77: `"✅ Confirmer"` → `` `${ACTIONS.CONFIRM} Confirmer` ``
- Ligne 82: `"❌ Annuler"` → `` `${ACTIONS.CANCEL} Annuler` ``
- Ligne 152: `"⏮️ Premier"` → `` `${UI.FIRST} Premier` ``
- Ligne ~160: `"◀️ Précédent"` → `` `${UI.PREVIOUS} Précédent` ``
- Ligne ~165: `"▶️ Suivant"` → `` `${UI.NEXT} Suivant` ``
- Ligne 176: `"⏭️ Dernier"` → `` `${UI.LAST} Dernier` ``
- Ligne ~226: `"✏️ Modifier"` → `` `${ACTIONS.EDIT} Modifier` ``
- Ligne ~231: `"🗑️ Supprimer"` → `` `${ACTIONS.DELETE} Supprimer` ``

---

#### 2. `/bot/src/features/users/users.handlers.ts`

**Remplacements:**

Ajouter imports si manquants:
```typescript
import { RESOURCES, HUNGER } from "../../constants/emojis.js";
```

Remplacer:
- Ligne 354: `"Manger 🍞 (1)"` → `` `Manger ${RESOURCES.BREAD} (1)` ``
- Ligne 361: `"Manger 🍽️ (1)"` → `` `Manger ${HUNGER.ICON} (1)` ``
- Ligne 411: `"💀"` → `HUNGER.DEAD`
- Ligne 466: `"❤️"` → `CHARACTER.HP_FULL`
- Ligne 483: `"🖤"` → `CHARACTER.HP_EMPTY`
- Ligne 483: `"❤️‍🩹"` → `CHARACTER.HP_BANDAGED`
- Lignes 660-664: `'🏹' '🌿' '🎣' '🎭' '🔮'` → `CAPABILITIES.HUNT, CAPABILITIES.GATHER, CAPABILITIES.FISH, CAPABILITIES.ENTERTAIN, CAPABILITIES.GENERIC`

---

#### 3. `/bot/src/features/expeditions/handlers/expedition-display.ts`

**Remplacements:**

Ajouter import:
```typescript
import { STATUS, LOCATION, TIME, EXPEDITION } from "../../../constants/emojis.js";
```

Remplacer tous les emojis hardcodés:
- `"❌"` → `STATUS.ERROR`
- `"🏕️"` → `EXPEDITION.PLANNING`
- `"⏱️"` → `TIME.STOPWATCH`
- `"⚠️"` → `STATUS.WARNING`
- `"🏛️"` → `LOCATION.TOWN`

---

#### 4. `/bot/src/features/expeditions/handlers/expedition-create.ts`

**Remplacements:**

Ajouter import:
```typescript
import { LOCATION, TIME, EXPEDITION, RESOURCES } from "../../../constants/emojis.js";
```

Remplacer:
- `"🏕️"` → `EXPEDITION.PLANNING`
- `"⏱️"` → `TIME.STOPWATCH`
- `"📦"` → `RESOURCES.GENERIC`
- `"🏛️"` → `LOCATION.TOWN`

---

#### 5. `/bot/src/features/expeditions/handlers/expedition-transfer.ts`

**Remplacements:**

Ajouter import:
```typescript
import { LOCATION } from "../../../constants/emojis.js";
```

Remplacer:
- Lignes 110, 704: `"🏛️"` → `LOCATION.TOWN`

---

#### 6. `/bot/src/features/expeditions/expedition-utils.ts`

**Remplacements:**

Ajouter import:
```typescript
import { EXPEDITION } from "../../constants/emojis.js";
```

Remplacer:
- Ligne 15: `"✈️ PARTIE"` → `` `${EXPEDITION.DEPARTED} PARTIE` ``

---

#### 7. `/bot/src/features/admin/character-admin.components.ts`

**Remplacements:**

Ajouter import:
```typescript
import { HUNGER, CHARACTER, CAPABILITIES } from "../../constants/emojis.js";
```

Remplacer:
- Ligne 52: `char.isDead ? "💀" : "❤️"` → `char.isDead ? HUNGER.DEAD : CHARACTER.HP_FULL`
- Ligne 108: `emoji: "🔮"` → `emoji: CAPABILITIES.GENERIC`
- Ligne 209: Même pattern

---

#### 8. `/bot/src/features/admin/expedition-admin.handlers.ts`

**Remplacements:**

Ajouter import:
```typescript
import { TIME, LOCATION, RESOURCES, ACTIONS, EXPEDITION } from "../../constants/emojis.js";
```

Remplacer:
- Lignes 104, 107-108: `"⏱️" "🏛️" "👤" "📦" "✅"` → `TIME.STOPWATCH, LOCATION.TOWN, CHARACTER.ICON, RESOURCES.GENERIC, ACTIONS.CONFIRM`
- Ligne 394: `"✈️ PARTIE"` → `` `${EXPEDITION.DEPARTED} PARTIE` ``

---

#### 9. `/bot/src/features/admin/character-admin/character-select.ts`

**Remplacements:**

Ajouter import:
```typescript
import { HUNGER } from "../../../constants/emojis.js";
```

Remplacer:
- Lignes 190, 199: `"💀"` → `HUNGER.DEAD`

---

#### 10. `/bot/src/features/admin/character-admin/character-stats.ts`

**Remplacements:**

Ajouter import:
```typescript
import { HUNGER, CHARACTER } from "../../../constants/emojis.js";
```

Remplacer:
- Lignes 85, 122, 202: `"💀" "❤️"` → `HUNGER.DEAD, CHARACTER.HP_FULL`

---

#### 11. `/bot/src/features/admin/character-admin/character-capabilities.ts`

**Remplacements:**

Ajouter import:
```typescript
import { CAPABILITIES, STATUS } from "../../../constants/emojis.js";
```

Remplacer:
- Lignes 34, 95, 142, 186, 197: `"🔮" "ℹ️"` → `CAPABILITIES.GENERIC, STATUS.INFO`

---

#### 12. `/bot/src/features/admin/stock-admin/stock-display.ts`

**Remplacements:**

Ajouter import:
```typescript
import { LOCATION } from "../../../constants/emojis.js";
```

Remplacer:
- Lignes 53, 153: `"🏛️"` → `LOCATION.TOWN`

---

#### 13. `/bot/src/features/death/death.handler.ts`

**Remplacements:**

Ajouter import:
```typescript
import { HUNGER } from "../../constants/emojis.js";
```

Remplacer:
- Lignes 29, 63: `"💀"` → `HUNGER.DEAD`

---

#### 14. `/bot/src/features/stock/stock.handlers.ts`

**Remplacements:**

Ajouter import:
```typescript
import { LOCATION } from "../../constants/emojis.js";
```

Remplacer:
- Ligne 77: `"🏙️"` → `LOCATION.CITY`

---

#### 15. `/bot/src/features/hunger/hunger.handlers.ts`

**Remplacements:**

Ajouter import:
```typescript
import { HUNGER } from "../../constants/emojis.js";
```

Remplacer:
- Lignes 33, 122, 235: `"🍽️"` → `HUNGER.ICON`

---

#### 16. `/bot/src/features/hunger/hunger.utils.ts`

**Remplacements:**

Ajouter import:
```typescript
import { HUNGER } from "../../constants/emojis.js";
```

Remplacer:
- Ligne 18: `"🍽️"` → `HUNGER.ICON`

---

#### 17. `/bot/src/features/config/config.handlers.ts`

**Remplacements:**

Ajouter import:
```typescript
import { STATUS, ADMIN } from "../../constants/emojis.js";
```

Remplacer:
- Lignes 128, 132: `"ℹ️" "⚙️"` → `STATUS.INFO, ADMIN.SETTINGS`

---

#### 18. `/bot/src/utils/hunger.ts`

**Remplacements:**

Ajouter import:
```typescript
import { HUNGER } from "../constants/emojis.js";
```

Remplacer:
- Ligne 32: `return "💀";` → `return HUNGER.DEAD;`

---

#### 19. `/bot/src/services/pm-contagion-listener.ts`

**Remplacements:**

Ajouter import:
```typescript
import { CHARACTER } from "../constants/emojis.js";
```

Remplacer:
- Ligne 49: `"🌧️"` → `CHARACTER.MP_DEPRESSION`

---

#### 20. `/bot/src/modals/character-modals.ts`

**Remplacements:**

Ajouter import:
```typescript
import { CHARACTER } from "../constants/emojis.js";
```

Remplacer:
- Ligne 117: `"❤️" "⚡"` → `` `${CHARACTER.HP_FULL} ${CHARACTER.PA}` ``
- Ligne 191: Même pattern

---

## ✅ VALIDATION FINALE

Après toutes les modifications:

```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot
npm run build
```

Vérifications grep:
```bash
# Vérifier qu'aucun message hardcodé ne reste
grep -r "❌ Aucun personnage actif" src/features/ --include="*.ts" | wc -l  # Doit être 0
grep -r "Une erreur est survenue lors" src/features/ --include="*.ts" | wc -l  # Doit être ~5 (admissible)

# Vérifier emojis hardcodés critiques
grep -r '"💀"' src/features/ --include="*.ts" | wc -l  # Doit être 0
grep -r '"🏛️"' src/features/ --include="*.ts" | wc -l  # Doit être 0
grep -r '"🍽️"' src/features/ --include="*.ts" | wc -l  # Doit être 0
```

---

## 📊 RAPPORT FINAL ATTENDU

Fournis:
1. ✅ Liste complète des fichiers modifiés (nombre exact)
2. 📊 Nombre total de remplacements (messages + emojis)
3. ⚠️ Fichiers où des messages restent (et pourquoi)
4. 🧪 Résultats build + grep
5. 📋 Résumé des accomplissements

---

**BON COURAGE ! 🚀**
