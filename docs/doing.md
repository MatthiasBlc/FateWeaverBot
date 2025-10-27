docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-midnight.ts

docker compose exec -T backenddev npx ts-node /app/src/scripts/debug-pa-regen.ts

---

Durée de mise en cache pur création expédition

Boutons Vote / annule retour d'urgence

retour d'urgence -> perte entre 0 et moitié (arrondi supérieur) de chaque statck de ressources


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

(idée retour d'urgence = perdre les ressources ?)

Avatar user ? (dans la db ?)

---

Date de RETURNED at devrait être minuit tout le temps du jour calculé d'arrivé.

RETURNED -> est-ce que les ressources vont bien dans le stock

DEPARTED bouton voter retour d'urgence

DEPARTED a accès aux chantiers

Une expédition créer le 25 à 23h00 d'une durée de 2 jours doit arriver le 28 à 8h00
tout comme Une expédition créer le 25 à 05h00 d'une durée de 2 jours doit arriver le 28 à 8h00

PLANNING, destination non enregistée en base

DEPARTED n'a pas de bouton pour donner la direction

Quel est le comportement d'une expédition DEPARTED sans membres ? ne revient jamais ?



------

docker compose exec -T backenddev npx ts-node /app/src/scripts/simulate-midnight.ts

docker compose exec -T backenddev npx ts-node /app/src/scripts/debug-pa-regen.ts




--------------------


DEPARTED -> que peuvent faire les admins ? 

DEPARTED -> retour en catastrophe
  - agonie
  - déprime
  - affamé
  - dépression
  - mort ?

logs en expédition sauf première phase, doit toujours être caché sauf si un channel discord a été attributé à l'expédition. Les admin attribuent les channels dans /expedition-admin.

(idée retour d'urgence = perdre les ressources ?)


Date de RETURNED at devrait être minuit tout le temps du jour calculé d'arrivé.
------------------

RETURNED -> est-ce que les ressources vont bien dans le stock

DEPARTED bouton voter retour d'urgence

DEPARTED a accès aux chantiers

Une expédition créer le 25 à 23h00 d'une durée de 2 jours doit arriver le 28 à 8h00
tout comme Une expédition créer le 25 à 05h00 d'une durée de 2 jours doit arriver le 28 à 8h00

PLANNING, destination non enregistée en base

DEPARTED n'a pas de bouton pour donner la direction
