capacité Soigner : 

@‌backend/src/services/character.service.ts

# Message privé

Cible du soin soi même:
${CAPABILITIES.HEALING} Tu viens de te soigner (+${actualHpAdded} PV${CHARACTER.HP_FULL}).

si non :
Tu as soigné ${target.name} (+${actualHpAdded} PV${CHARACTER.HP_FULL})



# Message log (public)

Cible du soin soi même:
${CAPABILITIES.HEALING} ${character.name} s'est soigné (+${actualHpAdded} PV${CHARACTER.HP_FULL}).

si non:
${CAPABILITIES.HEALING} ${character.name} a soigné ${target.name} (+${actualHpAdded} PV${CHARACTER.HP_FULL}).