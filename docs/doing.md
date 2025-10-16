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

Dans /new-element-admin, il faut ajouter un bouton permettant de créer une nouvelle compétence.
