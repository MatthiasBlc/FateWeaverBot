📊 Analyse : Bonus de Capacité des Objets

✅ Ce qui est BIEN implémenté

1. Schema BDD (Prisma) - backend/prisma/schema.prisma:595-607


    - Modèle ObjectCapacityBonus correctement défini
    - Relation avec ObjectType et Capability
    - Enum CapacityBonusType avec 4 types :
        - LUCKY_ROLL (Chasser+, Cueillir+, Miner+, Pêcher+, Cuisiner+)
      - HEAL_EXTRA (Soigner+)
      - ENTERTAIN_BURST (Divertir+)
      - ADMIN_INTERPRETED (Tisser+, Forger+, Menuiser+, Cartographier+, Rechercher+,

Auspice+) 2. Service Object - backend/src/services/object.service.ts:17-21, 46-50, 88-91 - Les capacityBonuses sont bien récupérés avec les relations - Inclus dans getAllObjectTypes(), getObjectTypeById(), et getCharacterInventory() 3. Frontend (Bot Discord) -
bot/src/features/admin/character-admin/character-objects.ts:79 - Les objets sont catégorisés correctement par type de bonus - Affichage des objets "capacité+" dans l'interface admin

❌ Ce qui N'EST PAS implémenté

PROBLÈME CRITIQUE : Les bonus ne sont JAMAIS appliqués lors de l'exécution des
capacités !

1. Controller Harvest - backend/src/controllers/capabilities.ts:304-309

const result = await capabilityService.executeHarvestCapacity(
characterId,
capabilityName,
isSummer,
paSpent === 2 // ❌ BUG : hardcodé, ignore les objets possédés !
);

Le 4ème paramètre luckyRoll devrait vérifier si le personnage possède un objet avec
bonusType: LUCKY_ROLL pour la capacité concernée, mais il est simplement hardcodé à
paSpent === 2.

2. Service Capability - backend/src/services/capability.service.ts

Aucune des méthodes n'applique les bonus :

- executeHarvestCapacity() (ligne 191) : reçoit luckyRoll mais ne vérifie jamais les
  objets
- executeMiner() (ligne 383) : pas de paramètre bonus
- executeFish() (ligne 490) : pas de gestion LUCKY_ROLL
- executeCraft() (ligne 647) : pas de gestion LUCKY_ROLL pour Cuisiner+
- executeSoigner() (ligne 819) : pas de gestion HEAL_EXTRA
- executeDivertir() (ligne 1095) : pas de gestion ENTERTAIN_BURST
- executeResearch() (ligne 974) : pas de gestion ADMIN_INTERPRETED

🛠️ Plan de correction

Pour implémenter correctement les bonus de capacité :

1. Créer une fonction utilitaire getCharacterCapacityBonuses(characterId, capabilityId)


    - Récupère l'inventaire du personnage
    - Filtre les objets ayant un capacityBonus pour la capacité donnée
    - Retourne le(s) type(s) de bonus applicable(s)

2. Modifier chaque controller/service pour :


    - Appeler la fonction utilitaire avant l'exécution
    - Appliquer le bonus selon le type :
        - LUCKY_ROLL : Double les PA consommés OU double le rendement (selon règles)
      - HEAL_EXTRA : +1 PV supplémentaire lors du soin
      - ENTERTAIN_BURST : Réduit le compteur nécessaire (5→3 ?)
      - ADMIN_INTERPRETED : Effet à définir par l'admin (message spécial ?)

3. Tester chaque capacité avec et sans objets bonus

   - LUCKY_ROLL : réalise deux tirages aléatoires et conserve le meilleur des deux pour le résultat final.
   - HEAL_EXTRA : 20% de chances d'avoir +1 PV supplémentaire lors du soin.
   - ENTERTAIN_BURST : Réduit le compteur nécessaire (5→3 ?)
   - ADMIN_INTERPRETED : Effet à définir par l'admin (message spécial ?)

4. Tester chaque capacité avec et sans objets bonus
