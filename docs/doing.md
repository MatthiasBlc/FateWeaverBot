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


