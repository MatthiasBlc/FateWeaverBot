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
