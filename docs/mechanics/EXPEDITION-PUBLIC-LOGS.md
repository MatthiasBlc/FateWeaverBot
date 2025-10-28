# Messages de Log Publics - Expéditions

## 📋 Vue d'ensemble

Ce document répertorie **TOUS** les messages de log publics liés aux expéditions, de la création au retour. Il couvre deux types de logs :

1. **Logs Discord temps réel** - Envoyés via `sendLogMessage()` dans le canal de logs
2. **Daily Event Logs** - Enregistrés dans la base et affichés dans le bulletin quotidien (08:00)

---

## 🕐 Timeline Complète d'une Expédition

```
JOUR 0 (PLANNING - Phase de préparation)
├─ 14:00 : Création → Log Discord "Nouvelle expédition créée"
├─ 14:30 : Transfert 10 Vivres → Log "a transféré 10x Vivres vers l'expédition"
├─ 15:00 : Joueur quitte → Log "X a quitté l'expédition"
└─ 23:59 : Fin de phase PLANNING

JOUR 1 (LOCKED puis DEPARTED)
├─ 00:00 : LOCK automatique (silencieux, sauf retours catastrophiques)
│   └─ Retrait membres inaptes → Daily Event "est rentré en catastrophe"
├─ 08:00 : DEPARTURE → Daily Event "L'expédition est partie avec N membres"
├─ 08:00:05 : Bulletin quotidien → Récapitulatif de tous les événements
├─ 10:00 : Joueur mange → Log "a mangé 2x 🍞"
└─ 16:00 : Vote urgence → Log "a voté pour le retour d'urgence (3/5)"

JOUR 2-3 (DEPARTED - En expédition)
├─ Check vote urgence (toutes les 10min)
│   └─ Si seuil atteint → Daily Event "est revenue en urgence"
└─ Actions quotidiennes (manger, votes) → Logs Discord

JOUR 4 (RETOUR)
├─ 08:00 : RETURN automatique → Daily Event "est revenue avec : ressources"
└─ 08:00:05 : Bulletin quotidien → Récapitulatif du retour
```

---

## 1️⃣ PHASE PLANNING (Création et Préparation)

### 1.1 Création d'Expédition

**📍 Fichier** : `bot/src/features/expeditions/handlers/expedition-create.ts:337-350`
**⏰ Quand** : Après création et choix de direction
**📢 Type** : Log Discord temps réel

```
🗺️ Nouvelle expédition créée
**Jean** prépare l'expédition **Exploration Nord**.

🎒 Ressources : 10 🍞| 5 🍖
⏱️ Durée : 3 jours
📍 Direction : Nord
```

**Variables** :
- `character.name` - Nom du créateur
- `expedition.name` - Nom de l'expédition
- `resources` - Liste avec quantités et emojis
- `duration` - Nombre de jours
- `direction` - Direction choisie

---

### 1.2 Rejoindre l'Expédition

**📍 Fichier** : `bot/src/features/expeditions/handlers/expedition-join.ts`
**⏰ Quand** : Quand un joueur rejoint
**📢 Type** : ❌ **AUCUN LOG PUBLIC**

**Note** : Aucun message n'est envoyé quand quelqu'un rejoint. C'est silencieux.

---

### 1.3 Quitter l'Expédition

**📍 Fichier** : `bot/src/features/expeditions/handlers/expedition-leave.ts:122-128`
**⏰ Quand** : Quand un joueur quitte (mais pas le dernier)
**📢 Type** : Log Discord temps réel

```
🗺️ **Marie** a quitté l'expédition **Exploration Nord**
```

---

### 1.4 Expédition Annulée (Dernier Membre Part)

**📍 Fichier** : `bot/src/features/expeditions/handlers/expedition-leave.ts:108-113`
**⏰ Quand** : Le dernier membre quitte
**📢 Type** : Log Discord temps réel

