# 🧪 Plan de test exhaustif - /new-element-admin

## 🎯 Arborescence complète des interactions

```
/new-element-admin
├── 📦 Ressources
│   ├── ➕ Ajouter
│   │   ├── Select: Catégorie d'emoji (resource, capability, object, skill, action, custom)
│   │   ├── Select: Choix emoji spécifique
│   │   └── Modal: Nom + Clé + Description
│   ├── ✏️ Modifier (non implémenté - message d'info)
│   └── 🗑️ Supprimer (non implémenté - message d'info)
│
├── 🎒 Objets
│   ├── ➕ Ajouter
│   │   └── Modal: Nom + Description
│   ├── ✏️ Modifier
│   │   ├── Select catégorie: Simple/Capacity/Skill/Resource
│   │   ├── Pagination (si > 25 objets)
│   │   ├── Select: Objet spécifique
│   │   └── Options de modification:
│   │       ├── ✏️ Modifier le nom → Modal
│   │       ├── 📝 Modifier la description → Modal
│   │       ├── 🎯 Gérer les compétences
│   │       │   ├── ➕ Ajouter compétence
│   │       │   │   ├── Select catégorie
│   │       │   │   ├── Select compétence
│   │       │   │   └── Modal: Bonus
│   │       │   └── ➖ Retirer compétence
│   │       │       ├── Select compétence
│   │       │       └── Confirmation
│   │       └── ⚡ Gérer les capacités
│   │           ├── ➕ Ajouter capacité
│   │           │   ├── Select capacité
│   │           │   └── Modal: Bonus
│   │           └── ➖ Retirer capacité
│   │               ├── Select capacité
│   │               └── Confirmation
│   └── 🗑️ Supprimer
│       ├── Select catégorie
│       ├── Select objet
│       └── Confirmation finale
│
├── ⚔️ Compétences
│   ├── ➕ Ajouter
│   │   └── Modal: Nom + Description
│   ├── ✏️ Modifier (non implémenté - message d'info)
│   └── 🗑️ Supprimer (non implémenté - message d'info)
│
├── ✨ Capacités
│   ├── ➕ Ajouter
│   │   └── Modal: Nom + Description + Catégorie + Type cible
│   ├── ✏️ Modifier (non implémenté - message d'info)
│   └── 🗑️ Supprimer (non implémenté - message d'info)
│
└── 🎨 Emojis
    ├── ➕ Ajouter
    │   ├── Select: Type (resource, capability, object, skill, action, custom)
    │   └── Modal: Clé + Emoji + Type
    ├── 📋 Lister
    │   └── Affichage par type
    └── 🗑️ Supprimer
        ├── Select: Type à supprimer
        ├── Select: Emoji spécifique
        └── Confirmation (confirm/cancel)
```

## ✅ Checklist de test

### Phase 1: Navigation de base
- [ ] `/new-element-admin` affiche les 5 catégories
- [ ] Clic sur "📦 Ressources" → affiche Ajouter/Modifier/Supprimer
- [ ] Clic sur "🎒 Objets" → affiche Ajouter/Modifier/Supprimer
- [ ] Clic sur "⚔️ Compétences" → affiche Ajouter/Modifier/Supprimer
- [ ] Clic sur "✨ Capacités" → affiche Ajouter/Modifier/Supprimer
- [ ] Clic sur "🎨 Emojis" → affiche Ajouter/Lister/Supprimer

### Phase 2: Ressources
- [ ] ➕ Ajouter → Select catégorie emoji
- [ ] Select catégorie → Select emoji spécifique
- [ ] Select emoji → Modal avec champs (nom, clé, description)
- [ ] Soumettre modal → Création réussie
- [ ] ✏️ Modifier → Message "non implémenté"
- [ ] 🗑️ Supprimer → Message "non implémenté"

### Phase 3: Objets - Ajout
- [ ] ➕ Ajouter → Modal avec nom + description
- [ ] Soumettre modal → Création réussie
- [ ] Vérifier affichage de l'objet créé

