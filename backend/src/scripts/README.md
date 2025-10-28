# 🧪 Scripts de Simulation CRON

Ces scripts permettent de tester les tâches CRON sans attendre les horaires programmés.

## 📋 Scripts disponibles

### 1. **simulate-midnight.ts** - Minuit (00:00:00)

Simule toutes les tâches qui s'exécutent à minuit dans le bon ordre :

1. **Hunger Decrease** - Diminution de la faim
2. **PM Contagion** - Contagion de la dépression
3. **Expedition Lock** - Verrouillage des expéditions PLANNING
4. **Daily PA Update** - Régénération PA + Déduction expéditions (LOCKED + DEPARTED)

```bash
# Depuis le dossier backend
npx ts-node src/scripts/simulate-midnight.ts

# Ou avec Docker
docker compose exec backenddev npx ts-node src/scripts/simulate-midnight.ts
```

---

### 2. **simulate-morning.ts** - Matin (08:00:00)

Simule toutes les tâches qui s'exécutent le matin dans le bon ordre :

1. **Return Expeditions** - Retour des expéditions terminées
2. **Depart Expeditions** - Départ des expéditions verrouillées (LOCKED → DEPARTED)
3. **Daily Message** - Envoi du message quotidien sur Discord

```bash
# Depuis le dossier backend
npx ts-node src/scripts/simulate-morning.ts

# Ou avec Docker
docker compose exec backenddev npx ts-node src/scripts/simulate-morning.ts
```

---

## 🔄 Workflow complet de test

Pour tester un cycle complet jour/nuit :

```bash
# 1. Créer une expédition en PLANNING (via Discord)

# 2. Simuler minuit (lock l'expédition)
docker compose exec backenddev npx ts-node src/scripts/simulate-midnight.ts

# 3. Simuler le matin (fait partir l'expédition)
docker compose exec backenddev npx ts-node src/scripts/simulate-morning.ts

# 4. Répéter pour simuler plusieurs jours
# (minuit → matin → minuit → matin → ...)
```

---

## 📊 Ordre d'exécution détaillé

### Minuit (00:00:00) - Job Unifié

**Un seul job CRON** exécute toutes les tâches **séquentiellement** pour garantir l'ordre :

| Ordre | Tâche | Impact |
|-------|-------|--------|
| 1 | Hunger Decrease | Peut mettre en agonie |
| 2 | PM Contagion | Peut déprimer |
| 3 | Expedition Lock | Verrouille PLANNING → LOCKED (retire membres inaptes) |
| 4 | Daily PA Update | Régénère PA, déduit 2 PA expéditions (LOCKED + DEPARTED), ajoute directions |

> **Note :** L'ordre est garanti car toutes les tâches sont dans un seul fichier CRON (`midnight-tasks.cron.ts`) qui les exécute séquentiellement avec `await`.

### Matin (08:00:00)

| Ordre | Tâche | Impact |
|-------|-------|--------|
| 1 | Return Expeditions | Retourne DEPARTED si `returnAt <= now` |
| 2 | Depart Expeditions | Fait partir LOCKED → DEPARTED |
| 3 | Daily Message | Envoie message récapitulatif Discord |

---

## 🏗️ Architecture CRON

### Production (`backend/src/cron/`)

- **`midnight-tasks.cron.ts`** - Job unifié de minuit (00:00:00)
  - Exécute séquentiellement : Hunger → PM → Lock → PA Update
  - Garantit l'ordre d'exécution avec `await`
  - Un seul job CRON pour éviter les conflits de timing

- **`expedition.cron.ts`** - Job du matin (08:00:00)
  - Return Expeditions → Depart Expeditions

- **`daily-message.cron.ts`** - Message quotidien (08:00:05)
- **`season-change.cron.ts`** - Changement de saison (hebdomadaire)

### Scripts de simulation (`backend/src/scripts/`)

- **`simulate-midnight.ts`** - Simule toutes les tâches de minuit
- **`simulate-morning.ts`** - Simule toutes les tâches du matin

> Les scripts de simulation reproduisent exactement la même logique que les jobs CRON de production.

---

## ⚠️ Notes importantes

- Les scripts modifient **réellement** la base de données
- Assurez-vous d'être en environnement de développement
- Les notifications Discord seront envoyées si configurées
- Les scripts respectent l'ordre exact d'exécution des CRON

---

## 🧪 Scripts de Test

### Test automatique du cycle complet

```bash
# Test end-to-end complet (PLANNING → LOCKED → DEPARTED → RETURNED)
docker compose exec -T backenddev npx ts-node /app/src/scripts/test-expedition-lifecycle.ts
```

Ce script :
- ✅ Crée une expédition de test
- ✅ Teste toutes les transitions de statut
- ✅ Vérifie que chaque étape fonctionne
- ✅ Nettoie automatiquement après le test

### Forcer une expédition à "hier" pour tests

Si vous avez une expédition en PLANNING créée aujourd'hui et voulez la tester immédiatement :

```bash
# Récupérer l'ID de l'expédition (via Discord ou Prisma Studio)
# Puis modifier sa date de création
docker compose exec -T backenddev npx ts-node /app/src/scripts/force-expedition-yesterday.ts <expedition-id>

# Ensuite lancer la simulation de minuit
docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-midnight.ts
```

---

## 🐛 Debug

Pour voir les logs détaillés :

```bash
# Activer les logs Prisma
DEBUG=* docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-midnight.ts

# Vérifier l'état après simulation
docker compose logs backenddev | grep "STEP"

# Voir toutes les expéditions et leur statut
docker compose exec -T backenddev npx prisma studio
```
