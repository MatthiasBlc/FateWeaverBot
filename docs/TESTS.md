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

---

Nous allons corriger les capacités

Capacité
Récolteurs

- 🏹 Chasser (2 PA)
  texte descriptif : Chasser du gibier pour obtenir des vivres. Plus efficace en été.
  Concrètement : prend un élément random d'un tableau et donne ce nombre de vivres. Un tableau différent est utilisé si la saion est hiver. (ne fonctionne pas correctement à ce jour)
- 🌿 Cueillir (1 PA)
  texte descriptif : Cueillir des plantes comestibles pour obtenir des vivres. Plus efficace en été.
  Concrètement : prend un élément random d'un tableau et donne ce nombre de vivres. Un tableau différent est utilisé si la saion est hiver. (ne fonctionne pas correctement à ce jour)
- ⛏️ Miner (2 PA)
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
- 🪚 Travailler le bois (1 PA)
  texte descriptif : Transformer du bois
  Concrètement : Voir ARTISANAT
- 🫕 Cuisiner (1 PA)
  texte descriptif : Multiplier des Vivres en Repas
  Concrètement : transforme un nombre de vivres en nourriture.(quel serait l'impact de changer le terme nourriture en repas ?). Donne moi le fonctionnement de cette capacité comme elle est codée.

Scientifiques

- 🗺️ Cartographier (1 PA, ou 2PA)
  texte descriptif : Analyser les alentours pour révéler de nouvelles cases sur la carte
  Concrètement : l'utilisateur doit pouvoir choisir s'il utilise 1 ou 2 pa pour cette action (s'il a au moins 2 PA en stock). Le message public (channel configuré) doit tag les admins du serveur. une sera faite par les admins en réponse.
- 🔎 Rechercher (1 PA, ou 2PA)
  texte descriptif : Analyser un objet/lieu/créature pour obtenir des informations dessus
  Concrètement : l'utilisateur doit pouvoir choisir s'il utilise 1 ou 2 pa pour cette action (s'il a au moins 2 PA en stock). Le message public (channel configuré) doit tag les admins du serveur. une sera faite par les admins en réponse.
- 🌦️ Auspice (1 PA, ou 2PA)
  texte descriptif : Analyser les cieux pour anticiper la météo des prochains jours
  Concrètement : l'utilisateur doit pouvoir choisir s'il utilise 1 ou 2 pa pour cette action (s'il a au moins 2 PA en stock). Le message public (channel configuré) doit tag les admins du serveur. une sera faite par les admins en réponse.

- ⚕️ Soigner (1 PA)
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
  Ils valident donc avec la commande /new-element-admin, il s'assure que la ressource planche existe ou alors il la créé. Ensuite, il va créer un projet avec un nom, un nombre de PA requis, les ressources nécessaires et la ressource de sortie, ainsi que sa quantité.
  Ce projet est attribué à un ou plusieurs corps de capacités Artisant. (tisser, forger, travailler le bois). Dans notre exemple travailler le bois.
  Lorsqu'un personnage avec la capacité en question, ici travailler le bois, utilise sa capacité, il doit voir la liste des projets disponibles.(non terminés seulement), il doit pouvoir choisir l'un d'entre eux et y attribuer ressources et PA.
  Lorsqu'un projet est terminé, il doit être marqué comme terminé et la ressource de sortie doit être ajoutée au stock de la ville.

pécher grigri => mettre après 3/3/3

# Projet et blueprint

Le système de projet doit légèrement évoluer.
Un projet devient un blueprint une fois qu'il a été terminé une première fois.
la fabrication de la version blueprint d'un projet a des couts différents (généralement inférieur), du cout du projet d'origine mais demande les mêmes matériaux.
Lors de la création d'un projet, il faut désormais lui définir ses couts en PA et Ressources pour sa première construction mais également pour les suivante une fois en mode blueprint.
Les règles de construction des blueprints sont les mêmes que les projets, ils partagent également leurs interfaces.
Lorsqu'une blueprint est terminée, elle peut être recommencée autant de fois que l'on le souhaite.

# évolutions des expéditions:

/expedition:
-> Confirme moi que la faim descend bien également en expédition (DEPARTED), et que l'on peut bien manger depuis sa fiche /profil en consommant les ressources vivres et nourriture disponibles dans l'expedition et non pas la ville.

-> Chaque jour, le cron doit donner 2 PA aux characters. En expédition, il faut retirer 2 PA par jours, chaque jours. Une expédition de 3 jours doit avoir couté 6 PA au character au final (2 par jour).
-> exemple : Lundi je lance une expédition de 3 jours et j'ai 0PA a 23h30, a minuit lorsque l'expédition est locked, on doit me donner mes PA du nouveau jour, puis retirer ces 2 PA pour le premier jour d'expédition. Le mardi, premier jour d'expédition, j'ai donc naturellement 0 PA.
Le mercredi deuxière jour se passe de la même manière, le jeudi troisième jour également. le vendredi, jour de retour de l'expédition, A minuit, je récupère mes 2PA, mais cette fois ils ne me sont pas consommé (l'expédition est sur le retour). Lexpédition arrive à 8h du matin, c'est à partir de ce moment là et donc du retour d'expédition que je peux enfin réutiliser mes PA pour mes capacités, des chantiers etc en ville de manière classique.
-> Si un character ne peut pas dépenser ses deux PA pour continuer l'expédition (agonie, déprime, dépression, affamé, mort, etc) A ce moment là, il est automatiquement retiré de l'expédition, ses PA sont ramenés à 0 et il est renvoyé en ville. D'autres malus seront appliqués mais ce sera géré manuellement par les administrateurs. (il faudra un message type "**character** est rentré en catastrophe ! + tag admin").
-> Si l'expédition a votée le retour d'urgence, alors à minuit le cron ne retire pas les PA d'expédition (comme le vendredi dans l'exemple ci-dessus), l'expédition est sur le retour et cette dernière rentre à 8h.

->Quand on crée une expedition avec plus de ressources qu'il n'y en a en ville, il doit y avoir un message d'erreur explicite.

->Lors de la création d'une expédition, l'utilisateur doit voir apparaitre également un menu déroulant pour choisir la direction. les directions possibles sont [Nord,Nord-Est,Est,Sud-Est,Sud,Sud-Ouest,Ouest,Nord-Ouest]. Cette valeur est définitive pour l'expédition et ne peut pas être changée une fois le formulaire validé.
->Si a minuit, aucune destination n'est choisie, remplir la destivation avec Unknown. Les admininstrateurs s'occuperons de décider ou va l'expédition.
-> Une fois l'expédition DEPARTED, un membre de l'expéition doit choisir la prochaine direction avec le même menu déroulant. Une fois que quelqu'un l'a choisie, le menu ne doit plus être disponible pour les autres. La direction choisie doit être affichée dans la fiche de l'expédition.
La direction choisie est celle de la destination du lendemain.
Donc dans une expédition créer le lundi pour une durée de 3 jours, le Lundi on définit la direction du mardi, l'expédition passe en DEPARTED le mardi, le mardi on définit la direction du mercredi, le mercredi la direction du jeudi. En revanche puisque l'expédition rentre le vendredi, le jeudi on ne défini pas de direction.
->Idéalement, le chemin de l'expédition (le suite de direction) devrait être stockée en base dans un array.

# Daily messages:

Tout les jours à 8h du matin, un message doit être envoyé dans le channel configuré (config-channel)
Le message doit contenir :

- La meteo (voir ci-dessous),
- un récapitulatif de toutes les actions de la veille (projets terminés, chantiers terminés, ressources trouvées etc)
- un récapitulatif des stocks
- Le bilan du des expéditions qui partent (ressources prises, durée etc), retour(ressources rammenées qui sont ajoutrées au stock), retour en urgence d'une expédition, retour en catastrophe d'un membre d'une expédition etc.

Pour la Météo :
Nous allons avoir 4 array de plusieurs messages chacun.
Un array été, un array hiver, un array pour le premier jour de l'été, un array pour le premier jour de l'hiver.
Chaque jour, le cron va prendre un message aléatoire dans l'array correspondant à la saison et le jour de la semaine. Pour les array hiver et été, un même message ne peut pas apparaitre deux fois dans la même saison (tant que la saison n'a pas changé donc).

Il faut une commande admin permettant de proposer un message "Météo" pour le lendemain.
Si un message est paramétré par ce système, c'est ce Message qui sera pris pour la partie Météo. Une fois le message envoyé, nous reprennons le système classique les jours suivants.

# Update nom travailler le bois

la capacité travailler le bois doit être renommer PARTOUT : Menuiser

# Objets et inventaires.

intégration d'un système d'objets.
Un objet est défini par un nom, il peut avoir une une description.
Une liste d'objets exisants est disponible en base de données, avec un fonctionnement similaire aux ResourcesType.

Chaque personnage possède un inventaire.
Un inventaire appartient à un seul personnage.
Un inventaire peut contenir plusieurs objets.

Dans /profil, il faut afficher l'inventaire du personnage.
dans /profil, il faut ajouter un bouton permettant de donner un objet à un autre personnage.
Le bouton emmenère alors sur un message avec un liste déroulante pour choisir un personnage avec nous (dans la même ville, ou dans la même expédition DEPARTED). Il faut également une autre liste déroulante ou l'utilisateur peut choisir le ou les objets qu'il souhaite envoyer.
Une fois que l'utilisateur a fait ses choix, il faut afficher un message de confirmation.

Un projet d'artisanat (/bluerpint) peut fabriquer une resource (dans ce cas elle va en ville à la fin comme prévu à l'origine), ou un objet (dans ce cas il arrive directement dans l'inventaire de le la personne qui termine le chantier de création de l'objet).

