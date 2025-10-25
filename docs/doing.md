capacité pêcher : 

@‌backend/src/services/character.service.ts

# Message privé

Si output = vivre
- De retour de la pêche ! Tu as dépensé X PA${CHARACTER.PA} et rapporté X ${RESOURCES.FOOD} 

Si output = 10 vivre
- Une pêche miraculeuse ! Tu as dépensé X PA${CHARACTER.PA} et rapporté 10 ${RESOURCES.FOOD} !

si output = Bois 
- Pas de poisson aujourd’hui, mais des débris se sont pris dans ton filet. Tu as dépensé X PA${CHARACTER.PA} et rapporté X${RESOURCES.WOOD}.

si output = Minerai 
- Pas de poisson aujourd’hui, mais des débris se sont pris dans ton filet. Tu as dépensé X PA${CHARACTER.PA} et rapporté X${RESOURCES.MINERAL}.

si output = Minerai et bois
- Pas de poisson aujourd’hui, mais des débris se sont pris dans ton filet. Tu as dépensé X PA${CHARACTER.PA} et rapporté X${RESOURCES.WOOD} et X${RESOURCES.MINERAL}.


Si output = 0 vivre
- Ce n’est pas une pêche très fructueuse aujourd’hui… Tu as dépensé X PA${CHARACTER.PA} et rapporté 0 ${RESOURCES.FOOD}. 

Si output = Objet Coquillage
- De retour d’une pêche… inattendue ! Tu as dépensé X PA${CHARACTER.PA} et trouvé un énorme coquillage aux reflets nacrés. Il chante la mer, ses vagues et ses colères… 

Message log (public)

Si output = vivre
- Z revient de la pêche avec X${RESOURCES.FOOD}. 

Si output = 10 vivre
- Une pêche miraculeuse ! Z a rapporté 10${RESOURCES.FOOD} !

si output = Bois 
- Des débris se sont pris dans son filet de Z qui revient de la pêche sans poisson mais avec X${RESOURCES.WOOD}.

si output = Minerai 
- Des débris se sont pris dans son filet de Z qui revient de la pêche sans poisson mais avec X${RESOURCES.MINERAL}.

si output = Minerai et bois
- Des débris se sont pris dans son filet de Z qui revient de la pêche sans poisson mais avec X${RESOURCES.WOOD} et X${RESOURCES.MINERAL}.

Si output = 0 vivre
- Z revient de la pêche les mains vides !

Si output = Objet Coquillage
- X revient de la pêche avec un superbe coquillage aux reflets nacrés. Il chante la mer, ses vagues et ses colères… 



