# 🐛 BUGS À CORRIGER - Handlers de Modales

**Date de création :** 2025-10-30
**Priorité :** HAUTE
**Impact :** Fonctionnalités admin cassées + gestion ressources expéditions

---

## 📌 Résumé du problème

**Problème racine :** Plusieurs handlers de modales utilisent `registerHandler()` au lieu de `registerHandlerByPrefix()`, ce qui empêche le système de trouver les handlers lorsque les customIds contiennent des paramètres dynamiques.

**Fichier concerné :** `/bot/src/utils/modal-handler.ts`

**Symptômes :**
- Modal se ferme avec message d'erreur "Impossible de valider la modale"
- Log : `No handler found for modal: [nom_du_modal]`
- Utilisateur ne peut pas compléter l'action

---

## ✅ Corrections déjà effectuées

Ces handlers ont déjà été corrigés (ne pas refaire) :

### Expéditions (6 handlers)
| Ligne | Handler | Status |
|-------|---------|--------|
| 149 | `expedition_create_resource_quantity:` | ✅ Corrigé - `registerHandlerByPrefix` |
| 165 | `expedition_resource_add_quantity:` | ✅ Corrigé - `registerHandlerByPrefix` |
| 181 | `expedition_resource_remove_quantity:` | ✅ Corrigé - `registerHandlerByPrefix` |
| 234 | `expedition_duration_modal_` | ✅ Corrigé - `registerHandlerByPrefix` |
| 250 | `expedition_resource_add_modal_` | ✅ Corrigé - `registerHandlerByPrefix` |
| 266 | `expedition_resource_modify_modal_` | ✅ Corrigé - `registerHandlerByPrefix` |

### Stock Admin (2 handlers)
| Ligne | Handler | Status |
|-------|---------|--------|
| 307 | `stock_admin_add_modal_` | ✅ Corrigé - `registerHandlerByPrefix` |
| 331 | `stock_admin_remove_modal_` | ✅ Corrigé - `registerHandlerByPrefix` |

---

## ✅ CORRECTIONS COMPLÉTÉES (2025-11-02)

### 10 handlers corrigés (admin elements + chantiers + obsolètes)

| # | Ligne | Handler | Commande | Action | CustomId réel | Fichier source | Status |
|---|-------|---------|----------|--------|---------------|----------------|--------|
| 1 | 813 | `edit_skill_modal:` | `/new-element-admin` | Modifier → Compétence | `edit_skill_modal:${skillId}` | element-skill-admin.handlers.ts:80 | ✅ Corrigé |
| 2 | 829 | `edit_capability_modal:` | `/new-element-admin` | Modifier → Capacité | `edit_capability_modal:${capabilityId}` | element-capability-admin.handlers.ts:81 | ✅ Corrigé |
| 3 | 845 | `edit_object_name_modal:` | `/new-element-admin` | Modifier → Objet → Nom | `edit_object_name_modal:${objectId}` | element-object-admin.handlers.ts:323 | ✅ Corrigé |
| 4 | 861 | `edit_object_description_modal:` | `/new-element-admin` | Modifier → Objet → Description | `edit_object_description_modal:${objectId}` | element-object-admin.handlers.ts:364 | ✅ Corrigé |
| 5 | 781 | `edit_resource_modal:` | `/new-element-admin` | Modifier → Ressource | `edit_resource_modal:${resourceId}` | element-resource-admin.handlers.ts:81 | ✅ Corrigé |
| 6 | 764 | `object_resource_conversion_modal:` | `/new-element-admin` | Ajouter → Objet → Conversion | `object_resource_conversion_modal:${objectId}:${resourceTypeId}` | new-element-admin.handlers.ts:1169 | ✅ Corrigé |
| 7 | 635 | `project_blueprint_cost_quantity:` | `/projets-admin` | Blueprint → Coût | `project_blueprint_cost_quantity:${resourceTypeId}` | project-creation.ts:767 | ✅ Corrigé |
| 8 | 282 | `invest_modal_` | `/chantiers` | Participer → Investir | `invest_modal_${chantierId}` | chantiers.handlers.ts:369 | ✅ Corrigé |
| 9 | 747 | `object_skill_bonus_modal:` | `/new-element-admin` (obsolète) | Objet → Bonus compétence | `object_skill_bonus_modal:${objectId}:${skillId}` | Non utilisé | ✅ Corrigé (préventif) |
| 10 | 797 | `edit_object_modal:` | Non implémenté (obsolète) | Modifier objet | `edit_object_modal:${objectId}` | Non utilisé | ✅ Corrigé (préventif) |

---

## 🔧 Instructions de correction

### Étape 1 : Ouvrir le fichier
```bash
# Le fichier à modifier
/home/thorynest/perso/FateWeaverBot/bot/src/utils/modal-handler.ts
```

### Étape 2 : Pour chaque handler listé ci-dessus

Trouver la ligne qui contient :
```typescript
this.registerHandler("nom_du_handler:", async (interaction) => {
```

