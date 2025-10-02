# 🚀 Changelog - Système de Déploiement Intelligent

## 📅 Date : 2025-09-30

### ✨ Nouvelles fonctionnalités

#### 1. Déploiement Intelligent des Commandes Discord

Le système de déploiement a été complètement refondu pour éviter le rate limiting de l'API Discord.

**Avant :**
- ❌ Suppression de TOUTES les commandes à chaque déploiement
- ❌ Re-création de TOUTES les commandes
- ❌ Rate limiting fréquent en développement (limite atteinte rapidement)
- ❌ Temps de déploiement long

**Après :**
- ✅ Comparaison intelligente des commandes locales vs déployées
- ✅ Déploiement uniquement des commandes nouvelles/modifiées
- ✅ Suppression uniquement des commandes obsolètes
- ✅ Économie massive de requêtes API
- ✅ Plus de rate limiting en développement
- ✅ Déploiement quasi-instantané si aucun changement

#### 2. Gestion des Modes de Déploiement

Le système respecte maintenant la variable `DISCORD_GUILD_ID` :

**Mode Guilde (DISCORD_GUILD_ID défini) :**
- Déploiement uniquement sur la guilde spécifiée
- Mise à jour instantanée
- Idéal pour le développement

**Mode Global (DISCORD_GUILD_ID vide) :**
- Déploiement sur tous les serveurs
- Propagation jusqu'à 1 heure
- Utilisé en production

#### 3. Permissions des Commandes Admin

Toutes les commandes admin utilisent maintenant :
```typescript
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
```

**Résultat :**
- Les commandes admin ne sont visibles que pour les administrateurs
- Elles ne sont utilisables que par les administrateurs et owners du serveur
- Séparation claire entre commandes admin et utilisateur

### 📁 Fichiers Modifiés

#### `bot/src/deploy-commands.ts`
- ✅ Ajout de la fonction `areCommandsEqual()` pour comparer les commandes
- ✅ Récupération des commandes déjà déployées sur Discord
- ✅ Détection des commandes à créer, mettre à jour et supprimer
- ✅ Déploiement sélectif avec logs détaillés
- ✅ Affichage d'un résumé des changements

#### `bot/src/list-commands.ts`
- ✅ Amélioration de l'affichage avec les permissions
- ✅ Ajout d'un résumé du mode de déploiement
- ✅ Meilleure présentation des informations

#### `bot/package.json`
- ✅ Ajout du script `deploy` (alias de `deploy-commands`)
- ✅ Ajout du script `list-commands`
- ✅ Ajout du script `deploy:force` pour déploiement forcé

### 📄 Nouveaux Fichiers

#### `bot/src/deploy-commands-force.ts`
Script de déploiement forcé pour les cas d'urgence :
- Supprime TOUTES les commandes
- Redéploie TOUTES les commandes
- À utiliser uniquement en cas de problème

#### `bot/DEPLOY-COMMANDS.md`
Documentation complète du système de déploiement :
- Vue d'ensemble des fonctionnalités
- Guide d'utilisation détaillé
- Exemples de création de commandes
- Bonnes pratiques
- Dépannage

#### `bot/README.md` (mis à jour)
- ✅ Section dédiée au déploiement des commandes
- ✅ Documentation des modes de déploiement
- ✅ Liens vers la documentation complète

### 🎯 Commandes Disponibles

```bash
# Déploiement intelligent (recommandé)
npm run deploy
docker compose exec discord-botdev npx tsx src/deploy-commands.ts

# Lister les commandes déployées
npm run list-commands
docker compose exec discord-botdev npx tsx src/list-commands.ts

# Déploiement forcé (urgence uniquement)
npm run deploy:force
docker compose exec discord-botdev npx tsx src/deploy-commands-force.ts
```

### 📊 Exemple de Sortie

```
--- Démarrage du déploiement des commandes ---
Mode: Guilde (123456789)

🔍 Chargement des fichiers de commandes locales...
✅ 8 commandes locales chargées.

📥 Récupération des commandes déjà déployées sur Discord...
   -> 7 commandes actuellement déployées.

   ➕ Nouvelle commande détectée: nouvelle-commande
   🔄 Commande modifiée détectée: commande-modifiee
   ✓ Commande inchangée: ping
   ✓ Commande inchangée: admin-help
   ✓ Commande inchangée: character-admin
   ✓ Commande inchangée: chantiers-admin
   ✓ Commande inchangée: foodstock-admin
   ✓ Commande inchangée: foodstock
   ✓ Commande inchangée: manger

📊 Résumé des changements:
   - Commandes à créer: 1
   - Commandes à mettre à jour: 1
   - Commandes à supprimer: 0
   - Commandes inchangées: 6

🚀 Application des 2 changements...
   ✅ Commande créée: nouvelle-commande
   ✅ Commande mise à jour: commande-modifiee

--- ✅ Déploiement terminé avec succès ---
💡 Requêtes API économisées grâce au déploiement intelligent!
```

### 🔍 Détection des Changements

Le système compare automatiquement :
- ✅ Le nom de la commande
- ✅ La description
- ✅ Les options (paramètres, sous-commandes)
- ✅ Les permissions par défaut

### 💡 Impact sur le Développement

**Avant :**
- Déploiement = 2 requêtes API (DELETE all + PUT all)
- 5-10 déploiements par jour = 10-20 requêtes
- Rate limit atteint rapidement

**Après :**
- Déploiement sans changement = 1 requête API (GET)
- Déploiement avec 1 changement = 2 requêtes API (GET + POST/PATCH)
- Économie de ~90% des requêtes API

### 🎉 Résultat

Vous pouvez maintenant développer et tester vos commandes Discord sans crainte du rate limiting ! Le système s'occupe automatiquement de ne déployer que ce qui est nécessaire.

### 📚 Documentation

Pour plus de détails, consultez :
- [`bot/DEPLOY-COMMANDS.md`](./bot/DEPLOY-COMMANDS.md) - Documentation complète
- [`bot/README.md`](./bot/README.md) - Guide de démarrage rapide
