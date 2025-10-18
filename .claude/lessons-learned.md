# Lessons Learned - Quand NE PAS utiliser SUPERNOVA

## 📊 Métriques de cette session (2025-01-16)

**Task:** Implémentation système objets/inventaires (7 WP, ~40 objets, modifications schema Prisma)

**Résultats:**
- Tokens utilisés: ~87k
- Code fonctionnel: 0% (rollback complet nécessaire)
- Temps perdu: ~2h
- Si codé directement: ~45k tokens estimés, 80-90% fonctionnel

---

## ❌ Cas où SUPERNOVA/Collaboration échoue

### 1. **Modifications chirurgicales de schémas critiques**

**Exemple vécu:**
- Modification schema Prisma avec 34 modèles existants
- Ajout de 7 nouveaux modèles + modifications à 5 existants
- **Résultat:** Suppression accidentelle de modèles critiques (Town, Character)

**Pourquoi ça échoue:**
- SUPERNOVA n'a pas le fichier entier en contexte
- Une seule erreur (ordre des modèles) casse tout
- Validation Prisma très stricte (17 erreurs en cascade)
- Impossible de continuer tant que schema invalide

**Quand coder soi-même:**
- ✅ Modifications de schema.prisma avec >20 modèles existants
- ✅ Ajout de relations bidirectionnelles complexes
- ✅ Migration de données existantes
- ✅ Refactoring de core models (User, Character, Town, etc.)

---

### 2. **Forte interdépendance entre Work Packages**

**Exemple vécu:**
- WP2A (schema) bloqué → WP2B-C-D impossibles
- Backend API dépend du schema
- Bot commands dépendent du backend
- Seed data dépend de tout

**Pourquoi ça échoue:**
- Effet domino: 1 erreur = tout bloqué
- SUPERNOVA continue même si WP1 a échoué
- Debugging en aveugle (pas de visibilité temps réel)

**Quand coder soi-même:**
- ✅ Pipeline linéaire (A → B → C → D)
- ✅ Chaque étape dépend de la précédente
- ✅ Besoin de validation immédiate entre étapes
- ✅ Debugging nécessaire à chaque étape

---

### 3. **Contexte architectural crucial**

**Exemple vécu:**
- Besoin de comprendre:
  - Pattern ResourceType existant
  - Relations Prisma bidirectionnelles
  - Contraintes de validation
  - Ordre de déclaration des modèles

**Pourquoi ça échoue:**
- SUPERNOVA n'a que le prompt, pas toute la codebase en mémoire
- Patterns subtils non documentés
- Conventions implicites (noms, structures)
- Besoin d'adapter en fonction du code existant

**Quand coder soi-même:**
- ✅ Modification de patterns core du projet
- ✅ Code nécessitant compréhension profonde de l'architecture
- ✅ Intégration avec systèmes legacy complexes
- ✅ Respect de conventions non documentées

---

### 4. **Tasks nécessitant debugging itératif**

**Pourquoi ça échoue:**
- SUPERNOVA fait 1 passe et s'arrête
- Pas de feedback loop
- Erreurs TypeScript/Prisma non visibles
- Impossible d'ajuster en temps réel

**Quand coder soi-même:**
- ✅ Code avec types complexes TypeScript
- ✅ Intégration Discord.js (builders, interactions)
- ✅ Logique métier avec edge cases nombreux
- ✅ Performance critique nécessitant profiling

---

## ✅ Cas où SUPERNOVA fonctionne bien

### 1. **Création de nouveaux fichiers indépendants**

**Exemples réussis:**
- Routes API CRUD simples
- Controllers basiques
- Composants React/Discord isolés
- Tests unitaires répétitifs

**Pourquoi ça marche:**
- Pas de risque de casser l'existant
- Contexte limité nécessaire
- Patterns répétitifs
- Validation locale possible

---

### 2. **Tâches répétitives à grande échelle**

**Exemples:**
- Créer 20 endpoints API similaires
- Générer 50 tests unitaires
- Seed data (si schema stable)
- Migration de données bulk

**Pourquoi ça marche:**
- Pattern clair à répéter
- Faible risque d'erreur logique
- Gain de temps massif
- Facile à vérifier (même structure partout)

---

### 3. **Work Packages parallélisables**

**Exemples:**
- 5 features Discord indépendantes
- 3 services backend sans dépendances
- Plusieurs routes API isolées
- Documentation multi-fichiers

**Pourquoi ça marche:**
- Si WP1 échoue, WP2-5 continuent
- Pas d'effet domino
- Validation partielle possible
- Récupération progressive

---

### 4. **Refactoring mécanique**

**Exemples:**
- Renommer une fonction partout (find-replace intelligent)
- Migrer imports (old path → new path)
- Formatter du code (prettier-like)
- Ajouter types manquants

**Pourquoi ça marche:**
- Règle simple et claire
- Peu de décisions à prendre
- Vérifiable automatiquement
- Réversible facilement

---

## 🎯 Checklist décision: SUPERNOVA vs Coder soi-même

**Utilise SUPERNOVA si:**
- [ ] Nouveaux fichiers (pas de modification d'existants critiques)
- [ ] Work Packages indépendants (pas d'interdépendances fortes)
- [ ] Contexte simple (patterns clairs et documentés)
- [ ] Faible besoin de debugging (logique simple)
- [ ] Tâche répétitive (gain de temps évident)

**Code toi-même si:**
- [ ] Modification de schema/core models
- [ ] Pipeline linéaire avec dépendances
- [ ] Besoin de comprendre l'architecture en profondeur
- [ ] Debugging itératif nécessaire
- [ ] Types complexes ou logique métier subtile

---

## 📝 Règle d'or

**Si tu hésites plus de 30 secondes** → Code toi-même.

Le temps passé à:
1. Écrire un prompt ultra-détaillé
2. Attendre l'exécution
3. Vérifier les erreurs
4. Corriger/refaire

...est souvent **>** temps de coder directement avec feedback immédiat.

---

## 💡 Amélioration future du protocole

**Pour les tasks complexes:**

1. **Phase 1:** Coder soi-même les parties critiques (schema, core logic)
2. **Phase 2:** SUPERNOVA pour parties répétitives (tests, endpoints, UI)
3. **Phase 3:** Coder soi-même l'intégration finale

**Hybrid approach = meilleur des deux mondes**

---

**Date:** 2025-01-16
**Context:** FateWeaverBot - Objects/Inventory System
**Lesson:** Ne pas tout déléguer à SUPERNOVA. Garder la main sur les modifications critiques.