### Phase 4: Objets - Modification
- [ ] ✏️ Modifier → Select catégorie (simple/capacity/skill/resource)
- [ ] Select catégorie → Liste objets (+ pagination si > 25)
- [ ] Pagination suivante (si applicable)
- [ ] Pagination précédente (si applicable)
- [ ] Select objet → 4 boutons d'options

#### Sous-test 4.1: Modifier nom
- [ ] ✏️ Modifier le nom → Modal avec nom actuel
- [ ] Soumettre → Mise à jour réussie

#### Sous-test 4.2: Modifier description
- [ ] 📝 Modifier la description → Modal avec description actuelle
- [ ] Soumettre → Mise à jour réussie

#### Sous-test 4.3: Gérer compétences - Ajouter
- [ ] 🎯 Gérer les compétences → Boutons Ajouter/Retirer
- [ ] ➕ Ajouter → Select catégorie de compétence
- [ ] Select catégorie → Select compétence spécifique
- [ ] Select compétence → Modal bonus
- [ ] Soumettre → Compétence ajoutée

#### Sous-test 4.4: Gérer compétences - Retirer
- [ ] ➖ Retirer → Select compétence à retirer
- [ ] Select compétence → Confirmation
- [ ] Confirmer → Compétence retirée

#### Sous-test 4.5: Gérer capacités - Ajouter
- [ ] ⚡ Gérer les capacités → Boutons Ajouter/Retirer
- [ ] ➕ Ajouter → Select capacité
- [ ] Select capacité → Modal bonus
- [ ] Soumettre → Capacité ajoutée

#### Sous-test 4.6: Gérer capacités - Retirer
- [ ] ➖ Retirer → Select capacité à retirer
- [ ] Select capacité → Confirmation
- [ ] Confirmer → Capacité retirée

### Phase 5: Objets - Suppression
- [ ] 🗑️ Supprimer → Select catégorie
- [ ] Select catégorie → Select objet
- [ ] Select objet → Confirmation finale
- [ ] Confirmer → Objet supprimé
- [ ] Bouton "Annuler" → Annulation

### Phase 6: Compétences
- [ ] ➕ Ajouter → Modal (nom + description)
- [ ] Soumettre → Création réussie
- [ ] ✏️ Modifier → Message "non implémenté"
- [ ] 🗑️ Supprimer → Message "non implémenté"

### Phase 7: Capacités
- [ ] ➕ Ajouter → Modal (nom + description + catégorie + type cible)
- [ ] Soumettre → Création réussie
- [ ] ✏️ Modifier → Message "non implémenté"
- [ ] 🗑️ Supprimer → Message "non implémenté"

### Phase 8: Emojis
#### Sous-test 8.1: Ajouter
- [ ] ➕ Ajouter → Select type
- [ ] Select type → Modal (clé + emoji + type)
- [ ] Soumettre → Emoji ajouté
- [ ] Vérifier cache emoji rafraîchi

#### Sous-test 8.2: Lister
- [ ] 📋 Lister → Affichage groupé par type
- [ ] Vérifier tous les emojis affichés

#### Sous-test 8.3: Supprimer
- [ ] 🗑️ Supprimer → Select type
- [ ] Select type → Select emoji spécifique
- [ ] Select emoji → Boutons Confirmer/Annuler
- [ ] Confirmer → Emoji supprimé + cache rafraîchi
- [ ] Annuler → Annulation

### Phase 9: Gestion d'erreurs
- [ ] Modal avec champs vides → Validation Discord
- [ ] Interaction expirée (> 15min) → Message d'erreur gracieux
- [ ] Suppression d'élément inexistant → Message d'erreur
- [ ] Modification d'élément inexistant → Message d'erreur

## 🎯 Test en cours

**Statut:** 🔄 En attente de tests utilisateur

**Instructions:**
1. Testez chaque élément dans l'ordre
2. Cochez les cases au fur et à mesure
3. Notez toute erreur rencontrée
4. Je surveille les logs en temps réel
