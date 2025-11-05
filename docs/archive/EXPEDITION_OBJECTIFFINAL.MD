# BILAN COMPLET DU SYSTÈME D'EXPÉDITIONS

## Vue d'ensemble

Le système d'expéditions de FateWeaverBot permet aux personnages de participer à des expéditions collectives qui emportent des ressources de leur ville et les restituent après une durée déterminée. Les expéditions ont un cycle de vie défini avec différents statuts et affectent la disponibilité des personnages pour les commandes municipales.

## Status

Les différentes fonctionnalités ont été totalement ou partiellement implémentées. Il est probable qu'un certain nombre d'erreurs soit présent dans ces implémentations donc tout doit être revérifié.
Depuis le listing de ces éléments, une refactorisation complète du backend a été effectuée. Il est important de respecter la nouvelle structure.

## Architecture et fichiers principaux

### Backend (Node.js/Prisma)

- **Service principal** : `backend/src/services/expedition.service.ts` (1327 lignes)
- **Contrôleur** : `backend/src/controllers/expedition.ts`
- **Routes API** : `backend/src/routes/expedition.ts`
- **Cron jobs** : `backend/src/cron/expedition.cron.ts` (169 lignes)

### Bot Discord (TypeScript)

- **Handlers utilisateurs** : `bot/src/features/expeditions/handlers/`
  - `expedition-create.ts` - Création d'expéditions
  - `expedition-join.ts` - Rejoindre une expédition
  - `expedition-leave.ts` - Quitter une expédition
  - `expedition-transfer.ts` - Transfert de ressources
  - `expedition-display.ts` - Affichage des informations
- **Handlers admin** : `bot/src/features/admin/expedition-admin.handlers.ts`
- **Modales** : `bot/src/modals/expedition-modals.ts`

## Modèle de données

### Tables principales (Prisma Schema)

#### Expedition

```typescript
{
  id: string (CUID)
  name: string
  townId: string (FK vers Town)
  status: ExpeditionStatus (PLANNING | LOCKED | DEPARTED | RETURNED)
  duration: number (jours)
  returnAt: Date | null
  createdBy: string (Discord user ID)
  pendingEmergencyReturn: boolean
  // Nouveaux champs direction
  initialDirection: Direction | null
  path: Direction[]
  currentDayDirection: Direction | null
  directionSetBy: string | null
  directionSetAt: Date | null
}
```

#### ExpeditionMember

```typescript
{
  id: string (CUID)
  expeditionId: string (FK vers Expedition)
  characterId: string (FK vers Character)
  joinedAt: Date
}
```

#### ExpeditionEmergencyVote

```typescript
{
  id: string (CUID)
  expeditionId: string (FK vers Expedition)
  userId: string (Discord user ID)
  votedAt: Date
}
```

### Énumérations

#### ExpeditionStatus

- `PLANNING` : Expédition en cours de planification, membres peuvent rejoindre/quitter
- `LOCKED` : Expédition verrouillée, prête au départ
- `DEPARTED` : Expédition partie, membres ne peuvent pas utiliser les commandes municipales
- `RETURNED` : Expédition revenue, ressources restituées

#### Direction (8 directions + UNKNOWN)

- `NORD`, `NORD_EST`, `EST`, `SUD_EST`, `SUD`, `SUD_OUEST`, `OUEST`, `NORD_OUEST`, `UNKNOWN`

## API Endpoints

### Endpoints utilisateurs

#### POST `/api/expeditions`

Créer une nouvelle expédition avec ressources multiples.

**Body** :

```json
{
  "name": "Nom de l'expédition",
  "initialResources": [
    { "resourceTypeName": "Vivres", "quantity": 50 },
    { "resourceTypeName": "Bois", "quantity": 20 }
  ],
  "duration": 3,
  "townId": "town-id",
  "initialDirection": "NORD"
}
```

#### GET `/api/expeditions/:id`

Récupérer une expédition par ID avec détails complets.

#### GET `/api/expeditions/town/:townId`

Lister toutes les expéditions d'une ville (exclut RETURNED par défaut).

#### POST `/api/expeditions/:id/join`

Rejoindre une expédition (status PLANNING uniquement).

#### POST `/api/expeditions/:id/leave`

Quitter une expédition (status PLANNING uniquement).

#### POST `/api/expeditions/:id/transfer`

Transférer des ressources entre ville et expédition.

### Endpoints admin

#### GET `/api/admin/expeditions`

Lister toutes les expéditions avec filtrage.

#### PATCH `/api/admin/expeditions/:id`

Modifier une expédition (durée, ressources).

#### POST `/api/admin/expeditions/:id/force-return`

