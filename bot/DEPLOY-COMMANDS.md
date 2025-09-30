# 🚀 Système de Déploiement Intelligent des Commandes Discord

## 📋 Vue d'ensemble

Ce système optimise le déploiement des commandes Discord en ne déployant que les commandes **nouvelles** ou **modifiées**, évitant ainsi le rate limiting de l'API Discord.

## ✨ Fonctionnalités

### 1. Déploiement Intelligent
- ✅ **Comparaison automatique** : Compare les commandes locales avec celles déjà déployées
- ✅ **Déploiement sélectif** : Ne déploie que les changements nécessaires
- ✅ **Économie d'API** : Réduit drastiquement le nombre de requêtes API
- ✅ **Logs détaillés** : Affiche clairement ce qui est créé, modifié ou supprimé

### 2. Modes de Déploiement

#### Mode Guilde (Développement)
Lorsque `DISCORD_GUILD_ID` est défini :
- Les commandes sont déployées **uniquement sur la guilde spécifiée**
- Mise à jour **instantanée** (pas de cache global)
- Idéal pour le développement et les tests

#### Mode Global (Production)
Lorsque `DISCORD_GUILD_ID` est vide :
- Les commandes sont déployées **sur tous les serveurs**
- Peut prendre jusqu'à 1 heure pour se propager
- Utilisé en production

### 3. Gestion des Permissions

#### Commandes Admin
Les commandes dans `commands/admin-commands/` utilisent :
```typescript
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
```
- Visibles **uniquement pour les administrateurs** du serveur
- Utilisables **uniquement par les administrateurs et owners**

#### Commandes Utilisateur
Les commandes dans `commands/user-commands/` :
- Visibles et utilisables par **tous les membres** du serveur

## 🛠️ Utilisation

### Déployer les commandes

```bash
# En local
npm run deploy

# Avec Docker
docker compose exec discord-botdev npx tsx src/deploy-commands.ts
```

### Lister les commandes déployées

```bash
# En local
npm run list-commands

# Avec Docker
docker compose exec discord-botdev npx tsx src/list-commands.ts
```

## 📊 Exemple de sortie

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
   ...

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

## 🔧 Configuration

### Variables d'environnement

```env
# Obligatoire
DISCORD_TOKEN=votre_token
DISCORD_CLIENT_ID=votre_client_id

# Optionnel - Mode de déploiement
DISCORD_GUILD_ID=123456789  # Vide = mode global, Rempli = mode guilde
```

## 📝 Créer une nouvelle commande

### Commande Utilisateur

```typescript
// bot/src/commands/user-commands/ma-commande.ts
import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ma-commande")
    .setDescription("Description de ma commande"),

  async execute(interaction) {
    await interaction.reply("Réponse de la commande");
  },
};

export default command;
```

### Commande Admin

```typescript
// bot/src/commands/admin-commands/ma-commande-admin.ts
import { 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  type ChatInputCommandInteraction 
} from "discord.js";
import type { Command } from "../../types/command";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ma-commande-admin")
    .setDescription("Description de ma commande admin")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: "Réponse de la commande admin",
      flags: ["Ephemeral"]
    });
  },
};

export default command;
```

## 🎯 Avantages du nouveau système

### Avant
- ❌ Suppression de **toutes** les commandes à chaque déploiement
- ❌ Re-création de **toutes** les commandes
- ❌ Rate limiting fréquent en développement
- ❌ Temps de déploiement long

### Après
- ✅ Déploiement **uniquement des changements**
- ✅ Économie massive de requêtes API
- ✅ Plus de rate limiting en développement
- ✅ Déploiement quasi-instantané si aucun changement

## 🔍 Détection des changements

Le système compare automatiquement :
- Le **nom** de la commande
- La **description**
- Les **options** (paramètres, sous-commandes)
- Les **permissions par défaut**

Si l'un de ces éléments change, la commande est mise à jour.

## 💡 Bonnes pratiques

1. **Développement** : Toujours utiliser le mode guilde (`DISCORD_GUILD_ID` défini)
2. **Tests** : Vérifier les commandes avec `npm run list-commands` avant de déployer
3. **Production** : Utiliser le mode global (`DISCORD_GUILD_ID` vide)
4. **Permissions** : Toujours utiliser `setDefaultMemberPermissions()` pour les commandes admin

## 🐛 Dépannage

### Les commandes n'apparaissent pas
- Vérifiez que le bot a les permissions `applications.commands` dans le serveur
- En mode global, attendez jusqu'à 1 heure pour la propagation
- En mode guilde, les commandes sont instantanées

### Rate limiting
- Utilisez le mode guilde en développement
- Le nouveau système devrait éliminer ce problème

### Commandes admin visibles par tous
- Vérifiez que `.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)` est présent
- Redéployez les commandes pour appliquer les changements de permissions
