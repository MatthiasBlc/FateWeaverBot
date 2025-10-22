# Guide Rapide - Démarrage des Tests

**Date**: 2025-10-22

---

## 🚀 Démarrage Ultra-Rapide (5 minutes)

### Étape 1 : Créer la Base de Test

```bash
# Depuis la racine du projet
docker compose exec postgres psql -U myuser -d postgres -c "CREATE DATABASE mydb_test;"

# Vérifier
docker compose exec postgres psql -U myuser -c "\l" | grep mydb_test
```

**Sortie attendue** :
```
 mydb_test | myuser   | UTF8     | ...
```

---

### Étape 2 : Tester les Migrations

```bash
# Appliquer les migrations sur la base de test
docker compose exec -e DATABASE_URL="postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public" backenddev npx prisma migrate deploy
```

**Sortie attendue** :
```
✅ All migrations have been applied successfully
```

---

### Étape 3 : Lancer les Tests Existants

```bash
# Depuis la racine du projet
docker compose exec backenddev npm test
```

**Sortie attendue** :
```
 PASS  src/__tests__/setup.ts
🧪 Test suite starting...
📊 Database: postgresql://...
✅ Migrations applied
✅ Common test data seeded
✅ Test suite completed

Test Suites: 1 passed, 1 total
Tests:       0 total
```

---

## 📊 Commandes Essentielles

### Tests de Base

```bash
# Lancer tous les tests
docker compose exec backenddev npm test

# Lancer en mode watch (redémarre automatiquement)
docker compose exec backenddev npm run test:watch

# Lancer avec coverage
docker compose exec backenddev npm run test:coverage
```

### Tests Ciblés

```bash
# Un fichier spécifique
docker compose exec backenddev npm test -- character.repository

# Pattern de fichiers
docker compose exec backenddev npm test -- --testPathPattern=repositories

# Un seul test (describe ou it)
docker compose exec backenddev npm test -- -t "should return active character"
```

### Debug et Logs

```bash
# Mode verbose
docker compose exec -e DEBUG_TESTS=true backenddev npm test

# Voir les queries SQL
docker compose exec -e DEBUG_TESTS=true backenddev npm test -- --verbose

# Logs Prisma
docker compose exec -e DATABASE_URL="postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public" -e DEBUG="prisma:*" backenddev npm test
```

---

## 🔧 Configuration par Défaut

### Variables d'Environnement

Le fichier `jest.config.js` utilise automatiquement :

```javascript
DATABASE_URL = "postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public"
NODE_ENV = "test"
```

**Pas besoin de créer un `.env.test`** sauf si vous voulez override ces valeurs.

---

## 📝 Créer Votre Premier Test

### 1. Créer le Fichier

```bash
# Repository test
mkdir -p backend/src/domain/repositories/__tests__
touch backend/src/domain/repositories/__tests__/character.repository.test.ts
```

### 2. Template Minimal

```typescript
import { CharacterRepository } from "../character.repository";
import { prisma, testUser, testTown, testJob, cleanupCharacters } from "../../../__tests__/setup";

describe("CharacterRepository", () => {
  let repo: CharacterRepository;

  beforeAll(() => {
    repo = new CharacterRepository(prisma);
  });

  afterEach(async () => {
    await cleanupCharacters();
  });

  it("should work", () => {
    expect(true).toBe(true);
  });
});
```

### 3. Lancer

```bash
docker compose exec backenddev npm test -- character.repository
```

---

## 🧪 Exemples Pratiques

### Test Repository Simple

```typescript
describe("findActiveCharacter", () => {
  it("should return active character", async () => {
    // Arrange: Créer données de test
    const character = await prisma.character.create({
      data: {
        userId: testUser.id,
        townId: testTown.id,
        name: "Test Hero",
        isActive: true,
        isDead: false,
        jobId: testJob.id,
        hp: 5, pm: 5, pa: 12, hungerLevel: 2
      }
    });

    // Act: Appeler la méthode testée
    const result = await repo.findActiveCharacter(testUser.id, testTown.id);

    // Assert: Vérifier le résultat
    expect(result).not.toBeNull();
    expect(result?.id).toBe(character.id);
  });
});
```

### Test Service avec Mock

```typescript
import { CharacterService } from "../character.service";
import { CharacterRepository } from "../../domain/repositories/character.repository";

jest.mock("../../domain/repositories/character.repository");

describe("CharacterService", () => {
  let service: CharacterService;
  let mockRepo: jest.Mocked<CharacterRepository>;

  beforeEach(() => {
    mockRepo = {
      findActiveCharacter: jest.fn()
    } as any;

    service = new CharacterService(mockRepo);
  });

  it("should return character", async () => {
    mockRepo.findActiveCharacter.mockResolvedValue({ id: "123" } as any);

    const result = await service.getActiveCharacter("user-1", "town-1");

    expect(result.id).toBe("123");
  });
});
```

### Test API avec Supertest

```typescript
import request from "supertest";
import { app } from "../../app";

describe("Character API", () => {
  it("should return 404 when not found", async () => {
    await request(app)
      .get("/api/characters/invalid/town-123")
      .expect(404);
  });
});
```

---

## 🐛 Debugging

### Problème : Tests Timeout

**Solution 1** : Augmenter le timeout

```typescript
// Dans le test
it("should do something", async () => {
  // ...
}, 30000); // 30 secondes

// Ou globalement dans jest.config.js
testTimeout: 30000
```

**Solution 2** : Vérifier la connexion DB

```bash
docker compose exec backenddev npx prisma db push --schema=./prisma/schema.prisma
```

### Problème : Base de Test Polluée

**Solution** : Reset complet