Forcer le retour immédiat d'une expédition.

#### POST `/api/admin/expeditions/:id/lock`

Verrouiller une expédition (PLANNING → LOCKED).

#### POST `/api/admin/expeditions/:id/depart`

Faire partir une expédition (LOCKED → DEPARTED).

## Fonctionnalités implémentées

### Gestion des ressources multiples

- **Transfert automatique** lors de création/terminaison
- **Stockage séparé** : `ResourceStock` avec `locationType: "EXPEDITION"`
- **Validation des stocks** avant création

### Cycle de vie des expéditions

#### 1. Création (PLANNING)

- Créateur choisit nom, ressources, durée, direction initiale
- Ressources prélevées de la ville
- Membres peuvent rejoindre/quitter
- Transferts de ressources possibles
- Si le dernier membre quitte l'expédition, elle est instantanément terminée et les ressources sont restituées.
- Si un membre de l'expédition mange, il mange dans les stocks de la ville.

#### 2. Verrouillage automatique (LOCKED)

- **Cron job quotidien** : `0 0 * * *` (minuit)
- Ce Cron doit être exécuté après daily-pa.cron.ts, daily-pm.cron.ts, hunger-increase.cron.ts.
- Si un membre de l'expédition meurt, il est exclu de l'expédition.
- Si un membre de l'expédition est en agonie, affamé, en déprime ou en dépression, il est exclu de l'expédition.
- Verrouille ensuite les expéditions créées avant minuit
- Plus de modifications possibles
- Si un membre de l'expédition mange, il mange dans les stocks de la ville.

#### 3. Départ automatique (DEPARTED)

- **Cron job quotidien** : `0 8 * * *` (8h00)
- Ce Cron doit être exécuté avant daily-message.cron.ts.
- Fait partir toutes les expéditions LOCKED
- Initialise le chemin avec direction initiale
- Membres ne peuvent plus utiliser les commandes municipales
- Si un membre de l'expédition mange, il mange dans les stocks de l'expédition.

#### 4. Retour automatique (RETURNED)

- **Cron job quotidien** : `0 8 * * *` (8h00)
- Ce Cron doit être exécuté avant daily-message.cron.ts.
- lorsque le nombre de jour de l'expédition est terminé, passe l'expdédition de DEPARTED à RETURNED.
- Restitue les ressources à la ville
- Archive l'expédition

### Système de directions et déplacement

#### Nouvelles fonctionnalités (partiellement implémentées)

- **8 directions** : NORD, SUD, EST, OUEST + diagonales + UNKNOWN
- **Direction du jour** : `currentDayDirection` choisie quotidiennement. Tous les membres de l'expédition peuvent choisir la prochaine destination dans une liste déroulante. Le premier à valider le choix, bloque le choix pour tout les membres de l'expédition. La direction choisie est ajoutée au chemin.
- **Chemin complet** : `path` array des directions parcourues
- **Système de vote** : membres peuvent voter pour retour d'urgence

#### Fonctionnalité d'urgence

- **Vote d'urgence** : 50% des membres (arrondi au supérieur) peuvent déclencher un retour anticipé. L'expédition rentre alors au moment du prochain Retour automatique (RETURNED).

- **Comportement** : Lorsque l'on est dans une expédition en status DEPARTED, il devrait y avoir un bouton "retour en urgence".
  Ce bouton agit comme un togglable, si au moins la moitié des membres d'une expédition (hors isdead true ou agonie) appuie sur le bouton, alors l'expédition est retournée en urgence. Rappuyer sur le bouton doit annuler l'opt-in pour le retour en urgence. Un retour en urgence validé fait rentrer l'expédition lors du prochain cron avec le status RETURNED, a condition que tous les membres ne soient pas en isdead = true à ce moment là.
- **Cron job** : `processEmergencyReturns()` vérifie les votes
- **Retour catastrophique** : Voir exemple ci-après.

## Exemple de flows

Lundi je lance une expédition de 3 jours et j'ai 0PA a 23h30, a minuit lorsque l'expédition est LOCKED, on doit me donner mes PA du nouveau jour (cron daily-pa.cron.ts), puis retirer ces 2 PA pour le premier jour d'expédition (expedition.con.ts devrait s'en charger). Le mardi, premier jour d'expédition, j'ai donc naturellement 0 PA.
Le mercredi deuxière jour se passe de la même manière, le jeudi troisième jour également. le vendredi, jour de retour de l'expédition, A minuit, je récupère mes 2PA(cron daily-pa.cron.ts), mais cette fois ils ne me sont pas consommé (l'expédition est sur le retour). Lexpédition arrive à 8h du matin (RETURNED), c'est à partir de ce moment là et donc du retour d'expédition que je peux enfin réutiliser mes PA pour mes capacités, des chantiers etc en ville de manière classique.