```
🗺️ L'expédition**Exploration Nord** est annulée, faute de volontaires.
```

---

### 1.5 Transfert de Ressources

**📍 Fichier** : `bot/src/features/expeditions/handlers/expedition-transfer.ts:599-606`
**⏰ Quand** : Transfert de Vivres/Repas entre ville et expédition
**📢 Type** : Log Discord temps réel

**Vers l'expédition** :
```
📦 **Jean** a transféré **5x Vivres** + **3x Repas** vers l'expédition dans l'expédition "**Exploration Nord**"
```

**Vers la ville** :
```
📦 **Marie** a transféré **2x Vivres** vers la ville dans l'expédition "**Exploration Nord**"
```

**Variables** :
- `character.name` - Qui transfert
- `transferSummary` - Liste formatée (ex: "5x Vivres + 3x Repas")
- `directionText` - "vers la ville" ou "vers l'expédition"
- `expedition.name` - Nom de l'expédition

---

## 2️⃣ PHASE LOCK (Minuit - 00:00)

### 2.1 Lock Automatique

**📍 Fichier** : `backend/src/cron/expedition.cron.ts:8-98`
**⏰ Quand** : Minuit (00:00), toutes les expéditions PLANNING créées avant minuit
**📢 Type** : ❌ **AUCUN LOG PUBLIC**

**Note** : Le lock est silencieux. Aucun message n'est envoyé.

---

### 2.2 Trop Faible pour Partir (Lock)

**📍 Fichier** : `backend/src/services/daily-event-log.service.ts:179-202`
**⏰ Quand** : Minuit (00:00), membres inaptes retirés automatiquement avant le départ
**📢 Type** : Daily Event Log (bulletin 08:00)
**🏷️ Event Type** : `CHARACTER_CATASTROPHIC_RETURN`
**🔧 Méthode** : `logCharacterCannotDepart()`

```
😔 **Marie** se sent trop faible pour partir en expédition et reste en ville. Raison : affamé/agonie
```

**Raisons possibles** :
- `mort/agonie` - HP ≤ 1 ou isDead
- `affamé/agonie` - hungerLevel ≤ 1
- `dépression/déprime` - PM ≤ 1

**Variables** :
- `characterName` - Nom du personnage
- `reason` - Une des raisons ci-dessus

**Note importante** :
- Le personnage n'est **pas encore parti** en expédition
- Il reste en ville et n'a **pas de pénalité de PA**
- L'expédition peut continuer avec les autres membres

---

## 3️⃣ PHASE DEPARTED (Départ - 08:00)

### 3.1 Départ d'Expédition

**📍 Fichier** : `backend/src/services/daily-event-log.service.ts:94-118`
**⏰ Quand** : Matin (08:00), toutes les expéditions LOCKED deviennent DEPARTED
**📢 Type** : Daily Event Log (bulletin 08:00)
**🏷️ Event Type** : `EXPEDITION_DEPARTED`

```
L'expédition **Exploration Nord** est partie avec 5 membre(s) pour 3 jour(s).
```

**Variables** :
- `expeditionName` - Nom de l'expédition
- `memberCount` - Nombre de membres
- `duration` - Durée en jours

---

## 4️⃣ ACTIONS PENDANT DEPARTED

### 4.1 Manger en Expédition

**📍 Fichier** : `bot/src/features/hunger/eat-more.handlers.ts:393-397`
**⏰ Quand** : Un membre mange des ressources de l'expédition
**📢 Type** : Log Discord temps réel

```
🍽️ **Marie** a mangé **2x 🍞**, il reste **8** 🍞 dans expédition "Exploration Nord"
```

**Variables** :
- `characterName` - Nom du personnage
- `quantity` - Quantité mangée
- `emoji` - Emoji de la ressource (🍞 ou 🍖)
- `remainingStock` - Quantité restante
- `expeditionName` - Nom de l'expédition

---

### 4.2 Vote Retour d'Urgence