Remplacer par :
```typescript
this.registerHandlerByPrefix("nom_du_handler:", async (interaction) => {
```

### Étape 3 : Exemple de correction

**AVANT (ligne 813) :**
```typescript
this.registerHandler("edit_skill_modal:", async (interaction) => {
  try {
    const { handleEditSkillModalSubmit } = await import(
      "../features/admin/element-skill-admin.handlers.js"
    );
    await handleEditSkillModalSubmit(interaction);
  } catch (error) {
    logger.error("Error handling edit skill modal:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de la modification.",
      flags: ["Ephemeral"],
    });
  }
});
```

**APRÈS :**
```typescript
this.registerHandlerByPrefix("edit_skill_modal:", async (interaction) => {
  try {
    const { handleEditSkillModalSubmit } = await import(
      "../features/admin/element-skill-admin.handlers.js"
    );
    await handleEditSkillModalSubmit(interaction);
  } catch (error) {
    logger.error("Error handling edit skill modal:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de la modification.",
      flags: ["Ephemeral"],
    });
  }
});
```

### Étape 4 : Rebuild et redémarrage

```bash
# Depuis la racine du projet
docker compose restart discord-botdev
```

---

## 🧪 Tests de validation

Après correction, tester chaque fonctionnalité :

### Tests `/new-element-admin`
- [ ] Modifier une compétence existante
- [ ] Modifier une capacité existante
- [ ] Modifier le nom d'un objet
- [ ] Modifier la description d'un objet
- [ ] Modifier une ressource
- [ ] Ajouter une conversion de ressource à un objet

### Tests `/projets-admin`
- [ ] Créer un projet avec blueprint
- [ ] Ajouter un coût de ressource au blueprint

---

## 📊 Impact métrique

- **8 handlers corrigés (expéditions + stock)** - 2025-10-30
- **10 handlers corrigés (admin elements + chantiers + obsolètes)** - 2025-11-02
- **Total : 18 handlers corrigés** - Tous les bugs résolus ✅
- **Vérification complète du codebase** - Aucun autre handler problématique détecté

---

## 🔍 Comment détecter ce bug à l'avenir

### Recherche préventive

Pour trouver tous les handlers potentiellement cassés :

```bash
# Chercher les handlers avec séparateur qui n'utilisent pas ByPrefix
grep -n 'registerHandler("[^"]*[_:]"' bot/src/utils/modal-handler.ts | grep -v "ByPrefix"
```

### Pattern à surveiller

❌ **MAUVAIS :**
```typescript
this.registerHandler("modal_name_with_suffix:", handler)
this.registerHandler("modal_name_with_suffix_", handler)
```

✅ **BON :**
```typescript
this.registerHandlerByPrefix("modal_name_with_suffix:", handler)
this.registerHandlerByPrefix("modal_name_with_suffix_", handler)
```

---

## ✅ Handlers suspects (vérifiés et corrigés)

Ces handlers étaient enregistrés mais aucun modal correspondant n'a été trouvé dans le codebase :
- `object_skill_bonus_modal:` (ligne 747) - **✅ Corrigé par précaution** - Code obsolète/non implémenté
- `edit_object_modal:` (ligne 797) - **✅ Corrigé par précaution** - Code obsolète/non implémenté

Ces handlers ont été corrigés en `registerHandlerByPrefix` pour garantir qu'ils fonctionneront correctement s'ils sont réactivés à l'avenir.

---

## 📝 Notes additionnelles

### Problème bonus détecté : flags Ephemeral

Plus de 400 occurrences de `flags: ["Ephemeral"]` dans le codebase (format invalide pour Discord.js v14).

**Format correct :** `ephemeral: true`

Ce problème a été corrigé uniquement dans :
- `/bot/src/features/admin/expedition-admin-resource-handlers.ts` (lignes 64 et 138)

**TODO futur :** Créer un script pour corriger automatiquement toutes les occurrences.

---

## ✍️ Historique des modifications

| Date | Action | Handlers corrigés |
|------|--------|------------------|
| 2025-10-30 | Correction initiale | 8 handlers (expéditions + stock) |
| 2025-10-30 | Documentation créée | - |
| 2025-11-02 | **Correction admin elements** | 8 handlers (admin elements + chantiers) |
| 2025-11-02 | **Vérification complète codebase** | 2 handlers obsolètes détectés et corrigés |
| 2025-11-02 | **Bug résolu** | ✅ **Tous les 18 handlers corrigés** |

---

## 🎉 STATUT FINAL : TOUS LES BUGS RÉSOLUS

**Date de résolution :** 2025-11-02
**Total de handlers corrigés :** 18 (16 actifs + 2 obsolètes préventifs)
**Tests requis :** Voir section "Tests de validation" ci-dessus
**Vérification :** Scan complet du codebase effectué - aucun autre handler problématique

---

**FIN DU DOCUMENT**