Dans /character-admin, les admins doivent avoir un nouveau bouton permettant de donner ou de retirer un (ou plusieurs) objet à un personnage.
Un personnage peut tout à fait avoir plusieurs fois le même objet dans son inventaire.

Dans /new-element-admin, il faut ajouter un bouton permettant de créer un nouvel objet.

### Voici une liste d'objets à mettre en seed:

Appeau
Herbier
Canari
Filet
Boussole
Somnifère
Bougie
Grenouille
Couronne de fleurs
coquillage

# évolution pêche

Pour le pécheur dans le tableau de récompenses à 2PA, le dernier champ est "un grigri", le "grigri" est un en fait un objet coquillage (en seed ci-dessus).
Lorsque ce dernier est péché, par un des pécheur de la ville, il va dans son inventaire directement et est retiré du tableau de possibilité comme prévu. A la place, il doit être remplacé par "3 minerai, 3 de bois et 3 vivres".

# Compétences

Il faut ajouter un système de compétences.
Une compétence est définie par un nom, elle peut avoir une description.
Une liste de compétences exisants est disponible en base de données, avec un fonctionnement similaire aux ResourcesType.

Dans /profil, il faut afficher les compétences du personnage.

Dans /character-admin, les admins doivent avoir un nouveau bouton permettant de donner ou de retirer une (ou plusieurs) compétence à un personnage.

