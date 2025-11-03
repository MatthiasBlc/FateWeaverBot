# Error Handlers - Guide d'utilisation

Ce guide explique comment utiliser les utilitaires de gestion d'erreur centralisés (`src/utils/error-handlers.ts`) pour remplacer les patterns répétitifs de try-catch dans le codebase.

## 🎯 Objectif

Remplacer **623+ blocs try-catch répétitifs** par des helpers réutilisables qui :
- Standardisent le logging
- Gèrent automatiquement les réponses Discord
- Centralisent la logique de détection d'erreur (404, 401/403, etc.)
- Réduisent la duplication de code

---

## 📚 Fonctions disponibles

### 1. `handleApiError` - Gestion générique d'erreur API

**Utilisation :** Pour gérer toute erreur API avec logging et réponse Discord automatique.

```typescript
import { handleApiError } from "../utils/error-handlers";

try {
  const data = await apiService.getSomeData(id);
  // ... traiter les données
} catch (error) {
  await handleApiError(error, interaction, {
    context: "fetch some data",
    customMessage: `${STATUS.ERROR} Impossible de récupérer les données.`,
    logData: { resourceId: id }
  });
  return;
}
```

**Options :**
- `context` : Description de l'opération (pour les logs)
- `customMessage` : Message personnalisé pour l'utilisateur (optionnel)
- `ephemeral` : Si la réponse doit être éphémère (défaut: `true`)
- `logData` : Métadonnées additionnelles pour le logging

---

### 2. `handleCharacterError` - Gestion d'erreurs de personnage

**Utilisation :** Gère automatiquement les erreurs 404 (pas de personnage) et les personnages morts.

```typescript
import { handleCharacterError } from "../utils/error-handlers";

try {
  const character = await getActiveCharacterForUser(userId, guildId);
  // ... logique métier
} catch (error) {
  // Gère automatiquement 404 et personnage mort
  if (await handleCharacterError(error, interaction)) {
    return; // Erreur gérée, on sort
  }
  // Si l'erreur n'est pas gérée, la relancer ou gérer autrement
  throw error;
}
```

**Gère automatiquement :**
- ❌ 404 → "Aucun personnage vivant trouvé..."
- ❌ Personnage mort → Message d'erreur personnalisé

---

### 3. `handleExpeditionError` - Gestion d'erreurs d'expédition

**Utilisation :** Gère les erreurs spécifiques aux expéditions (404, autorisation, etc.)

```typescript
import { handleExpeditionError } from "../utils/error-handlers";

try {
  const expedition = await apiService.expeditions.getExpeditionById(expeditionId);
  // ... logique d'expédition
} catch (error) {
  await handleExpeditionError(error, interaction, {
    context: "fetch expedition details"
  });
  return;
}
```

**Gère automatiquement :**
- ❌ 404 → "Expédition introuvable"
- ❌ 401/403 → "Vous n'avez pas la permission..."
- ❌ Messages contenant "expédition" → Affichage du message d'erreur

---

### 4. `silentError` - Opérations non-critiques

**Utilisation :** Pour des opérations optionnelles qui ne doivent pas bloquer l'exécution principale.

```typescript
import { silentError } from "../utils/error-handlers";

// Récupérer les compétences, retourner [] si ça échoue
const skills = await silentError(
  () => apiService.getCharacterSkills(characterId),
  [], // Valeur par défaut si erreur
  "fetch character skills"
);

// Récupérer les objets, retourner [] si ça échoue
const objects = await silentError(
  () => apiService.getCharacterObjects(characterId),
  [],
  "fetch character objects"
);
```

**Avantage :** L'erreur est loggée (debug) mais n'interrompt pas le flux et ne notifie pas l'utilisateur.

---

### 5. `withErrorHandler` - Wrapper tout-en-un

**Utilisation :** Enveloppe une fonction async avec gestion d'erreur automatique.