**📍 Fichier** : `bot/src/features/expeditions/handlers/expedition-emergency.ts:75-83`
**⏰ Quand** : Un membre vote ou retire son vote
**📢 Type** : Log Discord temps réel

**Vote ajouté** :
```
🚨 **Jean** a voté pour le retour d'urgence (3/5)
```

**Vote retiré** :
```
🔄 **Jean** a retiré son vote de retour d'urgence (2/5)
```

**Variables** :
- `character.name` - Nom du personnage
- `totalVotes` - Nombre de votes actuels
- `membersCount` - Nombre total de membres

---

## 5️⃣ RETOURS

### 5.1 Retour Catastrophique (Pendant Expédition)

**📍 Fichier** : `backend/src/services/daily-event-log.service.ts:207-230`
**⏰ Quand** : Membre retiré d'une expédition DEPARTED (manuel ou auto)
**📢 Type** : Daily Event Log (bulletin 08:00 suivant)
**🏷️ Event Type** : `CHARACTER_CATASTROPHIC_RETURN`
**🔧 Méthode** : `logCharacterCatastrophicReturn()`

```
💀 **Jean** est rentré en catastrophe ! Raison : affamé/agonie
```

**Raisons possibles** :
- `mort/agonie` - HP ≤ 1 ou isDead
- `affamé/agonie` - hungerLevel ≤ 1
- `dépression/déprime` - PM ≤ 1

**Variables** :
- `characterName` - Nom du personnage
- `reason` - Une des raisons ci-dessus

**Note importante** :
- Le personnage **était en expédition** DEPARTED
- Il revient **immédiatement** en ville
- Ses **PA sont mis à 0** (pénalité)
- Message différent de celui du lock (emoji 💀 vs 😔)

---

### 5.2 Retour d'Urgence (Vote Atteint)

**📍 Fichier** : `backend/src/services/daily-event-log.service.ts:154-174`
**⏰ Quand** : ≥50% des membres ont voté (check toutes les 10 min)
**📢 Type** : Daily Event Log (bulletin 08:00 suivant)
**🏷️ Event Type** : `EXPEDITION_EMERGENCY_RETURN`

```
⚠️ L'expédition **Exploration Nord** est revenue en urgence !
```

**Variables** :
- `expeditionName` - Nom de l'expédition

**Particularité** :
- Perte aléatoire de 0 à 50% de chaque type de ressource
- Pas de déduction de 2 PA à minuit
- Retour effectif à 08:00 du lendemain

---

### 5.3 Retour Normal (Fin de Durée)

**📍 Fichier** : `backend/src/services/daily-event-log.service.ts:123-149`
**⏰ Quand** : Matin (08:00), quand returnAt ≤ now
**📢 Type** : Daily Event Log (bulletin 08:00)
**🏷️ Event Type** : `EXPEDITION_RETURNED`

**Avec ressources** :
```
L'expédition **Exploration Nord** est revenue avec : 10 Vivres, 5 Repas, 3 Bois.
```

**Sans ressources** :
```
L'expédition **Exploration Nord** est revenue avec : aucune ressource.
```

**Variables** :
- `expeditionName` - Nom de l'expédition
- `resourcesText` - Liste formatée des ressources ou "aucune ressource"

---

## 6️⃣ BULLETIN QUOTIDIEN (08:00:05)

### 6.1 Section Expéditions du Bulletin

**📍 Fichier** : `backend/src/services/daily-message.service.ts:169-186`
**⏰ Quand** : Chaque matin à 08:00:05
**📢 Type** : Embed Discord (canal de messages quotidiens)

**Format de la section** :
```
📍 Expéditions
- L'expédition **Exploration Nord** est partie avec 5 membre(s) pour 3 jour(s).
- 💀 **Marie** est rentré en catastrophe ! Raison : affamé/agonie
- L'expédition **Mission Sud** est revenue avec : 10 Vivres, 5 Repas.
```

