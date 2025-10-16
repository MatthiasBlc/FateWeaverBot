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
Matériel de plongée ->Plongée
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
Compas -> Cartographier+
Bandages -> Soigner+
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
Planches -> 20 planche
Jambon -> 10 nourriture
