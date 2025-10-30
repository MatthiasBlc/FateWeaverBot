docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-midnight.ts
docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-morning.ts

docker compose exec -T backenddev npx ts-node /app/src/scripts/debug-pa-regen.ts

---

A l'image du message de log public pour @manger, il faut faire la même chose pour tout les messages de log qui peuvent être envoyés par un personnage en expédition DEPARTED pour qu'ils soient bien envoyés dans le channel dédié (configuré par expedition-admin)
(exemple messages de retour d'urgence)

Lorsque le retour d'urgence a son seuil atteint, remet en place le timer dans le résumé d'expédition /expedition (si le character est en DEPARTED) avant le retour qui était en place dans des commits précédents (calcul du timer avant le retour soir 8h00 le lendemain matin)

---

✅Durée de mise en cache pur création expédition

✅Boutons Vote / annule retour d'urgence

✅retour d'urgence -> perte entre 0 et moitié (arrondi supérieur) de chaque stack de ressources

✅Restriction des capacités en expédition

✅Liste moi tout les messages de log public associés à une expédition qui
peuvent apparaitre (y compris manger etc)

<!-- DEPARTED -> retour en catastrophe

- agonie ✅ (/meurt de faim)
- déprime
- affamé X
- dépression
- mort ? -->

✅-> changement de règle de retour en catastrophe :
A la place des différentes vérifications de status, (agonie, déprime, affamé, dépression mort ...), la vérification du retour en catastrophe se fait dans le CRON au moment de retirer les 2PA de l'expédition.
En effet, pour continuer l'expédition, chaque personnage en expédition doit payer les 2 PA en question. Si le personnage n'a pas de quoi payer les 2 PA, alors il paye ce qu'il peut et rentre en catastrophe.
Exemples :

- Si par exemple il ne lui reste qu'un seul et unique PA, il ne peut pas payer les 2PA donc il rentre en catastrophe).
- Si un personnage part en expédition avec 2 PA, chaque soir il en gagne de deux de plus à minuit (gain de PA normal) puis en paye 2 (cout de l'expédition), il reste donc à 2 PA au total. Si un soir le personnage est affamé, il ne regagne qu'un seul PA, au moment de payer les 2 PA il en aura 3 donc il va les payer puis il sera donc à 1 PA restant. Il continue donc l'expédition un jour de plus.
- Si un personnage part en expédition avec 0 PA, chaque soir il en gagne de deux de plus à minuit (gain de PA normal) puis en paye 2 (cout de l'expédition), il reste donc à 0 PA au total. Si un soir le personnage est affamé, il ne regagne qu'un seul PA, au moment de payer les 2 PA, il en aura seulement 1 (récupération de 1 seul PA en affamé). Il ne pourra donc pas payer les 2 PA requis, il passe donc à 0 PA (il paye ce qu'il peut sur les deux PA requis) et rentre en catastrophe.
  ->lorsqu'un character rentre en catastophe, il faut un message public de log avec cette indication au moment du calcul des RETURNED.

-> message + ping admin ?

<!-- logs en expédition sauf première phase, doit toujours être caché sauf si un channel discord a été attributé à l'expédition. Les admin attribuent les channels dans /expedition-admin. -->

Avatar user ? (dans la db ?)

---

ATTENTION A NE PAS MODIFIER LE CONTENU DES MESSAGES ERREUR, PUBLIC, EPHEMERAL sans mon accord ou sans ma demande explicite et ce, à a tout moment.
