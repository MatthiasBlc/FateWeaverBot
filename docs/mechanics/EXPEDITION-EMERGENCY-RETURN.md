# Retour d'Urgence des Expéditions

## 📋 Vue d'ensemble

Le retour d'urgence permet aux membres d'une expédition DEPARTED de voter pour revenir en ville avant la fin prévue de l'expédition. Cette fonctionnalité a un coût : **des pertes aléatoires de ressources**.

---

## 🗳️ Mécanisme de Vote

### Déclenchement
- **Qui peut voter ?** Tous les membres vivants d'une expédition en statut DEPARTED
- **Comment voter ?** Via le bouton "🚨 Voter retour d'urgence" dans `/expedition`
- **Annulation ?** Oui, cliquer à nouveau sur le bouton (qui affiche alors "❌ Annuler retour d'urgence")

### Seuil de Déclenchement
- **Formule :** `Math.ceil(nombre_de_membres / 2)`
- **Exemples :**
  - 2 membres → seuil : 1 vote (50%)
  - 3 membres → seuil : 2 votes (66.7%)
  - 5 membres → seuil : 3 votes (60%)
  - 10 membres → seuil : 5 votes (50%)

### Activation
Dès que le seuil est atteint :
- Le flag `pendingEmergencyReturn` est mis à `true`
- L'expédition entre en "mode retour d'urgence"
- Les membres sont informés que le seuil est atteint

### ⚠️ Réversibilité
**IMPORTANT :** Le retour d'urgence peut être **annulé** uniquement **jusqu'à minuit**.

Si suffisamment de personnes retirent leur vote et que le total descend **sous le seuil** **avant minuit** :
- ✅ Le flag `pendingEmergencyReturn` repasse à `false`
- ✅ Le retour d'urgence est annulé
- ✅ L'expédition continue normalement
- ⚠️ Lors du passage à minuit, les 2 PA seront à nouveau déduits

**Exemple (5 membres, seuil = 3) :**
- 3 votes → `pendingEmergencyReturn = true` ✓ Activé
- 1 retire son vote (2 votes) **avant minuit** → `pendingEmergencyReturn = false` ✗ Annulé
- 1 vote à nouveau (3 votes) **avant minuit** → `pendingEmergencyReturn = true` ✓ Réactivé

Après minuit, le flag `pendingEmergencyReturn` est verrouillé : les votes ne peuvent plus annuler le retour d'urgence. Le cron du matin appliquera donc le retour à 08:00.

---

## ⏰ Timeline du Retour d'Urgence

### 🌙 À Minuit (00:00)
Une fois le seuil atteint :
- ✅ **Les 2 PA ne sont PAS déduits** aux membres de l'expédition
- ✅ L'expédition est considérée comme étant à son dernier jour
- ⏸️ L'expédition n'avance plus (pas de nouvelle direction)

### ☀️ À 8h du Matin (08:00)
Le cron du matin exécute le retour :

1. **Calcul des pertes de ressources** (voir section suivante)
2. **Transfert des ressources restantes** vers le coffre de la ville
3. **Retour des membres** en ville
4. **Status de l'expédition** → `RETURNED`
5. **Suppression des votes** d'urgence

---

## 💔 Pertes de Ressources

### Règle de Perte
Pour **chaque type de ressource** dans l'inventaire de l'expédition :

```
perte_max = Math.ceil(quantité / 2)  // Moitié arrondie supérieure
perte_réelle = random(0, perte_max)   // Entre 0 et perte_max (inclus)
quantité_restante = quantité - perte_réelle
```

### Exemples

| Ressource | Quantité | Max Perte | Perte Possible | Exemples de Pertes |
|-----------|----------|-----------|----------------|-------------------|
| Bois | 10 | 5 | 0 à 5 | 0, 1, 2, 3, 4, 5 |
| Pierre | 15 | 8 | 0 à 8 | 0, 3, 5, 8, etc. |
| Nourriture | 7 | 4 | 0 à 4 | 0, 1, 2, 3, 4 |
| Métal | 1 | 1 | 0 ou 1 | 0 (50%) ou 1 (50%) |
| Eau | 20 | 10 | 0 à 10 | 0, 4, 7, 10, etc. |

