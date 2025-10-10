# 🚀 SUPERNOVA - Phase 1: Nettoyage Commandes Discord

## 📋 Mission Supernova

**Objectif** : Supprimer 3 commandes obsolètes et renommer 2 commandes admin
**Fichiers cibles** : 7 fichiers + dossier
**Résultat attendu** : Commandes nettoyées, build réussi, déploiement effectué

---

## ⚠️ RÈGLES CRITIQUES

1. **Commandes** : Toujours utiliser les chemins absolus
   - Working directory: `/home/thorynest/Perso/2-Projects/FateWeaverBot`
   - Bot directory: `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot`
   - Commandes npm: `cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build`

2. **Ordre** : Exécuter les tâches dans l'ordre strict indiqué

3. **Tests** : Tester `npm run build` après CHAQUE modification

4. **Commits** : Commit après chaque groupe de modifications avec messages clairs

---

## 📦 TÂCHES (dans l'ordre)

### ✅ Tâche 1 : Supprimer commande /foodstock

**Fichiers à supprimer** :
- `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/commands/user-commands/foodstock.ts`
- `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/foodstock/` (tout le dossier)

**Commandes** :
```bash
rm /home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/commands/user-commands/foodstock.ts
rm -rf /home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/foodstock/
```

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Remove obsolete /foodstock command

- Delete user command file
- Remove entire foodstock feature directory
- Command replaced by /stock functionality"
```

---

### ✅ Tâche 2 : Supprimer commande /manger

**Fichier à supprimer** :
- `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/commands/user-commands/manger.ts`

**Fichier à nettoyer** :
- `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/hunger/hunger.handlers.ts`
  - Supprimer la fonction `handleEatCommand` (lignes 56-139)
  - Garder `handleEatButton` et `handleEatAlternativeButton` (utilisés par les boutons)

**Commandes** :
```bash
rm /home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/commands/user-commands/manger.ts
```

**Édition manuelle** : `hunger.handlers.ts` - Supprimer lignes 56-139 (fonction `handleEatCommand`)

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Remove obsolete /manger command

- Delete user command file
- Remove handleEatCommand from hunger.handlers
- Keep button handlers (still used in /profil)"
```

---

### ✅ Tâche 3 : Supprimer commande /ping

**Fichier à supprimer** :
- `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/commands/user-commands/ping.ts`

**Commandes** :
```bash
rm /home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/commands/user-commands/ping.ts
```

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Remove obsolete /ping command

- Delete test command file
- No longer needed for bot testing"
```

---

### ✅ Tâche 4 : Renommer /admin-help → /help-admin

**Fichier à renommer** :
- `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/commands/admin-commands/admin-help.ts`
  → `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/commands/admin-commands/help-admin.ts`

**Modification dans le fichier** (ligne 8):
- **Avant** : `.setName("admin-help")`
- **Après** : `.setName("help-admin")`

**Commandes** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/commands/admin-commands
mv admin-help.ts help-admin.ts
```

**Édition manuelle** : Dans `help-admin.ts` ligne 8, changer `"admin-help"` en `"help-admin"`

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Rename /admin-help to /help-admin

- Rename file and update command name
- Follow naming convention: help-admin"
```

---

### ✅ Tâche 5 : Renommer /config-channel → /config-channel-admin

**Fichier à modifier** :
- `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/config/config.command.ts`

**Modification dans le fichier** (ligne 12):
- **Avant** : `.setName("config-channel")`
- **Après** : `.setName("config-channel-admin")`

**Édition manuelle** : Dans `config.command.ts` ligne 12, changer `"config-channel"` en `"config-channel-admin"`

**Tester** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run build
```

**Commit** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Rename /config-channel to /config-channel-admin

- Update command name to follow admin naming convention
- Add -admin suffix for clarity"
```

---

### ✅ Tâche 6 : Déployer les nouvelles commandes

**Commandes** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot && npm run deploy
```

**Attendre** : Que le déploiement se termine (peut prendre 30-60 secondes)

**Commit final** :
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot && git add -A && git commit -m "Deploy command changes to Discord

- Removed: /foodstock, /manger, /ping
- Renamed: /admin-help → /help-admin
- Renamed: /config-channel → /config-channel-admin"
```

---

## 📊 RAPPORT FINAL

À la fin, fournis un rapport avec :

### Métriques
- ✅ Commandes supprimées : 3 (/foodstock, /manger, /ping)
- ✅ Commandes renommées : 2 (/admin-help, /config-channel)
- ✅ Fichiers supprimés : [liste]
- ✅ Fichiers modifiés : [liste]
- ✅ Builds réussis : [nombre]
- ✅ Commits créés : [nombre]
- ✅ Déploiement : [succès/échec]

### Statut
- ✅ Build final : SUCCÈS / ÉCHEC
- ✅ Déploiement : SUCCÈS / ÉCHEC
- ✅ Aucune erreur TypeScript
- ✅ Commandes déployées sur Discord

### Problèmes rencontrés
- [Liste des problèmes éventuels]

### Prochaines étapes
- Tester les commandes sur Discord
- Vérifier que les anciennes commandes ne sont plus visibles
- Vérifier que les nouvelles commandes fonctionnent

---

**Créé le** : 2025-10-08
**Objectif** : Nettoyer les commandes Discord obsolètes
**Économie** : ~2000 tokens vs exécution manuelle
