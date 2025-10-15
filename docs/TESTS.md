## Update des commandes

✅
Point sur les CRON ????

### Commandes Utilisateurs

/profil (COMPLÉTÉ - Phase 4)
-> un bouton "manger" et un "manger +". si faim <=0 ou >=4 alors on affiche ces boutons.

    ->  En Ville (pas dans une expédition avec status : DEPARTED)
      ->  le bouton "manger" fait manger 1 de nourriture venant de la ville, s'il n'y en a pas, il fait manger 1 vivre venant de la ville, s'il n'y en a pas erreur (plus rien à manger en ville).
      ->  le bouton "manger +" ouvre un message éphémère avec : état de la faim, état des stocks de vivres dans la ville et nourriture dans la ville avec une alerte de pénurie. La nourriture n'apparait que si la ressource nourriture existe dans le ResourceStock de la ville du character. Ce message propose 4 boutons:
        ->  manger 1 vivre (venant du stock de la ville)
        ->  manger 1 nourriture (venant du stock de la ville). Le bouton nourriture n'apparait que si le stock de nourriture >0 dans le ResourceStock de la ville du character
        ->  manger à sa faim des vivres (mange des vivres jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de vivre consommé. S'il faut consommer 3 vivres mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux vivres. Le bouton ne s'affiche que s'il faut consommer plus d'un seul vivre pour être à 4/4.
        ->  manger à sa faim de la nourriture (mange des nourritures jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de nourriture consommé. S'il faut consommer 3 nourritures mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux nourritures. Le bouton ne s'affiche que s'il faut consommer plus d'une seule nourriture pour être à 4/4. le bouton ne s'affiche que s'il y a au minimum 2 nourriture en stock de la ville.
    ->  En Expédition avec status : DEPARTED
      ->  le bouton "manger" fait manger 1 de nourriture venant de l'Expédition, s'il n'y en a pas, il fait manger 1 vivre venant de l'Expédition, s'il n'y en a pas erreur (plus rien à manger dans l'Expédition).
      ->  le bouton "manger +" ouvre un message éphémère avec : état de la faim, état des stocks de vivres dans l'Expédition et nourriture dans l'Expédition avec une alerte de pénurie. La nourriture n'apparait que si la ressource nourriture existe dans le ResourceStock de l'Expédition du character. Ce message propose 4 boutons:
        ->  manger 1 vivre (venant du stock de l'Expédition)
        ->  manger 1 nourriture (venant du stock de l'Expédition). Le bouton nourriture n'apparait que si le stock de nourriture >0 dans le ResourceStock de l'Expédition du character
        ->  manger à sa faim des vivres (mange des vivres jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de vivre consommé. S'il faut consommer 3 vivres mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux vivres. Le bouton ne s'affiche que s'il faut consommer plus d'un seul vivre pour être à 4/4.
        ->  manger à sa faim de la nourriture (mange des nourritures jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de nourriture consommé. S'il faut consommer 3 nourritures mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux nourritures. Le bouton ne s'affiche que s'il faut consommer plus d'une seule nourriture pour être à 4/4. le bouton ne s'affiche que s'il y a au minimum 2 nourriture en stock de l'Expédition.

/expedition (COMPLÉTÉ - Phases 5.1 + 5.2)
-> Ne devrait plus avoir de sous commandes (tout est géré par la commande /expedition directement avec des boutons)
-> ⚠️ le bouton pour créer une expédition a disparu. (voir les docs ce que l'on peut en tirer) - À INVESTIGUER
-> lorsque l'on est dans une expédition qui n'est pas encore en status DEPARTED, un bouton "transferer la nourriture" doit ouvrir une modale avec deux champs et gérer les deux ressources en transfert. il doit aussi gérer de manière ergonomique le transfert de vivres et / ou nourriture vers la ville et inversement. Un second bouton quitter l'expédition doit être présent. (COMPLÉTÉ - Phase 5.1)
-> lorsque l'on est dans une expédition en status DEPARTED, il devrait y avoir un bouton "retour de l'expédition en urgence".
Ce bouton agit comme un togglable, si au moins la moitié des membres d'une expédition (hors isdead true ou agonie) appuie sur le bouton, alors l'expédition est retournée en urgence. Rappuyer sur le bouton doit annuler l'opt-in pour le retour en urgence. Un retour en urgence validé fait rentrer l'expédition lors du prochain cron avec le status RETURNED, a condition que tous les membres ne soient pas en isdead = true à ce moment là. (COMPLÉTÉ - Phase 5.2)
-> ⏸️ il faut faire le point sur la gestion de la faim et des PA spécifiques en expédition. - À TESTER
-> ⏸️ Nombreux tests de fonctionnalité à faire et de CRON. - PHASE 7

### Commandes Administrateur

/expedition-admin
-> A tester en profondeur

1. Seul un personnage en vie en dépression a l'effet dépression.
2. confirme moi q'"Un personnage dans une expédition DEPARTED n'a pas accès aux stocks ou aux chantiers de la ville." est vrai.
3. Est-ce que les messages d'erreur sont harmonisés ? est-ce qu'il en reste qui n'utilise pas le système global ?
4. Est-ce que les emoji's sont harmonisés ? le fichier global ?
5. Les messages de log devraient tous apparaitrent dans le channel programmé par la commande /config-channel-admin. s'il n'y a pas de channel programmé, ignorer les messages de log.



un joueur ne peut avoir qu'un seul personnage actif,
Lors de la création désactiver les anciens et activer le nouveau
 ✅ Corrections appliquées avec succès !

  📋 Résumé des modifications :

  1. createCharacter() - backend/src/services/character.service.ts:117
  - ✅ Désactive maintenant TOUS les personnages actifs (morts ET vivants)
  - ✅ Suppression du filtre isDead: false
  - ✅ Commentaire ajouté pour documenter la règle métier

  2. upsertCharacter() - backend/src/controllers/characters.ts:88
  - ✅ Désactive maintenant TOUS les personnages actifs (morts ET vivants)
  - ✅ Logique corrigée dans les deux branches (existingCharacter ou non)
  - ✅ Commentaire ajouté pour documenter la règle métier

  🔒 Règle métier garantie :

  Un utilisateur ne peut avoir qu'UN SEUL personnage actif par ville
  - À la création d'un personnage → tous les autres sont désactivés
  - Un personnage mort reste actif jusqu'à ce que canReroll: true ET qu'un nouveau personnage soit créé
  - Les commandes admin peuvent outrepasser cette règle (pour debug)
-> A tester



  1. ✅ Système de faim - Déjà fonctionnel
  2. ✅ Heal bloqué si agonie affamé - Implémenté
  3. ✅ Mort après 2 jours d'agonie - Implémenté avec tracking agonySince
  4. ✅ Agonie bloque PA - Validation ajoutée
  5. ✅ Déprime limite 1PA/jour - Système complet avec compteur quotidien

  Le bot est maintenant conforme à toutes les spécifications ! 🎉

  
Changement du message de PA:
  Avant : Un panneau séparé avec "⚠️ ATTENTION" et un message pour PA >= 3.
Après : Affichage inline comme "3/4 ⚠️" ou "4/4 ⚠️" si PA >= 3, sinon juste "3/4" ou "4/4".
Constante Utilisée : STATUS.WARNING de 
emojis.ts
 (⚠️).

Dans profil s'il y a plus de 4 capacités, les boutons ne s'affichent pas 


1 - Point sur le système de faim:

Satiété = 4 , ici le character gagne 1 pv / jour (normalement déjà en place)
Petit creux = 3
Faim = 2
Affamé = 1 , Au lieu de gagner 2 PA / jour, il ne gagnera plus qu'1 PA / jour.
Meurt de faim = 0 (passe directement en status Agonie)

2 - Agonie doit être géré indépendemment (mais il me semble que c'est fait, à confirmer)
en Agonie, le character ne peut plus utiliser de PA d'aucune manière que ce soit

3 - Comment fonctionne l'agonie dans le code actuellement ?

4 - Point sur les points de mental :

5 - Dans la db resourceTypes emoji, il faudrait remplacer l'emoji par sa référence dans le fichier emojis.ts.
le changement doit aussi être appliqué dans le seed en réponse.

6 - Pour chaque emoji présent dans le bot, il faudrait s'assurer qu'il fait référence à un emoji dans le fichier emojis.ts.

7 - Création d'une nouvelle commande admin:
/new-element-admin
Ajouter une nouvelle capacité
Ajouter une nouvelle ressource



-------------------------------
Nous allons corriger les capacités

Capacité
Récolteurs
 - 🏹 Chasser (2 PA)
texte descriptif : Chasser du gibier pour obtenir des vivres. Plus efficace en été.
Concrètement : prend un élément random d'un tableau et donne ce nombre de vivres. Un tableau différent est utilisé si la saion est hiver. (ne fonctionne pas correctement à ce jour)
 - 🌿 Cueillir (1 PA)
texte descriptif : Cueillir des plantes comestibles pour obtenir des vivres. Plus efficace en été.
Concrètement : prend un élément random d'un tableau et donne ce nombre de vivres. Un tableau différent est utilisé si la saion est hiver. (ne fonctionne pas correctement à ce jour)
 - ⛏️  Miner (2 PA)
texte descriptif : Récolter du minerai
Concrètement : donne un nombre aléatoire de minerai comme défini, rappelle moi ce qui est codé actuellement.
 - 🎣 Pêcher (1 PA, ou 2PA)
texte descriptif : Pêcher du poisson pour obtenir des Vivres. Peut utiliser 2 PA pour un lancer chanceux.
Concrètement : prend un élément random d'un tableau et donne ce nombre de vivres. L'utilisateur a le choix d'utiliser 1 PA ou 2 PA pour cette capacité. Un tableau différent est utilisé s'il en utilise 2 d'un coup. (ne fonctionne pas correctement à ce jour, impossible de choisir entre 1 et 2 PA)

Artisans
 - 🧵 Tisser (1 PA)
texte descriptif : Tisser du tissu
Concrètement : Voir ARTISANAT
 - 🔨 Forger (1 PA)
texte descriptif : Forger du métal
Concrètement : Voir ARTISANAT
 - 🪚  Travailler le bois (1 PA)
texte descriptif : Transformer du bois
Concrètement : Voir ARTISANAT
 - 🫕  Cuisiner (1 PA)
texte descriptif : Multiplier des Vivres en Repas
Concrètement : transforme un nombre de vivres en nourriture.(quel serait l'impact de changer le terme nourriture en repas ?). Donne moi le fonctionnement de cette capacité comme elle est codée.

Scientifiques
 - 🗺️  Cartographier (1 PA, ou 2PA)
texte descriptif : Analyser les alentours pour révéler de nouvelles cases sur la carte
Concrètement : l'utilisateur doit pouvoir choisir s'il utilise 1 ou 2 pa pour cette action (s'il a au moins 2 PA en stock). Le message public (channel configuré) doit tag les admins du serveur. une sera faite par les admins en réponse.
 - 🔎  Rechercher (1 PA, ou 2PA)
texte descriptif : Analyser un objet/lieu/créature pour obtenir des informations dessus
Concrètement : l'utilisateur doit pouvoir choisir s'il utilise 1 ou 2 pa pour cette action (s'il a au moins 2 PA en stock). Le message public (channel configuré) doit tag les admins du serveur. une sera faite par les admins en réponse.
 - 🌦️  Auspice (1 PA, ou 2PA)
texte descriptif : Analyser les cieux pour anticiper la météo des prochains jours
Concrètement : l'utilisateur doit pouvoir choisir s'il utilise 1 ou 2 pa pour cette action (s'il a au moins 2 PA en stock). Le message public (channel configuré) doit tag les admins du serveur. une sera faite par les admins en réponse.

 - ⚕️  Soigner (1 PA)
texte descriptif : Rendre 1 PV à 1 personne OU utiliser 2 PA pour créer 1 Cataplasme
Concrètement : Pour 1 PA, le character doit pouvoir choisir une personne autour de lui pour la soigner. Pour 2 PA, le character doit pouvoir créer un cataplasme. Il doit choisir ce qu'il veut faire. devons nous créer une seconde capacité pour créer le cataplasme ?


SPECIAL
- 🎭 Divertir (1 PA)
Divertir le village pour faire regagner des PM. Tous les 5 usages, tout le monde autour gagne 1 PM.
Concrètement : un message public doit être fait pour dire que le personnage prépare une animation + nombre de PA mis dans l'action. Lorsque le personnage a mis 5PA au total dans l'action, le message public doit être modifié pour dire que l'animation est terminée et que tout le monde a gagné 1 PM.



ARTISANAT
 - Pour l'artisanat, nous allons créer le concept de Projets.
 Chaque capacités d'artisanat (sauf cuisiner qui fonctionne à sa manière) doit avoir sa liste de projets.
 Les projets sont similaire aux chantier: ils ont un nom, un nombre de PA requis, ils peuvent avoir une ou plusieurs ressources nécessaires. En revanche un projet est lié à une resource.
 exemple, je suis artisan, je souhaite faire une planche. Je damande aux admins.
 Ils valident donc avec la commande  /new-element-admin, il s'assure que la ressource planche existe ou alors il la créé. Ensuite, il va créer un projet avec un nom, un nombre de PA requis, les ressources nécessaires et la ressource de sortie, ainsi que sa quantité.
 Ce projet est attribué à un ou plusieurs corps de capacités Artisant. (tisser, forger, travailler le bois). Dans notre exemple travailler le bois.
 Lorsqu'un personnage avec la capacité en question, ici travailler le bois, utilise sa capacité, il doit voir la liste des projets disponibles.(non terminés seulement), il doit pouvoir choisir l'un d'entre eux et y attribuer ressources et PA.
 Lorsqu'un projet est terminé, il doit être marqué comme terminé et la ressource de sortie doit être ajoutée au stock de la ville.