### Caractéristiques
- ✅ **Aléatoire :** Chaque ressource a une perte indépendante
- ✅ **Peut être nulle :** Il est possible de ne perdre aucune ressource d'un type
- ✅ **Maximum 50% :** On ne peut jamais perdre plus de la moitié (arrondie supérieure)
- ❌ **Irréversible :** Les ressources perdues sont définitivement perdues

---

## 📊 Logs et Tracking

### Logs Serveur
Lors d'un retour d'urgence, les logs suivants sont générés :

```typescript
// Log général
"expedition_emergency_return_executed" {
  expeditionId: string,
  expeditionName: string,
  totalLostResources: number,
  totalReturnedResources: number
}

// Log détaillé des pertes
"expedition_emergency_return_losses" {
  expeditionId: string,
  expeditionName: string,
  losses: Array<{
    resourceName: string,
    lost: number,
    remaining: number
  }>
}

// Log par ressource
"Emergency return resource loss: {resourceName}" {
  expeditionId: string,
  expeditionName: string,
  original: number,
  lost: number,
  remaining: number
}
```

### Event Log
Un événement est enregistré dans `daily_event_log` :
- Type : `EXPEDITION_EMERGENCY_RETURN`
- Contient l'ID et le nom de l'expédition
- Visible dans les rapports journaliers

---

## 🔧 Implémentation Technique

### Fichiers Modifiés

1. **`backend/src/services/expedition.service.ts`**
   - `hasUserVotedForEmergency()` : Vérifie si un utilisateur a voté
   - `returnExpeditionWithLosses()` : Nouvelle méthode pour retour avec pertes
   - `forceEmergencyReturns()` : Modifiée pour utiliser `returnExpeditionWithLosses()`

2. **`backend/src/cron/expedition.cron.ts`**
   - `morningExpeditionUpdate()` : Appelle `processEmergencyReturns()` à 8h

3. **`backend/src/cron/daily-pa.cron.ts`**
   - Skip la déduction des 2 PA si `pendingEmergencyReturn: true`

4. **`bot/src/features/expeditions/handlers/expedition-display.ts`**
   - Affichage conditionnel du label du bouton selon le statut de vote

### Base de Données

**Table `expedition_emergency_votes` :**
```prisma
model ExpeditionEmergencyVote {
  id           String     @id @default(cuid())
  expeditionId String
  userId       String     // Discord User ID
  votedAt      DateTime   @default(now())

  @@unique([expeditionId, userId])
}
```

**Champ ajouté à `expeditions` :**
```prisma
pendingEmergencyReturn Boolean @default(false)
```

---

## 🎮 Expérience Utilisateur

### Affichage du Bouton
- **Avant vote :** "🚨 Voter retour d'urgence"
- **Après vote :** "❌ Annuler retour d'urgence"

### Feedback au Vote
```
✅ Votre vote pour le retour d'urgence a été enregistré.

📊 Votes: 3/5 (Seuil: 3)

🚨 Seuil atteint! L'expédition sera de retour dans les 10 prochaines minutes.
```

### Informations Visibles
Dans l'embed de l'expédition DEPARTED :
```
⚠️ Votes de retour d'urgence
🚨 3/5 (Seuil: 3)
```

---

## ⚖️ Balance de Jeu

### Avantages du Retour d'Urgence
- ✅ Sauve les membres en danger
- ✅ Pas de déduction de 2 PA à minuit
- ✅ Retour rapide en ville

### Coûts du Retour d'Urgence
- ❌ Pertes aléatoires de ressources (0-50% par type)
- ❌ Expédition terminée prématurément
- ❌ Pas de découvertes/événements supplémentaires

### Stratégie
Le retour d'urgence est un **compromis** :
- Utiliser si la situation devient critique (faim, danger, moral bas)
- Éviter si l'expédition est stable et rentable
- Considérer le risque de perte de ressources précieuses

---

## 🧪 Tests

**Script de test disponible :**
```bash
npx ts-node src/scripts/test-emergency-return-losses.ts
```

Ce script simule les pertes pour différentes quantités de ressources et affiche les statistiques.
