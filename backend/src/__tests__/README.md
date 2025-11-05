# Tests Backend

Ce dossier contient les tests d'intégration et unitaires pour le backend FateWeaverBot.

## Structure

```
__tests__/
├── README.md (ce fichier)
├── setup.ts (configuration Jest globale)
├── cron/ (tests pour les tâches CRON)
│   └── midnight-tasks.test.ts
└── helpers/ (utilitaires pour les tests)
    └── test-data.ts
```

## Exécution des tests

### ⚠️ Important : Exécuter dans Docker

Les tests nécessitent les variables d'environnement et l'accès à la base de données.
**Toujours exécuter les tests depuis le container Docker :**

```bash
# Tous les tests
dce backenddev npm test

# Un test spécifique
dce backenddev npm test -- midnight-tasks.test.ts

# Avec verbose
dce backenddev npm test -- midnight-tasks.test.ts --verbose

# Watch mode
dce backenddev npm run test:watch

# Coverage
dce backenddev npm run test:coverage
```

### ❌ Ne PAS exécuter en local

```bash
# ❌ Ceci échouera (pas de DATABASE_URL)
npm test
```

## Tests disponibles

### `cron/midnight-tasks.test.ts`

Tests d'intégration pour les tâches CRON de minuit, notamment :

1. **Retour catastrophique DEPARTED** : Vérifie qu'un membre d'une expédition DEPARTED qui ne peut pas payer 2 PA (car il régénère seulement +1 PA avec hungerLevel ≤ 1) est correctement retiré de l'expédition avec un log de retour catastrophique.

2. **Paiement normal** : Vérifie qu'un membre avec suffisamment de PA peut payer et rester dans l'expédition.

3. **Edge case LOCKED** : Vérifie que les membres d'expéditions LOCKED avec PA insuffisant peuvent faire un paiement partiel et rester dans l'expédition (ne devrait jamais arriver en production).

## Helpers de test

### `helpers/test-data.ts`

Utilitaires pour créer et nettoyer des données de test :

- `createTestCharacter()` : Crée un personnage de test
- `createTestExpedition()` : Crée une expédition de test
- `addExpeditionMember()` : Ajoute un membre à une expédition
- `cleanupTestData()` : Nettoie les données de test par pattern de nom
- `getTestTownAndUser()` : Récupère une ville et un utilisateur valides pour les tests

### Exemple d'utilisation

```typescript
import {
  createTestCharacter,
  createTestExpedition,
  addExpeditionMember,
  cleanupTestData,
  getTestTownAndUser,
} from '../helpers/test-data';

describe('My Test Suite', () => {
  let townId: string;
  let userId: string;
  const TEST_PREFIX = 'MyTest';

  beforeAll(async () => {
    const testData = await getTestTownAndUser();
    townId = testData.townId;
    userId = testData.userId;
  });

  afterEach(async () => {
    await cleanupTestData(TEST_PREFIX);
  });

  it('should create a test character', async () => {
    const characterId = await createTestCharacter({
      name: `${TEST_PREFIX}_Character`,
      paTotal: 4,
      hungerLevel: 3,
      hp: 5,
      pm: 5,
      townId,
      userId,
    });

    // ... your test assertions
  });
});
```

## Bonnes pratiques

1. **Préfixer les noms** : Toujours préfixer les noms de test avec un pattern unique (ex: `TestCatastrophic_`) pour faciliter le nettoyage

2. **Cleanup** : Toujours nettoyer les données après chaque test avec `cleanupTestData()`

3. **Isolation** : Chaque test doit être indépendant et ne pas dépendre d'autres tests

4. **Données réalistes** : Utiliser des données qui reflètent des scénarios réels du jeu

## Configuration Jest

La configuration Jest se trouve dans `/backend/jest.config.js` :

- Tests détectés via le pattern `**/__tests__/**/*.test.ts`
- Timeout par défaut : 10 secondes
- Setup global : `src/__tests__/setup.ts`
- Coverage threshold : 70%

## Ajout de nouveaux tests

1. Créer un nouveau fichier `*.test.ts` dans le dossier approprié
2. Utiliser les helpers de `test-data.ts` pour créer des fixtures
3. Nettoyer les données après chaque test
4. Exécuter dans Docker

## Troubleshooting

### Erreur "DATABASE_URL not found"

→ Vous essayez d'exécuter les tests en local. Utilisez `dce backenddev npm test` à la place.

### Tests qui timeout

→ Augmentez le timeout dans jest.config.js ou utilisez `jest.setTimeout()` dans votre test.

### Données de test non nettoyées

→ Vérifiez que vous appelez bien `cleanupTestData()` dans `afterEach()`.