**Contenu** :
- Tous les événements d'expédition de la veille (00:00 à 23:59)
- Types : EXPEDITION_DEPARTED, EXPEDITION_RETURNED, EXPEDITION_EMERGENCY_RETURN, CHARACTER_CATASTROPHIC_RETURN
- Si aucun événement : "Aucun mouvement d'expédition hier."

---

## ⚖️ Comparaison : Trop Faible vs Retour Catastrophique

Il existe **deux messages différents** pour les problèmes de santé liés aux expéditions :

### 😔 Trop Faible pour Partir (Lock - Minuit)

| Aspect | Détail |
|--------|--------|
| **Emoji** | 😔 (visage triste) |
| **Message** | "se sent trop faible pour partir en expédition et reste en ville" |
| **Moment** | Minuit (00:00) - Lors du lock |
| **Statut expédition** | PLANNING → pas encore partie |
| **Pénalité PA** | ❌ **Aucune pénalité** |
| **Contexte** | Le personnage n'a jamais quitté la ville |
| **Méthode** | `logCharacterCannotDepart()` |

**Exemple** : `😔 **Marie** se sent trop faible pour partir en expédition et reste en ville. Raison : affamé/agonie`

---

### 💀 Retour Catastrophique (Pendant Expédition)

| Aspect | Détail |
|--------|--------|
| **Emoji** | 💀 (crâne) |
| **Message** | "est rentré en catastrophe !" |
| **Moment** | Variable - Pendant l'expédition |
| **Statut expédition** | DEPARTED → en cours |
| **Pénalité PA** | ✅ **PA mis à 0** |
| **Contexte** | Le personnage était parti et doit revenir |
| **Méthode** | `logCharacterCatastrophicReturn()` |

**Exemple** : `💀 **Jean** est rentré en catastrophe ! Raison : affamé/agonie`

---

### 🎯 Pourquoi Deux Messages Différents ?

1. **Contexte narratif** :
   - 😔 = Le personnage ne se sent pas prêt, il reste sagement en ville
   - 💀 = Le personnage était parti mais a dû abandonner et rentrer d'urgence

