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