Si un character ne peut pas dépenser ses deux PA (expedition.con.ts) pour continuer l'expédition (agonie, déprime, dépression, affamé, mort, etc) A ce moment là, il est automatiquement retiré de l'expédition, ses PA sont ramenés à 0 et il est renvoyé en ville. D'autres malus seront appliqués mais ce sera géré manuellement par les administrateurs. (il faudra un message de log public dans le channel de /config-channel-admin, de tyme type "**character** est rentré en catastrophe ! + tag admin").
-> Si l'expédition a votée le retour d'urgence, alors à minuit le cron (expedition.con.ts) ne retire pas les PA d'expédition (comme le vendredi dans l'exemple ci-dessus), l'expédition est sur le retour et cette dernière rentre à 8h comme une expedition qui passe en RETURNED car son délais d'expédition est terminé.

## Commandes Discord

### Commandes utilisateur

#### `/expedition`

- **Comportement contextuel** selon l'appartenance à une expédition
- **Boutons intelligents** selon le statut de l'expédition

##### Bouton `start`

- **Modal** de création avec sélection de ressources multiples
- Validation des stocks disponibles
- Sélection de durée (1-30 jours)
- Choix de direction initiale

##### Bouton `join`

- **Menu déroulant** des expéditions PLANNING disponibles
- Vérification : personnage actif, pas déjà en expédition
- Unique constraint empêche double inscription

##### Bouton `info`

- **Affichage détaillé** de l'expédition du personnage
- **Boutons contextuels** selon le statut
- Ressources actuelles et progression

##### Bouton `leave`

- **Quitter** une expédition (PLANNING uniquement)
- **Auto-terminaison** si dernier membre quitte l'expédition

##### Bouton `transfer`

- **Modal** de transfert avec montant et direction
- Ajout de nouvelle ressources possible (depuis le stock de la ville vers l'expédition), suppression de ressources possible (depuis les ressources de l'expédition vers la ville)
- Validation des stocks disponibles

### Commandes admin

#### `/expedition-admin`

- **Interface complète** de gestion
- **Menu déroulant** des expéditions
- une fois l'expédition choisie, doit voir un récap de l'expédition : ses stocks, ses membres, sa durée (passée et restante), son chemin, sa prochaine direction, son status etc. Pour la liste des membres, il faut également leur PA, PV, PM, faim.
- Actions : modifier, gérer membres, forcer retour, verrouiller, départ etc (doit être le plus complet possible car gestion administrateur)

## Règles métier

### Contraintes des personnages

- **Unicité** : Un personnage ne peut être que dans une seule expédition active
- **Disponibilité** : Membres LOCKED/DEPARTED ne peuvent pas utiliser les commandes municipales
- **Statut** : Seuls les personnages actifs et vivants peuvent rejoindre
- **PA** : Les membres partis (DEPARTED) ne peuvent pas utiliser de PA.

### Gestion des ressources

- **Prélevement** lors de création depuis `ResourceStock` ville
- **Transferts** possibles uniquement en phase PLANNING
- **Restitution** automatique au retour ou terminaison
- **Validation** : Quantités positives, stocks suffisants

### Sécurité et validation

- **Authentification** obligatoire sur tous les endpoints
- **Permissions admin** pour les fonctions sensibles
- **Transactions** pour la cohérence des données
- **Logging** de tous les événements importants

## Fonctionnalités en développement

### Gestion administrative étendue

- **Gestion des membres** forcée par les admins
- **Modification** de durée et ressources en cours
- **Interface de sélection** des personnages à gérer

### Système de directions avancé

- **Choix quotidien** de direction par les membres
- **Historique du chemin** parcouru

## Tests et qualité

### Tests unitaires

A étudier

### Tests d'intégration

A étudier

## Métriques et monitoring

### Logging structuré (si le fonctionnement parait logique et cohérent sinon en proposer un autre)

- **Événements trackés** : création, join/leave, verrouillage, départ, retour
- **Métadonnées** : ressources, durée, membres, timestamps
- **Service dédié** : `dailyEventLogService` pour les événements quotidiens

### Métriques de performance

- **Cron jobs** surveillés avec logs détaillés
- **Transactions** utilisées pour l'intégrité
- **Gestion d'erreurs** avec retry et logging

## Évolution future

faire des propositions après l'implémentation complète (cahier des charges V2 A rédiger)

### Améliorations techniques

faire des propositions après l'implémentation complète (cahier des charges V2 A rédiger)
