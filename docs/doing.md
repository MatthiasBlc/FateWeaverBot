docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-midnight.ts
docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-morning.ts

docker compose exec -T backenddev npx ts-node /app/src/scripts/debug-pa-regen.ts

---

✅Durée de mise en cache pur création expédition

✅Boutons Vote / annule retour d'urgence

✅retour d'urgence -> perte entre 0 et moitié (arrondi supérieur) de chaque stack de ressources

✅Restriction des capacités en expédition

Liste moi tout les messages de log public associés à une expédition qui
peuvent apparaitre (y compris manger etc)

<!-- DEPARTED -> retour en catastrophe

- agonie ✅ (/meurt de faim)
- déprime
- affamé X
- dépression
- mort ? -->

-> changement de règle ?
doit payer 2, si pas 2 PA dispo alors rentre en catastophe.
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
