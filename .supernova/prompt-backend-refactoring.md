# Backend Refactoring Plan - FateWeaverBot

## 📊 Analyse Initiale

### Structure Actuelle

**Architecture:**
- Backend REST API (Express + TypeScript + Prisma)
- ~10,783 lignes de code TypeScript
- 51 fichiers source
- Structure MVC (Models via Prisma, Views = Routes, Controllers)

**Organisation des dossiers:**
```
backend/src/
├── controllers/      # 11 fichiers - Gestion des requêtes HTTP
│   └── admin/        # 2 fichiers - Controllers admin
├── cron/             # 6 fichiers - Tâches planifiées
├── interfaces/       # 1 fichier - DTOs
├── middleware/       # 1 fichier - Auth middleware
├── routes/           # 10 fichiers - Définition des routes
│   └── admin/
├── services/         # 10 fichiers - Logique métier
├── types/            # 2 fichiers - Type definitions
├── util/             # 6 fichiers - Utilitaires
├── app.ts            # Configuration Express
└── server.ts         # Point d'entrée
```

### Fichiers les plus volumineux (complexité élevée)
1. `services/expedition.service.ts` - 1,326 lignes
2. `services/capability.service.ts` - 1,175 lignes
3. `controllers/characters.ts` - 941 lignes
4. `services/character.service.ts` - 672 lignes
5. `services/project.service.ts` - 444 lignes

### Points d'amélioration identifiés

#### 🔴 CRITIQUES
1. **Logging incohérent** - 111 occurrences de console.log/error/warn
   - Mélange de `console.log` et `logger` de Winston
   - Aucune structure de log uniforme
   - Difficile de filtrer/analyser les logs en production

2. **Duplication d'instance Prisma** - 33 fichiers importent Prisma
   - Chaque service crée sa propre instance `new PrismaClient()`
   - Risque de connexions DB multiples
   - Violation du pattern Singleton
   - Incohérence avec l'utilisation de `prisma` depuis `util/db.ts`

3. **Transactions Prisma non typées/sécurisées**
   - Nombreuses transactions complexes sans gestion d'erreur appropriée
   - Pas de retry logic pour les deadlocks
   - Pas de timeout configuré

#### 🟡 IMPORTANTS
4. **Gestion d'erreurs non standardisée**
   - Mix de `throw createHttpError()`, `throw new Error()`, et `next(error)`
   - Pas de classe d'erreur custom pour les erreurs métier
   - Messages d'erreur parfois en français, parfois en anglais

5. **Validation des données incomplète**
   - Validation minimale dans les controllers
   - Pas d'utilisation de bibliothèque de validation (Zod, Joi)
   - Risques de sécurité et de bugs

6. **Services trop volumineux**
   - expedition.service.ts et capability.service.ts > 1000 lignes
   - Violation du principe de responsabilité unique
   - Difficiles à maintenir et tester

7. **Pas de tests**
   - Aucun test unitaire ou d'intégration
   - Script de test par défaut dans package.json
   - Risque élevé de régression

#### 🟢 AMÉLIORATIONS
8. **Configuration dispersée**
   - Variables d'environnement dans validateEnv.ts
   - Constantes hardcodées dans le code
   - Pas de fichier de configuration centralisé

9. **Types TypeScript à améliorer**
   - Utilisation de `any` implicite dans certains endroits
   - Interfaces partiellement définies
   - Pas d'utilisation de types d'utilité TS avancés

10. **Documentation minimale**
    - Quelques commentaires JSDoc
    - Pas de documentation API (Swagger/OpenAPI)
    - TODOs non suivis (3 occurrences)

11. **Middleware d'authentification complexe**
    - auth.ts fait 214 lignes pour gérer IP/session
    - Logique CIDR dupliquée
    - Logs excessifs en production

## 🎯 Plan de Refactorisation (Phases)

### Phase 1: Infrastructure & Qualité de base (Priorité HAUTE)

#### 1.1 Standardiser le Logging
**Objectif:** Remplacer tous les console.* par le logger Winston

**Tâches:**
- [ ] Améliorer la configuration du logger dans `services/logger.ts`
  - Ajouter des niveaux de log configurables (debug, info, warn, error)
  - Configurer les transports (console, fichier, rotation)
  - Ajouter des métadonnées contextuelles (service, userId, requestId)
- [ ] Créer des helper functions de logging
  - `logInfo(message, context)`, `logError(error, context)`, etc.
- [ ] Remplacer tous les `console.log` par `logger.info`
- [ ] Remplacer tous les `console.error` par `logger.error`
- [ ] Remplacer tous les `console.warn` par `logger.warn`
- [ ] Ajouter un middleware de logging des requêtes HTTP structuré