2. **Impact gameplay** :
   - 😔 = Pas de pénalité (le personnage n'a rien tenté)
   - 💀 = PA à 0 (le personnage a gaspillé son énergie à revenir)

3. **Gravité** :
   - 😔 = Moins grave (prévention)
   - 💀 = Plus grave (échec et retour)

---

## 📊 Résumé par Type

### 🔵 Logs Discord Temps Réel

| Événement | Emoji | Message | Fichier Source |
|-----------|-------|---------|----------------|
| Création expédition | 🗺️ | Nouvelle expédition créée + détails | expedition-create.ts:337 |
| Quitter expédition | 🗺️ | X a quitté l'expédition | expedition-leave.ts:123 |
| Expédition annulée | 🗺️ | L'expédition est annulée | expedition-leave.ts:108 |
| Transfert ressources | 📦 | X a transféré [ressources] | expedition-transfer.ts:601 |
| Manger | 🍽️ | X a mangé [quantité] | eat-more.handlers.ts:395 |
| Vote urgence | 🚨 | X a voté pour le retour d'urgence | expedition-emergency.ts:76 |
| Retrait vote urgence | 🔄 | X a retiré son vote | expedition-emergency.ts:77 |

**Total : 7 types de messages temps réel**

---

### 🟠 Daily Event Logs (Bulletin 08:00)

| Type | Emoji | Message | Fichier Source |
|------|-------|---------|----------------|
| EXPEDITION_DEPARTED | - | L'expédition X est partie avec N membres | daily-event-log.service.ts:94 |
| EXPEDITION_RETURNED | - | L'expédition X est revenue avec : [ressources] | daily-event-log.service.ts:123 |
| EXPEDITION_EMERGENCY_RETURN | ⚠️ | L'expédition X est revenue en urgence ! | daily-event-log.service.ts:154 |
| CHARACTER_CATASTROPHIC_RETURN | 💀 | X est rentré en catastrophe ! Raison: [raison] | daily-event-log.service.ts:179 |

**Total : 4 types d'événements quotidiens**

---

## 🚫 Opérations Silencieuses (Pas de Log)

Ces actions **ne génèrent AUCUN log public** :

1. ❌ **Rejoindre une expédition** - Silencieux
2. ❌ **Lock d'expédition** à minuit - Silencieux (sauf retours catastrophiques)
3. ❌ **Déduction de 2 PA** à minuit pour membres LOCKED/DEPARTED - Silencieux
4. ❌ **Reset du flag pendingEmergencyReturn** si votes descendent sous le seuil - Silencieux

---

## 📁 Fichiers Sources Principaux

### Bot Discord (Logs Temps Réel)
```
bot/src/features/expeditions/handlers/
├── expedition-create.ts         # Création d'expédition
├── expedition-join.ts            # Rejoindre (pas de log)
├── expedition-leave.ts           # Quitter / Annulation
├── expedition-transfer.ts        # Transfert de ressources
└── expedition-emergency.ts       # Votes retour d'urgence

bot/src/features/hunger/
└── eat-more.handlers.ts          # Manger en expédition
```

### Backend (Daily Event Logs)
```
backend/src/services/
├── expedition.service.ts         # Logique métier (retours)
├── daily-event-log.service.ts    # Enregistrement des événements
└── daily-message.service.ts      # Bulletin quotidien

backend/src/cron/
├── expedition.cron.ts            # Lock/Départ/Retour
└── midnight-tasks.cron.ts        # Orchestration minuit
```

---

## 🔍 Recherche Rapide

**Pour trouver un log spécifique :**

```bash
# Logs Discord (bot)
grep -r "sendLogMessage" bot/src/features/expeditions/
grep -r "sendLogMessage" bot/src/features/hunger/

# Daily Event Logs (backend)
grep -r "logExpedition" backend/src/services/
grep -r "DailyEventType.EXPEDITION" backend/src/services/
```

**Event Types dans la base de données :**
- `EXPEDITION_DEPARTED`
- `EXPEDITION_RETURNED`
- `EXPEDITION_EMERGENCY_RETURN`
- `CHARACTER_CATASTROPHIC_RETURN`

---

## 📝 Notes Importantes

1. **Délai entre événement et log** :
   - Logs Discord : **Immédiat** (temps réel)
   - Daily Event Logs : **Jusqu'à 08:00** le lendemain

2. **Visibilité** :
   - Logs Discord : Canal de logs configuré pour le serveur
   - Bulletin quotidien : Canal de messages quotidiens configuré

3. **Persistance** :
   - Logs Discord : Non persistés (historique Discord)
   - Daily Event Logs : Stockés en base de données (table `daily_event_log`)

4. **Ordre dans le bulletin** :
   - Les événements sont affichés dans l'ordre chronologique
   - Plusieurs événements d'expédition peuvent apparaître le même jour

---

## ✅ Checklist de Vérification

Pour vérifier que tous les logs fonctionnent :

- [ ] Créer une expédition → Log "Nouvelle expédition créée"
- [ ] Rejoindre → Pas de log (normal)
- [ ] Quitter → Log "a quitté l'expédition"
- [ ] Transférer ressources → Log "a transféré"
- [ ] À minuit → Bulletin suivant : retours catastrophiques éventuels
- [ ] À 08:00 → Bulletin : "L'expédition est partie"
- [ ] Manger en expédition → Log "a mangé"
- [ ] Voter urgence → Log "a voté pour le retour d'urgence"
- [ ] Retour urgence → Bulletin suivant : "est revenue en urgence"
- [ ] Retour normal → Bulletin : "est revenue avec : ressources"
