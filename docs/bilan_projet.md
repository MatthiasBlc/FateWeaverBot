# Bilan détaillé — Capacités d’artisanat (Tisser, Forger, Menuiser/Travailler le bois) et Système de Projets

Ce rapport synthétise le fonctionnement réel constaté dans le code de l’application (backend + bot) au 2025-10-28. Il couvre:
- Les capacités d’artisanat: Tisser, Forger, Menuiser (souvent appelée « Travailler le bois » dans la doc)
- Le système de Projets: modèle de données, endpoints backend, intégration côté bot, flux utilisateur
- Les incohérences détectées et recommandations

Sources principales analysées:
- backend/src/services/project.service.ts, backend/src/controllers/projects.ts, backend/src/routes/projects.ts
- backend/prisma/schema.prisma (+ migrations)
- bot/src/features/projects/*.ts, bot/src/utils/{button-handler,select-menu-handler}.ts
- backend/src/controllers/capabilities.ts, backend/src/services/capability.service.ts

---

## 1) Résumé exécutif
- Les « capacités d’artisanat » Tisser, Forger et Menuiser ne sont PAS exécutées comme les autres capacités (Chasser, Cueillir, etc.). Elles sont gérées exclusivement via le système de Projets.
- L’énumération de référence est `CraftType` définie dans Prisma: `TISSER`, `FORGER`, `MENUISER`.
- Le backend expose des endpoints pour créer, lister, contribuer (PA/ressources) et redémarrer des « blueprints » de projets.
- Le bot fournit l’UX Discord: consulter projets liés aux crafts du personnage, contribuer via modal (PA + ressources), créer un projet (admin) avec craft types et coûts.
- « Travailler le bois » dans la documentation correspond au CraftType `MENUISER` dans le code.
- Plusieurs décalages existent entre la définition du backend et celle du bot (ex: validators Zod vs payload effectif; support des outputs « objet » côté bot mais pas encore géré au backend lors de la complétion).

---

## 2) Capacités d’artisanat: comportement réel
- Ces crafts ne sont pas des « character capabilities » exécutées via `/capabilities`.
- Ils sont matérialisés par des Projets artisanaux auxquels les joueurs contribuent (PA et/ou ressources) selon leur(s) craft type(s).
- Les noms en jeu:
  - Tisser → `CraftType.TISSER`
  - Forger → `CraftType.FORGER`
  - Menuiser (anciennement « Travailler le bois » dans la doc) → `CraftType.MENUISER`

Points clés:
- Aucune exécution directe via `CapabilityService` pour Tisser/Forger/Menuiser. La méthode `executeCraft` est explicitement dépréciée et lève une erreur.
- L’accès aux projets listés côté bot est filtré par les capacités CRAFT détenues par le personnage (côté bot, mapping par nom pour récupérer `CraftType`).

Références code:
- Dépréciation craft direct: backend/src/services/capability.service.ts → `executeCraft(...)` lève une erreur.
- Filtrage bot par capacités: bot/src/features/projects/projects.handlers.ts (recherche des capacités "Tisser", "Forger", "Menuiser"), mapping vers `TISSER|FORGER|MENUISER`.

---

## 3) Système de Projets

### 3.1 Modèle de données (Prisma)
- `enum CraftType { TISSER; FORGER; MENUISER }`
- `model Project`:
  - `name`, `paRequired`, `paContributed`, `status (ACTIVE|COMPLETED)`
  - Sortie:
    - `outputResourceTypeId?` et `outputQuantity`
    - `outputObjectTypeId?` (support pour objets; relation `outputObjectType`)
  - `townId`, `createdBy`, timestamps
  - `craftTypes: ProjectCraftType[]` (un projet peut être réalisable par plusieurs crafts)
  - `resourceCosts: ProjectResourceCost[]` (coûts optionnels en ressources)
  - Champs blueprint:
    - `isBlueprint`, `originalProjectId`, `paBlueprintRequired?`, `blueprintResourceCosts: ProjectBlueprintResourceCost[]`

- `model ProjectCraftType` (clé unique (projectId, craftType))
- `model ProjectResourceCost` (suivi contributed vs required + ressource liée)
- `model ProjectBlueprintResourceCost` (coûts « blueprint » séparés)

Réf: backend/prisma/schema.prisma

Remarque historique:
- Une migration plus ancienne nommait le craft bois `TRAVAILLER_LE_BOIS`; l’état actuel du schéma est `MENUISER`.

### 3.2 Services backend
- `ProjectService` (backend/src/services/project.service.ts):
  - `createProject(input)`
    - Valide unicité (name,townId), existence de la ressource de sortie si fournie.
    - Exige au moins un `craftType`.
    - Crée `Project` + `ProjectCraftType` + `ProjectResourceCost`.
    - Si `blueprintResourceCosts` fournis → crée les entrées `ProjectBlueprintResourceCost`.
  - `getActiveProjectsForCraftType(townId, craftType)`
  - `getProjectById(projectId)` (inclut craftTypes, resourceCosts, blueprintResourceCosts)
  - `contributeToProject({ characterId, projectId, paAmount, resourceContributions })`
    - Vérifie: personnage existe, non en expédition DEPARTED, même ville, projet non terminé.
    - PA: incrémente `paContributed` sans dépasser `paRequired`.
    - Ressources: décrémente stock ville (`ResourceStock`) et incrémente `quantityContributed` sans dépasser `quantityRequired`.
    - Si PA et ressources sont complètes → passe `status=COMPLETED` et crédite la sortie:
      - Si `outputResourceTypeId` non null → `ResourceStock` de ville +`outputQuantity`.
      - TODO explicite: si `outputObjectTypeId` non null, à implémenter (ex: inventaire personnage).
  - `getAllProjectsForTown(townId)`
  - `deleteProject(projectId)` avec garde-fous (pas terminé, pas de contributions)
  - Blueprints:
    - `convertToBlueprint(projectId)`
    - `restartBlueprint(blueprintId, createdBy)`
      - Crée un nouveau `Project` à partir du blueprint, copie les craftTypes et coûts (utilise coûts blueprint s’ils existent, sinon retombe sur coûts originaux), PA requis = `paBlueprintRequired ?? paRequired`.

### 3.3 Contrôleurs et routes backend
- Routes: backend/src/routes/projects.ts
  - POST `/projects` → `createProject`
  - GET `/projects/town/:townId` → tous les projets d’une ville
  - GET `/projects/town/:townId/craft-type/:craftType` → filtrés par craft
  - GET `/projects/:projectId`
  - POST `/projects/characters/:characterId/projects/:projectId/contribute` → contribution unifiée PA/ressources
  - DELETE `/projects/:projectId`
  - POST `/projects/:projectId/restart` → redémarrer un blueprint

- Validations (Zod): backend/src/api/validators/project.schema.ts
  - Décalage relevé: `CreateProjectSchema` attend `{ townId, blueprintId, characterId }` (obligatoires) alors que `controllers/projects.ts::createProject` consomme `{ name, paRequired, outputResourceTypeId, outputQuantity, townId, createdBy, craftTypes, resourceCosts }`.
  - Les autres schémas (Get, Contribute, Delete, Restart) correspondent aux routes.

Conclusion: le validator de création ne matche pas l’implémentation actuelle du contrôleur. À corriger.

### 3.4 Intégration côté bot (Discord)
- Consultation des projets par un joueur: `handleProjectsCommand`
  - Récupère la ville (via guild), le personnage actif, et ses capacités.
  - Filtre les capacités pour ne garder que « Tisser », « Forger », « Menuiser ».
  - Map vers `CraftType` puis appelle `apiService.projects.getProjectsByCraftType` pour chacune.
  - Regroupe, déduplique, groupe par statut, et affiche un embed.
  - Ajoute boutons:
    - "Participer" si au moins un projet `ACTIVE`
    - Boutons "🔄 <nom>" pour redémarrer des blueprints (jusqu’à 5 par ligne)

- Participation (bouton): `handleParticipateButton`
  - Charge projets actifs filtrés, propose un `StringSelectMenu`.
  - Sur sélection, ouvre un modal pour saisir PA + contributions ressources (avec bornes max par coût restant).
  - À la soumission: appelle `apiService.projects.contributeToProject`.
  - Loge la contribution et annonce la complétion si applicable.

- Création d’un projet (admin): `project-creation.ts`
  - Flow multi-étapes (modal + select menus + boutons): nom, PA requis, craftTypes, choix de sortie (ressource OU objet), quantité, ressources requises, coûts blueprint (optionnels), puis POST `/projects`.
  - Remarque: le bot envoie potentiellement `outputObjectTypeId`, `paBlueprintRequired`, `blueprintResourceCosts` — le backend `controllers/projects.ts` ne prend pas encore en compte `outputObjectTypeId`, mais le `ProjectService`/schéma les supportent.

- Redémarrer un blueprint: `handleRestartBlueprintButton` → POST `/projects/:projectId/restart`.

---

## 4) Flux fonctionnels
- Consultation: joueur → `/projets` (ou bouton profil) → liste par craft détenu → détails + statut + coûts.
- Contribution: bouton "Participer" → select projet → modal → POST contribute → mise à jour PA/ressources → éventuellement complétion + crédit ressource de sortie.
- Création (admin): commande → modal + sélections → POST `/projects` → projet ACTIVE prêt à contributions.
- Blueprint: une fois un blueprint configuré (champ `isBlueprint`), bouton dédié côté bot pour le redémarrer → crée une copie ACTIVE avec coûts blueprint.

---

## 5) Contraintes, garde-fous et validations
- Contribution:
  - Interdit si personnage en expédition `DEPARTED`.
  - Ville du personnage doit correspondre à la `townId` du projet.
  - PA: `paContributed` ≤ `paRequired`.
  - Ressources: `quantityContributed` ≤ `quantityRequired` et stock ville suffisant (décrément du stock lors de la contribution).
- Complétion et récompense:
  - Si `outputResourceTypeId` renseigné → crédit stock ville à la fin.
  - Si `outputObjectTypeId` renseigné → TODO (à implémenter, voir commentaire dans service).

---

## 6) Incohérences et dettes techniques relevées
- Validators vs contrôleur de création:
  - `CreateProjectSchema` ne correspond pas aux champs réellement traités par `controllers/projects.ts::createProject`.
- Support des objets en sortie:
  - Le schéma et le bot gèrent `outputObjectTypeId`, mais le contrôleur de création ne le prend pas en compte et la complétion n’ajoute pas encore l’objet (TODO dans `ProjectService`).
- Nommage craft bois:
  - Code standardisé: `MENUISER`.
  - Docs/typages: quelques occurrences encore de `TRAVAILLER_LE_BOIS` (ex: bot/src/features/projects/projects.types.ts). À aligner.
- Exécution craft dépréciée:
  - `CapabilityService.executeCraft` est obsolète et lève systématiquement une erreur; s’assurer qu’aucun appel côté bot/clients n’y pointe encore.

---

## 7) Recommandations
- Aligner les validators Zod sur l’API réelle de création de projet:
  - Mettre à jour `CreateProjectSchema` pour refléter: `{ name, paRequired, outputResourceTypeId?, outputObjectTypeId?, outputQuantity, townId, createdBy, craftTypes[], resourceCosts?, paBlueprintRequired?, blueprintResourceCosts? }`.
- Étendre `controllers/projects.ts::createProject` pour accepter `outputObjectTypeId` (en plus de `outputResourceTypeId`) et le transmettre au service.
- Implémenter la récompense objet lors de la complétion:
  - Si `outputObjectTypeId` ≠ null → décider du destinataire (ville vs inventaire créateur vs inventaires d’artisans) et implémenter en base (`CharacterInventorySlot`) selon le design voulu.
- Uniformiser le vocabulaire:
  - Remplacer toutes les mentions de `TRAVAILLER_LE_BOIS` par `MENUISER` côté bot/types et docs.
- Tests/QA:
  - Cas limites de contributions (dépassement PA et ressources)
  - Contributions simultanées (transactions Prisma déjà utilisées)
  - Redémarrage blueprint avec coûts blueprint vs coûts originaux
  - Stock ville insuffisant → message d’erreur cohérent côté bot

---

## 8) Checklist de vérification (rapide)
- Projets listés par craft du perso seulement (TISSER/FORGER/MENUISER) — OK
- Contribution refuse si expédition `DEPARTED` — OK
- Complétion crédite la ressource de sortie — OK
- Création projet admin: support craftTypes multiples + coûts ressources — OK
- Blueprints: restart crée copie ACTIVE avec coûts blueprint — OK
- Incohérences validators/contrôleur — À corriger
- Sortie objet: support schéma/UI, pas de crédit automatique — À implémenter
- Vocabulaire bois: utiliser `MENUISER` partout — À aligner


## 9) Annexes — Références de code clés
- Schéma Prisma: backend/prisma/schema.prisma (Project, ProjectCraftType, ProjectResourceCost, ProjectBlueprintResourceCost, CraftType)
- Service projets: backend/src/services/project.service.ts
- Repository projets: backend/src/domain/repositories/project.repository.ts
- Routes/Contrôleurs: backend/src/routes/projects.ts, backend/src/controllers/projects.ts
- Handlers bot: bot/src/features/projects/{projects.handlers.ts, project-creation.ts, projects.utils.ts}
- Capabilities (contexte): backend/src/controllers/capabilities.ts, backend/src/services/capability.service.ts

## 10) Guide non-développeur — Flows et règles détaillées

Ce guide explique le fonctionnement « comme dans un jeu », sans jargon technique. Il couvre les rôles, les étapes, les règles, et des exemples concrets pour Tisser, Forger, Menuiser.

### A. Concepts clés
- **PA (Points d’Action)**: l’énergie d’un personnage pour participer à des projets.
- **Ressources**: biens stockés par la ville (ex: Bois, Minerai) utilisés comme coûts ou obtenus en récompense.
- **Capacités d’artisanat**: Tisser, Forger, Menuiser. Elles donnent le droit de contribuer aux projets correspondants.
- **Projet**: une tâche artisanale collaborative. Il demande un total de PA et parfois des ressources pour produire un résultat.
- **Blueprint (Plan)**: un modèle de projet réutilisable. On peut le redémarrer pour lancer une nouvelle copie du projet.

### B. Rôles et responsabilités
- **Joueur artisan**:
  - Voit les projets compatibles avec ses crafts (Tisser/Forger/Menuiser).
  - Contribue des PA et/ou dépose des ressources depuis le stock de la ville.
- **Administration (MJ/Staff)**:
  - Crée les projets (nom, crafts autorisés, PA requis, coûts, résultat).
  - Crée et gère les blueprints; peut redémarrer un blueprint.
- **Ville (stock commun)**:
  - Reçoit les ressources de récompense lorsque le projet est terminé.

### C. Parcours joueur — de A à Z
1. **Découvrir les projets**
   - Commande Discord « Projets » → liste des projets de la ville filtrés selon vos crafts.
   - Chaque projet indique: nom, statut (Actif/Terminé), PA requis/restants, coûts en ressources restants, et résultat attendu.
2. **Participer**
   - Cliquer « Participer » → choisir un projet → un formulaire s’ouvre.
   - Saisir le nombre de **PA** à investir et, si besoin, des **quantités** de ressources à fournir.
   - Les limites affichées empêchent de dépasser ce qui reste à contribuer.
3. **Validation**
   - Si vous êtes en expédition (état « parti »), vous ne pouvez pas contribuer.
   - Vous devez être dans la même ville que le projet et la ville doit posséder les ressources à fournir.
4. **Résultat immédiat**
   - Les PA et ressources sont débités. La progression du projet avance.
5. **Achèvement**
   - Quand le total des PA et des ressources requis atteint 100%, le projet passe « Terminé ».
   - La **récompense** (le plus souvent une ressource, ex: Tissu, Métal, Planches) est ajoutée au stock de la ville.
   - Si la récompense est un **objet**, le comportement sera précisé par les règles (à implémenter côté système).

### D. Parcours administration — création et gestion
1. **Créer un projet**
   - Choisir: nom, craft(s) autorisé(s) (Tisser/Forger/Menuiser), PA requis, résultat (ressource ou objet) et quantité, coûts en ressources.
2. **Blueprints**
   - Optionnel: définir un plan réutilisable avec ses propres coûts/PA.
   - Une fois un blueprint en place, on peut le **redémarrer** pour créer une nouvelle instance « Active ».
3. **Suivi**
   - Vérifier la progression, supprimer un projet vide non commencé si nécessaire, ou le laisser se compléter naturellement.

### E. Règles métier essentielles
- **Éligibilité**: seul un personnage avec le craft correspondant voit et peut contribuer au projet.
- **Contributions**:
  - Les PA ajoutés ne peuvent pas dépasser le total requis.
  - Les ressources fournies sont immédiatement retirées du stock de la ville et plafonnées aux besoins restants.
- **Empêchements**:
  - Personnage en expédition « parti »: contribution refusée.
  - Projet déjà terminé: contribution refusée.
- **Achèvement**:
  - Nécessite 100% des PA et 100% de tous les coûts en ressources.
  - Récompense créditée au stock de la ville (ressource). Pour objet: règles à préciser (inventaire destinataire, etc.).

### F. Exemples concrets par craft
- **Tisser (WEAVING)**
  - Idée: Transformer du Bois en **Tissu** via un projet de tissage.
  - Exemple: « Métier à tisser rudimentaire » — 10 PA + 20 Bois → 10 Tissu.
- **Forger (FORGING)**
  - Idée: Transformer du Minerai en **Métal** via un projet de forge.
  - Exemple: « Forge de fortune » — 12 PA + 15 Minerai → 8 Métal.
- **Menuiser (WOODWORKING)**
  - Idée: Transformer du Bois en **Planches** via un atelier de menuiserie.
  - Exemple: « Atelier de menuiserie » — 8 PA + 12 Bois → 12 Planches.

### G. Scénarios pas-à-pas
- **Solo**: Vous êtes Tisserand(e). Vous voyez un projet « Tisser des toiles ». Il reste 4 PA et 6 Bois. Vous investissez 3 PA et 6 Bois → il reste 1 PA → un(e) autre joueur(se) termine.
- **Équipe**: Trois Forgeron(ne)s répartissent l’effort: 5/4/3 PA et 5/7/3 Minerai. Le cumul atteint le total → la ville reçoit le Métal.
- **Blueprint**: Un plan « Atelier standard » (PA 10, Bois 10) est redémarré chaque semaine pour maintenir la production de Planches.

### H. FAQ opérationnelle
- **Q: Puis-je contribuer si je n’ai pas le craft ?**
  - R: Non, seuls les personnages disposant du craft correspondant peuvent contribuer.
- **Q: Que se passe-t-il si le stock de la ville est insuffisant ?**
  - R: La contribution en ressources est refusée pour la quantité excédentaire; ajustez à ce qui est disponible.
- **Q: Qui reçoit la récompense ?**
  - R: Par défaut, la ville reçoit la ressource. Pour les objets, la règle sera définie (à implémenter).
- **Q: Peut-on arrêter un projet lancé ?**
  - R: On peut le supprimer seulement s’il n’a pas encore reçu de contributions et n’est pas terminé.
- **Q: Puis-je contribuer en plusieurs fois ?**
  - R: Oui, dans la limite des besoins restants.

Fin du rapport.