Un personnage ne peut pas avoir plusieurs fois la même compétence.

Dans /new-element-admin, il faut ajouter un bouton permettant de créer une nouvelle compétence.

### Voici une liste de compétences à mettre en seed:

Combat distance
Cultiver
Vision nocturne
Plongée
Noeuds
Réparer
Porter
Réconforter
Déplacement rapide
Herboristerie
Assommer
Vision lointaine
Camouflage

# Update objets

## Objet compétence

Certains objets donnent une compétence lorsqu'ils sont dans notre inventaire.
Tout les objets n'ont pas de compétence.
lorsque l'objet est perdu (ou donné), la compétence est perdue (le character a cette compétence via l'objet, il ne l'apprend pas directement dans sa table de compétences).
dans / profil il doit y avoir une catégorie pour les compétences objets.

### Voici une liste d'objets compétence à mettre en seed:

Objet -> Compétence
Arc -> Combat distance
Graines ->Cultiver
Lanterne ->Vision nocturne
Matériel de plongée ->Plonger
Corde ->Noeuds
Marteau ->Réparer
Harnais ->Porter
Marmite ->Réconforter
Bottes ->Déplacement rapide
Fioles ->Herboristerie
Grimoire vierge ->Assommer
Longue-vue ->Vision lointaine
Maquillage ->Camouflage