**Fichiers concernés:** 17 fichiers (111 occurrences)

**Impact:** 🟢 Faible risque - Pas de changement de logique métier

#### 1.2 Corriger la gestion de Prisma Client
**Objectif:** Utiliser une seule instance Prisma partagée

**Tâches:**
- [ ] Vérifier que `util/db.ts` exporte correctement l'instance singleton
- [ ] Remplacer toutes les `new PrismaClient()` par import depuis `util/db.ts`
- [ ] Ajouter des hooks Prisma pour logging des requêtes lentes
- [ ] Configurer le pool de connexions correctement
- [ ] Ajouter une gestion de déconnexion propre (graceful shutdown)

**Fichiers concernés:** 10 services + controllers

**Impact:** 🟡 Risque moyen - Peut affecter les connexions DB

#### 1.3 Standardiser la gestion d'erreurs
**Objectif:** Approche cohérente des erreurs métier et techniques

**Tâches:**
- [ ] Créer des classes d'erreur custom (`errors/`)
  - `BusinessError` - Erreurs métier (400)
  - `NotFoundError` - Ressources non trouvées (404)
  - `UnauthorizedError` - Auth required (401)
  - `ValidationError` - Données invalides (422)
- [ ] Créer un middleware global d'erreur amélioré
- [ ] Remplacer progressivement `throw createHttpError()` par classes custom
- [ ] Standardiser les messages d'erreur (anglais)
- [ ] Ajouter des codes d'erreur uniques pour faciliter le débogage

**Fichiers concernés:** Tous les controllers et services

**Impact:** 🟢 Faible risque - Amélioration de la DX

### Phase 2: Architecture & Structure (Priorité MOYENNE)

#### 2.1 Découper les services volumineux
**Objectif:** Respecter le principe de responsabilité unique

**expedition.service.ts (1,326 lignes) → Diviser en:**
- [ ] `expedition-lifecycle.service.ts` - Création, lock, depart, return
- [ ] `expedition-navigation.service.ts` - Gestion des directions, path
- [ ] `expedition-members.service.ts` - Gestion des participants
- [ ] `expedition-events.service.ts` - Événements d'expédition
- [ ] `expedition-emergency.service.ts` - Retours d'urgence

**capability.service.ts (1,175 lignes) → Diviser en:**
- [ ] `capability-management.service.ts` - CRUD capacités
- [ ] `capability-execution.service.ts` - Logique d'utilisation
- [ ] Créer des services spécifiques par type:
  - `hunting.service.ts`
  - `gathering.service.ts`
  - `fishing.service.ts`
  - `logging.service.ts`
  - `entertainment.service.ts`

**controllers/characters.ts (941 lignes) → Diviser en:**
- [ ] `character.controller.ts` - CRUD de base
- [ ] `character-stats.controller.ts` - Gestion stats (PA, hunger, HP)
- [ ] `character-capabilities.controller.ts` - Gestion capacités
- [ ] `character-lifecycle.controller.ts` - Kill, reroll, switch

**Bénéfices:**
- Code plus maintenable
- Tests unitaires plus faciles
- Meilleure séparation des responsabilités
- Réutilisabilité accrue

**Impact:** 🟡 Risque moyen - Refactoring majeur mais sans changement de logique

#### 2.2 Ajouter la validation des données
**Objectif:** Sécuriser et valider toutes les entrées

**Tâches:**
- [ ] Installer et configurer Zod
- [ ] Créer des schémas de validation pour chaque endpoint
  - `schemas/character.schema.ts`
  - `schemas/expedition.schema.ts`
  - `schemas/capability.schema.ts`
  - etc.
- [ ] Créer un middleware de validation générique
- [ ] Appliquer la validation à tous les endpoints
- [ ] Valider les variables d'environnement avec Zod (remplacer envalid)

**Fichiers concernés:** Tous les controllers + routes

**Impact:** 🟢 Faible risque - Ajout de sécurité

#### 2.3 Refactorer le middleware d'authentification
**Objectif:** Simplifier et sécuriser l'auth

**Tâches:**
- [ ] Extraire la logique CIDR dans `util/ip-utils.ts`
- [ ] Simplifier `requireInternal` et `requireAuthOrInternal`
- [ ] Réduire le logging excessif (uniquement en mode debug)
- [ ] Ajouter des tests unitaires pour la logique IP
- [ ] Documenter les plages IP autorisées

**Fichiers concernés:** `middleware/auth.ts`

**Impact:** 🟡 Risque moyen - Sécurité critique

### Phase 3: Configuration & DevOps (Priorité MOYENNE)

#### 3.1 Centraliser la configuration
**Objectif:** Configuration claire et type-safe