```bash
# Supprimer et recréer la base
docker compose exec postgres psql -U myuser -d postgres -c "DROP DATABASE IF EXISTS mydb_test;"
docker compose exec postgres psql -U myuser -d postgres -c "CREATE DATABASE mydb_test;"

# Réappliquer migrations
docker compose exec -e DATABASE_URL="postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public" backenddev npx prisma migrate deploy
```

### Problème : Tests Qui Échouent Aléatoirement

**Cause** : Données partagées entre tests

**Solution** : Utiliser `afterEach` pour cleanup

```typescript
afterEach(async () => {
  await cleanupCharacters();
  await cleanupExpeditions();
});
```

---

## 📊 Interpréter les Résultats

### Coverage Report

```bash
docker compose exec backenddev npm run test:coverage
```

**Sortie** :
```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   72.45 |    68.33 |   75.00 |   72.10 |
 repositories       |   85.71 |    80.00 |   90.00 |   85.50 |
  character.repo... |   90.00 |    85.00 |   95.00 |   89.75 | 45-48,67
 services           |   70.00 |    65.00 |   75.00 |   69.80 |
  character.serv... |   75.00 |    70.00 |   80.00 |   74.50 | 102,156-160
--------------------|---------|----------|---------|---------|-------------------
```

**Cibles** :
- ✅ >70% global = Bien
- ✅ >80% repositories = Excellent
- ✅ >75% services = Très bien

### Test Pass/Fail

```bash
 PASS  src/domain/repositories/__tests__/character.repository.test.ts (12.5 s)
  CharacterRepository
    findById
      ✓ should return character with full relations (45 ms)
      ✓ should return null for non-existent id (12 ms)
    findActiveCharacter
      ✓ should return active character (38 ms)
      ✓ should return null when no active character (8 ms)

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        18.521 s
```

---

## 🎯 Workflow Recommandé

### Développement de Tests

1. **Créer le fichier de test**
   ```bash
   touch backend/src/domain/repositories/__tests__/ma-feature.test.ts
   ```

2. **Lancer en watch mode**
   ```bash
   docker compose exec backenddev npm run test:watch -- ma-feature
   ```

3. **Écrire le test**
   - Red: Test échoue (normal, fonction pas encore implémentée)
   - Green: Implémenter la fonction pour passer le test
   - Refactor: Améliorer le code

4. **Vérifier le coverage**
   ```bash
   docker compose exec backenddev npm run test:coverage -- ma-feature
   ```

### Avant un Commit

```bash
# Lancer tous les tests
docker compose exec backenddev npm test

# Vérifier le coverage
docker compose exec backenddev npm run test:coverage

# Vérifier TypeScript
docker compose exec backenddev npm run typecheck

# Vérifier le build
docker compose exec backenddev npm run build
```

---

## 🔗 Ressources

### Documentation
- **Strategy complète** : `docs/backend-refactoring/09-TESTING-STRATEGY.md`
- **Exemples de tests** : `docs/backend-refactoring/09-TEST-EXAMPLES.md`
- **Ce guide** : `docs/backend-refactoring/09-QUICK-START-TESTS.md`

### Jest Documentation
- [Getting Started](https://jestjs.io/docs/getting-started)
- [Matchers](https://jestjs.io/docs/using-matchers)
- [Async/Await](https://jestjs.io/docs/asynchronous)

### Supertest
- [GitHub](https://github.com/ladjs/supertest)
- [API Testing Guide](https://www.digitalocean.com/community/tutorials/test-a-node-restful-api-with-mocha-and-chai)

---

## ✅ Checklist Rapide

### Setup Initial (une fois)
- [ ] Créer base `mydb_test`
- [ ] Tester connexion
- [ ] Vérifier migrations appliquées
- [ ] Lancer `npm test` pour valider setup

### Avant de Commencer à Coder
- [ ] Lire `09-TESTING-STRATEGY.md`
- [ ] Regarder exemples dans `09-TEST-EXAMPLES.md`
- [ ] Choisir le type de test (repo/service/API)

### Écrire un Test
- [ ] Créer le fichier dans `__tests__/`
- [ ] Importer les helpers du setup
- [ ] Écrire le describe/it
- [ ] Ajouter afterEach cleanup
- [ ] Lancer en watch mode

### Finaliser
- [ ] Coverage >70%
- [ ] Tous les tests passent
- [ ] TypeScript compile
- [ ] Documentation à jour

---

## 🚀 Commandes Copy-Paste

```bash
# Setup complet en une commande
docker compose exec postgres psql -U myuser -d postgres -c "CREATE DATABASE mydb_test;" && \
docker compose exec -e DATABASE_URL="postgresql://myuser:mypass@postgres:5432/mydb_test?schema=public" backenddev npx prisma migrate deploy && \
docker compose exec backenddev npm test

# Reset base de test
docker compose exec postgres psql -U myuser -d postgres << EOF
DROP DATABASE IF EXISTS mydb_test;
CREATE DATABASE mydb_test;
EOF

# Créer structure pour un nouveau test repository
mkdir -p backend/src/domain/repositories/__tests__ && \
touch backend/src/domain/repositories/__tests__/myrepo.repository.test.ts

# Lancer tests + coverage + build (CI check)
docker compose exec backenddev npm test && \
docker compose exec backenddev npm run test:coverage && \
docker compose exec backenddev npm run typecheck && \
docker compose exec backenddev npm run build && \
echo "✅ All checks passed!"
```

---

**Prêt à démarrer !** 🚀

Pour plus de détails, voir :
- `09-TESTING-STRATEGY.md` (stratégie complète)
- `09-TEST-EXAMPLES.md` (exemples de code)
