# Restrictions des Capacités en Expédition

## 📋 Vue d'ensemble

Les personnages en expédition **LOCKED** ou **DEPARTED** ne peuvent pas utiliser leurs capacités habituelles. Cette restriction simule le fait que les personnages sont absents de la ville et occupés par leur expédition.

---

## 🚫 Capacités Bloquées

### En Statut LOCKED ou DEPARTED

**Toutes les capacités normales sont désactivées :**

#### Récolte (HARVEST)
- 🏹 **Chasser** (2 PA) - Chasser du gibier pour obtenir des vivres
- 🌿 **Cueillir** (1 PA) - Cueillir des plantes comestibles pour obtenir des vivres
- 🎣 **Pêcher** (1-2 PA) - Pêcher pour obtenir du poisson
- 🪓 **Couper du bois** (1 PA) - Récolter du bois
- ⛏️ **Miner** (2 PA) - Récolter du minerai
- 🍳 **Cuisiner** (1-2 PA) - Multiplier des Vivres en Repas

#### Artisanat (CRAFT)
- 🧵 **Tisser** (1-2 PA) - Concevoir des projets de tissage
- ⚒️ **Forger** (1-2 PA) - Concevoir des projets de forge
- 🪚 **Travailler le bois** (1-2 PA) - Concevoir des projets de menuiserie

#### Soin & Support (SUPPORT)
- 🩹 **Soigner** (1-2 PA) - Soigner quelqu'un ou créer des cataplasmes

#### Exploration (EXPLORATION)
- 📚 **Rechercher** (1-2 PA) - Faire des recherches pour obtenir des connaissances
- 🗺️ **Cartographier** (1-2 PA) - Explorer et cartographier les environs
- 🔮 **Auspice** (1-2 PA) - Prédire les événements météorologiques

#### Spécial (SPECIAL)
- 🎭 **Divertir** (1 PA) - Divertir le village pour remonter le moral des troupes

**Total : 14 capacités bloquées** (et toutes capacités futures ajoutées au système)

### Affichage dans le Profil
- Les boutons de capacités sont **grisés** (disabled)
- Le style du bouton passe de `Primary` à `Secondary`
- Les boutons ne sont pas cliquables

---

## ✅ Actions Autorisées en Expédition

### Actions Personnelles
1. **🍽️ Manger**
   - Les personnages peuvent consommer leur nourriture
   - Nécessaire pour maintenir leur niveau de faim

2. **🎁 Donner un objet**
   - Permet de donner des objets aux autres membres de l'expédition DEPARTED
   - Fonctionnalité spécifique aux expéditions pour partager des ressources

### Actions Interdites
1. **🛠️ Chantiers**
   - Les personnages ne peuvent pas voir ni participer aux chantiers de la ville
   - Message : "❌ Tu es en expédition et ne peux pas voir les chantiers de la ville"

2. **🩹 Être Soigné**
   - Les personnages en DEPARTED sont exclus de la liste des cibles soignables
   - Ils doivent se débrouiller avec les ressources de l'expédition

---

## 🔄 Statuts d'Expédition

| Statut | Capacités (14 types) | Chantiers | Donner | Manger |
|--------|---------------------|-----------|--------|--------|
| **Aucune expédition** | ✅ Activées (bleues) | ✅ Accessible | ✅ En ville | ✅ Oui |
| **PLANNING** | ✅ Activées (bleues) | ✅ Accessible | ✅ En ville | ✅ Oui |
| **LOCKED** | ❌ Désactivées (grises) | ❌ Bloqué | ❌ Non | ✅ Oui |
| **DEPARTED** | ❌ Désactivées (grises) | ❌ Bloqué | ✅ En expédition | ✅ Oui |
| **RETURNED** | ✅ Activées (bleues) | ✅ Accessible | ✅ En ville | ✅ Oui |

**Légende des Capacités :**
- ✅ Activées (bleues) = Boutons bleus, cliquables, utilisables
- ❌ Désactivées (grises) = Boutons gris, non cliquables, inutilisables

---

## 💡 Exemples Concrets

### Scénario 1 : Chasseuse en Ville
**Personnage :** Marie (Chasseuse)
**Statut :** Aucune expédition
**Capacités :**
- 🏹 Chasser (2 PA) → ✅ Bouton **bleu**, cliquable
- Elle peut utiliser tous ses PA pour chasser

### Scénario 2 : Chasseuse en Expédition LOCKED
**Personnage :** Marie (Chasseuse)
**Statut :** Expédition LOCKED (départ demain 8h)
**Capacités :**
- 🏹 Chasser (2 PA) → ❌ Bouton **gris**, non cliquable
- Elle est en préparation pour l'expédition
- Elle ne peut plus chasser en ville

### Scénario 3 : Cuisinière en Expédition DEPARTED
**Personnage :** Sophie (Cuisinière)
**Statut :** Expédition DEPARTED (en cours)
**Capacités :**
- 🍳 Cuisiner (1-2 PA) → ❌ Bouton **gris**, non cliquable
- 🍽️ Manger → ✅ **Accessible**
- 🎁 Donner → ✅ **Accessible** (pour partager avec les autres membres)
- Elle ne peut pas cuisiner pendant l'expédition
- Mais elle peut manger et donner des objets aux autres membres