**Tâches:**
- [ ] Créer `config/index.ts` avec structure:
  ```typescript
  export const config = {
    server: { port, env, corsOrigin },
    database: { url, poolSize },
    session: { secret, maxAge },
    cron: { timezone, enableJobs },
    logging: { level, format }
  }
  ```
- [ ] Migrer depuis `validateEnv.ts`
- [ ] Ajouter des constantes métier (PA regen, hunger levels, etc.)
- [ ] Créer des fichiers .env.example complets

**Impact:** 🟢 Faible risque - Amélioration de la lisibilité

#### 3.2 Améliorer les types TypeScript
**Objectif:** Type-safety maximale

**Tâches:**
- [ ] Éliminer tous les `any` explicites et implicites
- [ ] Créer des types d'utilité pour les réponses API
- [ ] Typer correctement les middlewares Express
- [ ] Utiliser les types générés par Prisma partout
- [ ] Activer `strict: true` dans tsconfig (déjà fait ✓)

**Impact:** 🟢 Faible risque - Amélioration de la DX

#### 3.3 Ajouter une documentation API
**Objectif:** Documentation auto-générée

**Tâches:**
- [ ] Installer Swagger/OpenAPI (swagger-ui-express)
- [ ] Ajouter des annotations JSDoc aux endpoints
- [ ] Générer la documentation automatiquement
- [ ] Exposer `/api-docs` endpoint
- [ ] Documenter les schemas de validation Zod

**Impact:** 🟢 Faible risque - Amélioration de la DX

### Phase 4: Tests & Qualité (Priorité HAUTE - Long terme)

#### 4.1 Setup infrastructure de tests
**Tâches:**
- [ ] Installer Jest + ts-jest
- [ ] Configurer l'environnement de test
- [ ] Setup base de données de test (Prisma test DB)
- [ ] Créer des fixtures et helpers de test

#### 4.2 Ajouter des tests
**Priorité:**
1. Services critiques (expedition, character, capability)
2. Middleware d'authentification
3. Validation des données
4. Controllers

**Objectif:** Au minimum 70% de couverture de code

**Impact:** 🟢 Faible risque - Ajout de sécurité

### Phase 5: Performance & Optimisation (Priorité BASSE)

#### 5.1 Optimiser les requêtes Prisma
- [ ] Analyser les requêtes N+1
- [ ] Ajouter des index manquants
- [ ] Optimiser les includes/selects
- [ ] Implémenter du caching (Redis optionnel)

#### 5.2 Ajouter des transactions sécurisées
- [ ] Ajouter retry logic pour deadlocks
- [ ] Configurer des timeouts
- [ ] Améliorer la gestion des erreurs de transaction

## 📋 Ordre d'exécution recommandé

### Sprint 1 (1-2 semaines) - FONDATIONS
1. Phase 1.1 - Standardiser logging ✅ CRITIQUE
2. Phase 1.2 - Corriger Prisma Client ✅ CRITIQUE
3. Phase 3.1 - Centraliser configuration

### Sprint 2 (1-2 semaines) - SÉCURITÉ
4. Phase 1.3 - Standardiser erreurs
5. Phase 2.2 - Ajouter validation (Zod)
6. Phase 2.3 - Refactorer auth middleware

### Sprint 3 (2-3 semaines) - ARCHITECTURE
7. Phase 2.1 - Découper services volumineux
8. Phase 3.2 - Améliorer types TypeScript
9. Phase 3.3 - Documentation API

### Sprint 4+ (Continu) - QUALITÉ
10. Phase 4.1 - Setup tests
11. Phase 4.2 - Écrire tests
12. Phase 5 - Optimisations

## 🎓 Principes directeurs

1. **Pas de breaking changes** - Maintenir la compatibilité API
2. **Refactoring incrémental** - Petit à petit, feature par feature
3. **Tests en parallèle** - Écrire des tests pendant le refactoring
4. **Documentation continue** - Documenter au fur et à mesure
5. **Review rigoureuse** - Chaque phase doit être reviewée

## 📊 Métriques de succès

- ✅ Zéro `console.log` en production
- ✅ Une seule instance Prisma
- ✅ 100% des endpoints validés
- ✅ Couverture de tests > 70%
- ✅ Documentation API complète
- ✅ Temps de réponse API < 200ms (p95)
- ✅ Zéro erreur TypeScript strict

## 🔧 Outils recommandés

- **Validation:** Zod
- **Tests:** Jest + ts-jest + supertest
- **Documentation:** Swagger/OpenAPI
- **Linting:** ESLint (déjà présent)
- **Monitoring:** Winston + structured logging
- **Performance:** Prisma query logging

---

**Créé le:** 2025-10-16
**Version:** 1.0
**Statut:** 📝 Plan initial - En attente d'approbation
