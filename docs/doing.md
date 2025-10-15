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

# évolution pêche


Pour le pécheur dans le tableau de récompenses à 2PA, le dernier champ est "un grigri", le "grigri" est un objet.
Lorsque ce dernier est péché, par un des pécheur de la ville, il va dans son inventaire directement et est retiré du tableau de possibilité comme prévu. A la place, il doit être remplacé par "3 minerai, 3 de bois et 3 vivres".

# Compétences

Il faut ajouter un système de compétences.
Une compétence est définie par un nom, elle peut avoir une description.
Une liste de compétences exisants est disponible en base de données, avec un fonctionnement similaire aux ResourcesType.

Dans /profil, il faut afficher les compétences du personnage.

Dans /character-admin, les admins doivent avoir un nouveau bouton permettant de donner ou de retirer une (ou plusieurs) compétence à un personnage.

Un personnage ne peut pas avoir plusieurs fois la même compétence.

# métier (classe ?)

Il faut ajouter un système de métier.
Un métier est défini par un nom, il peut avoir une une description, une capacité de départ, une capacité optionnelle (vide pour l'instant),blablaba(insérer ici les objets etc à choisir).

Une liste de métiers exisants est disponible en base de données, avec un fonctionnement similaire aux ResourcesType.

Voici la liste des couples métiers / capacités de départ:

-
-
-
-
-

Lorsqu'un métier est attribué à un character, il faut vérifier s'il a sa capacité de départ et, si ce n'est pas le cas la lui donner.

Dans /profil, il faut afficher le métier du personnage à la place de son rôle.

Dans /character-admin, dans le bouton adavanced, il faut ajouter un bouton permettant de changer le métier d'un character. Changer le métier d'un character lui retire également la/les capacité liée à son ancien métier et lui donne celles liée à son nouveau métier (capacité de départ et capacités optionnelles si ce n'est pas vide).

Un personnage ne peut avoir qu'un seul métier.

# Création de personnage.

Lors de la création d'un personnage (premier personnage ou reroll), Ce dernier doit choisir son nom. Dans le message en réponse, il doit choisir son métier dans une liste déroulante.

Une fois le métier choisi, il doit choisir parmi XXXXXX.
Si c'est le personnalisé qui est choisi alors .....

En réponse sa fiche profil s'affiche alors.


# création objet admin + compétence admin

# changer grigri en coquillage