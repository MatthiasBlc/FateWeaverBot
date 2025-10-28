docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-midnight.ts
docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-morning.ts

docker compose exec -T backenddev npx ts-node /app/src/scripts/debug-pa-regen.ts

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

Serait-il possible d'automatiquement créer un channel dédié à l'expédition quand elle passe en Created ?
Faire en sorte que seuls les membre de l'expédition puissent voir le channel.
lorque l'expédition passe en DEPARTED, les membres de l'expédition ne devrait plus avoir accés à certains autres channels du discord (que l'on va appeller les channels de la ville). Les personnes hors de l'expédition (hors admin) ne devrait plus pouvoir voir ce channel en question.
Le but est de simuler une isolation entre les channels roleplay de la ville et les channels roleplay des expéditions.
Lorsque l'expédition est RETURNED, les membres de l'expédition récupèrent à nouveau l'accès aux channels de la ville.

Est-ce possible ? ou pas exactement comme ça ?

---
