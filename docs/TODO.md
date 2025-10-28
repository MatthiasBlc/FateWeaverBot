------------------------------TRUC A Corriger------------------- -------------

------------------------------CRON JOB------------------- -------------

Comment passer les messages perso meteo

- Seed Messages type dans daily messages

met en place les tests qu'il reste à faire dans backend-refactoring. n'oublie pas que tout est lancé en docker compose, bdd y compris. Quelle solution est la plus optimisée pour tester le backend dans ces conditions ?

------------------------------TRUC A Corriger------------------- -------------

est-ce que la fonction getParisTime set encore à quelquechose ? (/profil)

-------------------------Todo-------------------------

#Objets /compétence métiers :

Chaque métier peut avoir une liste d'objets de départs possibles.
Cette table propose de lier N objets à 1 Métier.
un character qui a le métier en question n'a pas par défaut les objets en question, c'est une table d'objets recommandés.
Voici ce qu'il faut seed pour chaque métiers: (vérifier que les objets en question sont déjà seed avant)

- Chasseuse -> Arc / Couteau de chasse / Appeau
- Cueilleur -> Serpe / Herbier / Graines
- Pêcheur-> Matériel de plongée / Filet / Nasse
- Mineuse -> Pioche / Lanterne / Canari
- Tisserand -> Corde / Tissu / Quenouille
- Forgeronne -> Marteau / Enclume / ferraille
- Menuisier -> Harnais / Mètre / Planches
- Cuisinière-> Marmite / Jambon / Sel
- Guérisseur -> Fioles / Bandages / Somnifère
- Érudit-> Grimoire vierge / Loupe / Bougie
- Cartographe -> Boussole / Bottes / Compas
- Météorologue -> Grenouille / Anémomètre / Longue-vue
- L'Artiste -> Maquillage / Couronne de fleurs / Instrument

# Création de personnage Update.

Une fois le métier choisi, il doit choisir parmi XXXXXX.
Si c'est le personnalisé qui est choisi alors .....

# création objet admin + compétence admin

Implémenter les mssages météo

Update Docs, Update Backend

------------------------------TRUC------------------- -------------

Instinct ?

# Features, debug et tests

##Tests urgents

## Erreur sur la gestion des saisons à vérifier :

gestion des saisons par VILLE et non pas globale !!!!!

##idées en vrac a réfléchir:

- système d'évènements

Gestion des pénuries ?? Alerte etc ?

Système de réapprovisionnement automatique des vivres via des chantiers ??

lors de l'ajout / retrait de ressources dans les stocks par les admins ?

# Contenu / texte

---------------------------------- Optimisations ----------------------------------

-------------------------Idea To work about -------------------------------

-------------------------Done-------------------------

-------------------------Notes-------------------------