## Objet capacité +

Certains objets donnent une "**capacité** +" lorsqu'ils sont dans notre inventaire.
Lorsque l'objet est perdu (ou donné), "**capacité** +" est perdue (le character a cette" **capacité** +" via l'objet).
dans / profil il doit y avoir une catégorie pour les "**capacité** +" auxquelles a accès le personnage via ses objets.
une "**capacité** +" relie un objet à une capacité.
lorsqu'un character utilise une capacité et qu'il a un objet avec cette même capacité en "**capacité** +", alors le tirage du résultat de sa capacité est "lucky". Deux tirages sont fait et le plus élevé des deux est conservé comme résultat.

Pour l'instant cela fonctionne pour :
"Chasser+", "Cueillir+", "Miner+", "Pêcher+", "Cuisiner+"

Pour "Soigner+":
lors de l'utilisation de soigner, il y a 20% de chances de soigner gratuitement un second PV (sans dépasser les points de vie maximum de la cible).

Pour "Divertir+":
pour chaque point mis (sur les 5 nécessaires à un concert), il y a 5% supplémentaires de chance que le concert se déclenche tout seul instantanément et le compteur repasse à 0.

Pour
1 PA investi au total -> 5% de chances que le concert (normalement à 5PA) se produise instantanément
2 PA investi au total -> 10% de chances que le concert (normalement à 5PA) se produise instantanément
3 PA investi au total -> 15% de chances que le concert (normalement à 5PA) se produise instantanément
4 PA investi au total -> 20% de chances que le concert (normalement à 5PA) se produise instantanément

Pour certaines capacités, les administrateurs s'occuperons d'interpréter les capacité +, il n'y a pas de code spécifique derrière :
"Tisser+", "Forger+", "Menuiser+", "Cartographier+", "Rechercher+", "Auspice+",

### Voici une liste d'objets capacité+ à mettre en seed:

Couteau de chasse -> Chasser+
Serpe -> Cueillir+
Pioche -> Miner+
Nasse -> Pêcher+

Quenouille -> Tisser+
Enclume -> Forger+
Mètre -> Menuiser+

Sel -> Cuisiner+

Bandages -> Soigner+

Compas -> Cartographier+
Loupe -> Rechercher+
Anémomètre -> Auspice+

instrument -> Divertir+

## Objet sac de ressources

Certains objets fonctionnent comme un sac de resource. lorsqu'ils sont attribué à un character, ils sont instantanément consommés (et retiré de leur inventaire) pour donner un certain montant de ressources.
Si le character n'est pas dans une expédition DEPARTED, alors les resources vont dans le stock de la ville.
Si le character est dans une expédition DEPARTED, alors les resources vont dans le stock de l'expédition.

### Voici une liste d'objets sac de ressources à mettre en seed:

Sac de Tissu -> 10 tissu
ferraille -> 10 minerai
Planches -> 20 bois
Jambon -> 10 nourriture