### Scénario 4 : Menuisier Multi-Capacités
**Personnage :** Jean (Menuisier + Pêcher appris)
**Statut :** Expédition DEPARTED
**Capacités :**
- 🪚 Travailler le bois (1-2 PA) → ❌ Gris
- 🎣 Pêcher (1-2 PA) → ❌ Gris
- **Toutes** ses capacités sont bloquées, peu importe leur type

### Scénario 5 : Retour d'Expédition
**Personnage :** Marie (Chasseuse)
**Statut :** Expédition RETURNED (retournée ce matin à 8h)
**Capacités :**
- 🏹 Chasser (2 PA) → ✅ Bouton **bleu**, cliquable
- Elle peut immédiatement utiliser ses capacités à nouveau

---

## 🔧 Implémentation Technique

### Fichiers Modifiés

1. **`bot/src/features/users/users.types.ts`**
   - Ajout du champ `expeditionStatus?: 'LOCKED' | 'DEPARTED' | null`

2. **`bot/src/features/users/users.handlers.ts`**
   - Récupération du statut d'expédition via `getActiveExpeditionsForCharacter()`
   - Passage du statut à `createCapabilityButtons()`
   - Désactivation des boutons si `isInExpedition = true`

### Logique de Désactivation

```typescript
// Vérifier si le personnage est en expédition LOCKED ou DEPARTED
const isInExpedition = expeditionStatus === 'LOCKED' || expeditionStatus === 'DEPARTED';

// Style du bouton (gris si en expédition)
const buttonStyle = hasEnoughPA && !isInAgony && !isInExpedition
  ? ButtonStyle.Primary
  : ButtonStyle.Secondary;

// Désactivation
if (!hasEnoughPA || isInAgony || isInExpedition) {
  button.setDisabled(true);
}
```

### Récupération du Statut

```typescript
// Dans handleProfileCommand
let expeditionStatus: 'LOCKED' | 'DEPARTED' | null = null;
const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(character.id);

if (activeExpeditions && activeExpeditions.length > 0) {
  const expedition = activeExpeditions[0];
  if (expedition.status === 'LOCKED' || expedition.status === 'DEPARTED') {
    expeditionStatus = expedition.status as 'LOCKED' | 'DEPARTED';
  }
}
```

---

## 🎮 Expérience Utilisateur

### Feedback Visuel
Lorsqu'un personnage est en expédition :
1. **Boutons grisés** : Style secondaire au lieu de primaire
2. **Non cliquables** : `disabled = true`
3. **Toujours visibles** : Les capacités restent affichées mais inutilisables

### Pourquoi Garder les Boutons Visibles ?
- **Transparence** : Le joueur voit qu'il possède ces capacités
- **Feedback clair** : La désactivation indique qu'il est en expédition
- **Cohérence UI** : Le profil garde sa structure habituelle

---

## ⚖️ Justification Gameplay

### Raisons de la Restriction
1. **Réalisme** : Les personnages sont absents de la ville
2. **Focus** : Pendant une expédition, les personnages se concentrent sur l'exploration
3. **Balance** : Empêche les personnages de tout faire simultanément
4. **Choix stratégique** : Partir en expédition a un coût d'opportunité

### Impact sur le Gameplay
- **LOCKED** : Dernière journée avant le départ, personnages en préparation
- **DEPARTED** : En voyage, complètement hors de la ville
- Les joueurs doivent choisir : rester en ville pour utiliser leurs capacités OU partir en expédition

---

## 📝 Notes de Développement

### Liste Exhaustive des Capacités (Seed)
D'après `backend/prisma/seed.ts`, voici les 14 capacités existantes actuellement :

**Récolte (6) :**
1. Chasser (HUNT)
2. Cueillir (GATHER)
3. Pêcher (FISH)
4. Couper du bois (CHOPPING)
5. Miner (MINING)
6. Cuisiner (COOKING)

**Artisanat (3) :**
7. Tisser (WEAVING)
8. Forger (FORGING)
9. Travailler le bois (WOODWORKING)

**Soin (1) :**
10. Soigner (HEALING)

**Exploration (3) :**
11. Rechercher (RESEARCHING)
12. Cartographier (CARTOGRAPHING)
13. Auspice (AUGURING)

**Spécial (1) :**
14. Divertir (ENTERTAIN)

**Total : 14 capacités bloquées en LOCKED/DEPARTED**

### Universalité du Système
- ✅ Le système bloque **TOUTES** les capacités sans distinction
- ✅ Aucun filtre par nom ou type
- ✅ Toute nouvelle capacité ajoutée au système sera **automatiquement** bloquée
- ✅ Pas besoin de maintenir une liste de capacités à bloquer

### Exceptions Futures Possibles
Si besoin, on pourrait ajouter :
- Un flag `usableInExpedition` sur certaines capacités
- Des capacités "portables" utilisables en expédition
- Un système de craft minimal en expédition
- Des capacités spécifiques aux expéditions

### Maintenance
- Toute nouvelle capacité sera automatiquement bloquée en expédition
- Le système est centralisé dans `createCapabilityButtons()`
- Pas besoin de modifier chaque capacité individuellement
- Pour autoriser une capacité en expédition → ajouter une condition spéciale dans le code