```typescript
import { withErrorHandler } from "../utils/error-handlers";

export async function handleSomeButton(interaction: ButtonInteraction) {
  await withErrorHandler(interaction, async () => {
    // Toute la logique ici
    const character = await getActiveCharacterForUser(userId, guildId);
    const data = await apiService.getSomeData(character.id);

    await interaction.reply({
      content: `Succès: ${data.name}`,
      ephemeral: true
    });
  }, {
    context: "button some-action",
    customMessage: `${STATUS.ERROR} Une erreur est survenue lors de l'action.`
  });
}
```

**Avantage :** Pas besoin de try-catch explicite, tout est géré automatiquement.

---

## 🔧 Fonctions utilitaires de détection

### `is404Error(error: unknown): boolean`

Vérifie si une erreur est une erreur 404.

```typescript
if (is404Error(error)) {
  // Gérer spécifiquement le 404
}
```

### `isAuthError(error: unknown): boolean`

Vérifie si une erreur est 401/403 (autorisation).

```typescript
if (isAuthError(error)) {
  await replyEphemeral(interaction, `${STATUS.ERROR} Accès refusé.`);
  return;
}
```

### `isDeadCharacterError(error: unknown): boolean`

Vérifie si l'erreur indique un personnage mort.

```typescript
if (isDeadCharacterError(error)) {
  // Gérer personnage mort
}
```

### `errorContains(error: unknown, searchString: string): boolean`

Vérifie si le message d'erreur contient une chaîne spécifique.

```typescript
if (errorContains(error, "expédition")) {
  // Erreur liée à une expédition
}
```

### `getErrorMessage(error: unknown): string`

Extrait un message lisible depuis n'importe quel type d'erreur.

```typescript
const message = getErrorMessage(error);
logger.error("Operation failed:", { message });
```

---

## 🔄 Migration : Avant / Après

### Exemple 1 : Erreur API générique

**❌ AVANT (répété 623+ fois):**
```typescript
try {
  const data = await apiService.getData(id);
  // ...
} catch (error) {
  logger.error("Erreur lors de la récupération:", {
    error: error instanceof Error ? error.message : error,
    userId: interaction.user.id
  });

  await interaction.reply({
    content: `${STATUS.ERROR} Une erreur est survenue.`,
    ephemeral: true
  });
  return;
}
```

**✅ APRÈS (avec error-handlers):**
```typescript
try {
  const data = await apiService.getData(id);
  // ...
} catch (error) {
  await handleApiError(error, interaction, {
    context: "data fetch",
    logData: { dataId: id }
  });
  return;
}
```

---

### Exemple 2 : Erreur de personnage

**❌ AVANT:**
```typescript
try {
  character = await getActiveCharacterForUser(userId, guildId);
} catch (error: any) {
  if (error?.status === 404 || error?.message?.includes('404')) {
    await replyEphemeral(
      interaction,
      `${STATUS.ERROR} Aucun personnage vivant trouvé. Utilisez \`/start\`.`
    );
    return;
  }
  await replyEphemeral(interaction, error.message);
  return;
}
```

**✅ APRÈS:**
```typescript
try {
  character = await getActiveCharacterForUser(userId, guildId);
} catch (error) {
  if (await handleCharacterError(error, interaction)) {
    return;
  }
  throw error;
}
```

---

### Exemple 3 : Données optionnelles (non-critiques)

**❌ AVANT:**
```typescript
let skills = [];
try {
  skills = await apiService.getCharacterSkills(characterId);
} catch (error) {
  logger.debug("Erreur lors de la récupération des compétences:", error);
  // Continuer sans compétences
}
```

**✅ APRÈS:**
```typescript
const skills = await silentError(
  () => apiService.getCharacterSkills(characterId),
  [],
  "fetch character skills"
);
```

---

## 📊 Bénéfices

1. **Réduction du code** : ~60% moins de lignes pour la gestion d'erreur
2. **Cohérence** : Tous les messages d'erreur sont formatés de la même façon
3. **Maintenabilité** : Changement centralisé (un seul endroit à modifier)
4. **Type safety** : Gestion type-safe des erreurs TypeScript
5. **Meilleure UX** : Gestion automatique des interactions expirées

---

## 🎯 Prochaines étapes

1. Migrer progressivement les handlers existants
2. Commencer par les fichiers à haute fréquence (button-handler, users.handlers, etc.)
3. Vérifier que les tests passent après chaque migration
4. Documenter les patterns spécifiques au projet

---

**Note :** Ces helpers sont déjà utilisés dans les fichiers récemment refactorisés. Voir `expedition-display.ts`, `hunger.handlers.ts`, etc. pour des exemples concrets.