1- Bug dans le seed des skills et dans le seed des objets skills
2- Projets dans une commande ? devraient être dans un bouton pour les personnes concernées !
3 - ✅ RÉSOLU : Catégorie "science" pour ressources = ressources produites par capacités SCIENCE (ex: Cataplasme)
4 - ✅ RÉSOLU : Formulaire nouvel objet amélioré - propose maintenant d'ajouter bonus après création de base
5 - ✅ RÉSOLU : Bouton "Nouvelle Compétence" ajouté dans /new-element-admin
6 - ✅ RÉSOLU : Commande Character admin - Boutons ajouter/retirer objet et compétence

**Nouvelles fonctionnalités ajoutées :**
- ✅ Bouton "Nouvelle Compétence (Skill)" dans /new-element-admin
- ✅ Modal de création de compétence (nom + description)
- ✅ Endpoint backend POST /api/skills pour créer des compétences
- ✅ Service API bot pour les skills (SkillAPIService)
- ✅ Formulaire objet maintenant affiche des boutons après création pour ajouter :
  - Bonus de compétence (ObjectSkillBonus)
  - Bonus de capacité (ObjectCapacityBonus)
  - Conversion en ressource (ObjectResourceConversion)

**Handlers d'ajout de bonus sur objets - TERMINÉ :**
- ✅ Implémentation des handlers pour les boutons d'ajout de bonus sur objets
  - `object_add_skill_bonus:${objectId}` - Ajoute un bonus de compétence à un objet
  - `object_add_capability_bonus:${objectId}` - Ajoute un bonus de capacité à un objet
  - `object_add_resource_conversion:${objectId}` - Ajoute une conversion en ressource à un objet
  - `object_done:${objectId}` - Termine la configuration d'un objet
- ✅ Modals pour saisir les informations de bonus
- ✅ Enregistrement dans button-handler.ts et modal-handler.ts
- ✅ Méthodes API ajoutées dans ObjectAPIService

**Gestion des objets et compétences dans Character Admin - TERMINÉ :**
- ✅ Boutons "Gérer Objets" et "Gérer Compétences" ajoutés dans /character-admin
- ✅ Handlers pour afficher les objets/compétences d'un personnage
- ✅ Boutons pour ajouter/retirer des objets à un personnage
- ✅ Boutons pour ajouter/retirer des compétences à un personnage
- ✅ Menus de sélection pour choisir les objets/compétences
- ✅ Fichiers créés :
  - `character-objects.ts` - Gestion des objets
  - `character-skills.ts` - Gestion des compétences
- ✅ Intégration dans character-admin.handlers.ts
- ✅ Enregistrement dans button-handler.ts

6 - projets admin, manque des champs (resource blueprint?, corps d'artisanat requis ?)

------------------------------CRON JOB------------------- -------------

> Append Directions devrait faire partie de Daily PA Update (à la suite directement). Daily PA 
Update Expédition devrait également être dans la même suite de process. 
Dans Daily PA Update - Expédition, il y a "Give +2 PA first (daily regeneration)", cela ne 
devrait pas exister, c'est clairement un doublon de logique avec "STEP 5: Regenerate PA (hunger 
penalty if hungerLevel≤1)" 

If no + catastrophic conditions → Remove from expedition
       (catastrophic = hungerLevel≤1 OR isDead OR hp≤1 OR pm≤2)

       
Morning, première étape retour d'expédition ? (departed -> returned)

Pourquoi toutes les 10 minutes sur les autres ? 


## 🐛 Known Issues & TODOs

### TODO Items

1. **Daily Messages Integration:**
   - Implement Discord webhook/API call
   - Currently only logs to console

2. **Season Change Notifications:**
   - Add Discord notification when season changes
   - Currently only logs to console


Nous avons actuellement avec config-channel-admin, la possibilité de choisir un channel pour les notifications d'évènement.
Serait-il possible d'ajouter à cette commande la sélection d'un nouveau channel (ce peut être le même channel ou un autre) pour le message quotidien (+changement de saison ?) ?
