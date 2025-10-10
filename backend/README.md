# Backend API - FateWeaver

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)

**FateWeaver Backend** est l'API REST qui gère toute la logique métier du jeu de rôle Discord FateWeaver. Il fournit des endpoints pour la gestion des personnages, chantiers, nourriture et autres mécaniques de jeu.

## 🌟 Fonctionnalités principales

### 🏗️ **Gestion des chantiers**

- **CRUD complet** pour les chantiers communautaires
- **Système d'investissement** avec suivi des contributions individuelles
- **États de progression** : Planifié → En cours → Terminé
- **Gestion automatique** de la complétion avec récompenses

### 🎭 **Gestion des personnages**

- **Cycle de vie complet** : création → activité → mort → reroll
- **Système de points d'action** régénérables quotidiennement
- **Gestion de la faim** avec niveaux progressifs
- **États multiples** : actif/inactif, vivant/mort

### 🍖 **Système économique**

- **Stock communautaire** de vivres géré par ville
- **Consommation automatique** lors des repas
- **Gestion des pénuries** et alertes
- **Ressources limitées** créant de la stratégie

### 🏘️ **Gestion des villes et guildes**

- **Association Discord** guilde ↔ ville dans le jeu
- **Hiérarchie** des permissions et rôles
- **Logs automatiques** des événements importants
- **Configuration serveur** personnalisable

## 🏗️ Architecture technique

### **Structure du projet**

```
src/
├── controllers/           # Gestionnaires de requêtes HTTP
│   ├── chantier.ts       # Logique des chantiers
│   ├── characters.ts     # Gestion des personnages
│   ├── guilds.ts         # Gestion des guildes Discord
│   ├── roles.ts          # Système de permissions
│   ├── towns.ts          # Gestion des villes
│   └── users.ts          # Gestion des utilisateurs
├── routes/               # Définition des routes API
│   ├── chantier.ts       # Routes /chantier/*
│   ├── characters.ts     # Routes /characters/*
│   ├── guilds.ts         # Routes /guilds/*
│   ├── roles.ts          # Routes /roles/*
│   ├── towns.ts          # Routes /towns/*
│   └── users.ts          # Routes /users/*
├── services/             # Services métier
│   ├── api.ts           # Service API (communication externe)
│   └── logger.ts        # Système de logging
├── middleware/           # Middlewares Express
├── cron/                # Tâches planifiées
├── types/               # Types TypeScript
└── util/                # Utilitaires
```

### **Base de données (Prisma ORM)**

```prisma
// Schéma principal (extrait)
model Character {
  id          String   @id @default(cuid())
  name        String
  paTotal     Int      @default(4)
  hungerLevel Int      @default(0)
  isActive    Boolean  @default(false)
  isDead      Boolean  @default(false)
  canReroll   Boolean  @default(true)
  userId      String
  townId      String
  // ... relations et timestamps
}

model Chantier {
  id        String   @id @default(cuid())
  name      String
  cost      Int      // PA totaux nécessaires
  spendOnIt Int      @default(0) // PA déjà investis
  status    ChantierStatus @default(PLAN)
  townId    String
  createdBy String
  // ... métadonnées
}
```

## 📡 API Endpoints

### **🏗️ Chantiers**

- `GET /chantier/server/:guildId` - Liste des chantiers d'un serveur
- `POST /chantier` - Créer un nouveau chantier (admin)
- `POST /chantier/:id/invest` - Investir des PA dans un chantier
- `DELETE /chantier/:id` - Supprimer un chantier (admin)

### **🎭 Personnages**

- `GET /characters/town/:townId` - Liste des personnages d'une ville
- `GET /characters/user/:userId/town/:townId` - Personnage d'un utilisateur
- `POST /characters` - Créer un personnage
- `PATCH /characters/:id/stats` - Modifier les statistiques
- `DELETE /characters/:id` - Tuer un personnage

### **🏘️ Villes et Guildes**

- `GET /towns/guild/:guildId` - Ville associée à une guilde Discord
- `GET /guilds/discord/:guildId` - Informations de guilde
- `POST /guilds/log-channel` - Configurer le channel de logs

### **👥 Utilisateurs**

- `GET /users/:id` - Informations utilisateur
- `POST /users` - Créer un utilisateur Discord

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** 18+
- **PostgreSQL** 13+
- **Prisma CLI** installé globalement

### Installation et configuration

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Configuration de la base de données**

   ```bash
   # Générer le client Prisma
   npx prisma generate

   # Appliquer les migrations
   npx prisma db push
   ```

3. **Variables d'environnement** (`.env`)

   ```env
   # Base de données
   DATABASE_URL=postgresql://user:pass@localhost:5432/fateweaver

   # Serveur
   PORT=3000
   NODE_ENV=development

   # Sécurité
   SESSION_SECRET=votre_secret_session_ici

   # CORS
   CORS_ORIGIN=http://localhost:8080
   ```

4. **Démarrage**

   ```bash
   # Développement avec hot reload
   npm run dev

   # Production
   npm run build && npm start
   ```

## 🔧 Développement

### **Modèle de données**

Le backend utilise **Prisma ORM** avec PostgreSQL :

```prisma
// Exemple de modèle Chantier
model Chantier {
  id          String   @id @default(cuid())
  name        String
  cost        Int      // PA nécessaires pour terminer
  spendOnIt   Int      @default(0) // PA déjà investis
  status      ChantierStatus @default(PLAN)
  townId      String
  createdBy   String
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  town Town @relation(fields: [townId], references: [id])
  creator User @relation(fields: [createdBy], references: [id])

  @@map("chantiers")
}
```

### **Gestion des erreurs**

Le backend implémente une gestion d'erreur centralisée :

```typescript
// Middleware de gestion d'erreur global
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", {
    error: error.message,
    stack: error.stack,
  });

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});
```

### **Validation des données**

Toutes les entrées sont validées avec des schémas :

```typescript
import { z } from "zod";

const InvestInChantierSchema = z.object({
  characterId: z.string().min(1),
  chantierId: z.string().min(1),
  points: z.number().int().positive(),
});
```

## 🕐 Tâches planifiées (Cron Jobs)

Le backend exécute des tâches automatiques :

### **Régénération des PA quotidiens**

- **Fréquence** : Quotidienne (minuit)
- **Action** : Remet à zéro les PA de tous les personnages
- **Logique** : `cron/daily-pa-regeneration.ts`

### **Gestion de la faim**

- **Fréquence** : Continue (vérification périodique)
- **Action** : Augmente la faim des personnages inactifs
- **Logique** : Intégrée dans les contrôleurs

## 🔒 Sécurité et authentification

### **Validation des tokens Discord**

```typescript
// Middleware de validation
const validateDiscordToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !verifyDiscordToken(token)) {
    return res.status(401).json({ error: "Invalid Discord token" });
  }

  next();
};
```

### **Gestion des permissions**

- **Rôles Discord** vérifiés pour les actions administratives
- **Permissions granulaires** par endpoint
- **Logs de sécurité** pour les actions sensibles

## 📊 Monitoring et observabilité

### **Logs structurés**

```typescript
// Exemple de log structuré
logger.info("Chantier terminé", {
  chantierId: chantier.id,
  chantierName: chantier.name,
  completedBy: character.name,
  guildId: req.guildId,
  timestamp: new Date().toISOString(),
});
```

### **Métriques**

- **Requêtes par endpoint**
- **Temps de réponse**
- **Taux d'erreur**
- **Utilisation des ressources**

## 🧪 Tests

### **Tests unitaires**

```bash
npm run test          # Tous les tests
npm run test:watch    # Mode watch
npm run test:coverage # Couverture de code
```

### **Tests d'intégration**

- **Tests des contrôleurs** avec mocks
- **Tests des services** métier
- **Tests d'API** avec Supertest

## 🚢 Déploiement

### **Production**

```bash
# Build optimisé
npm run build

# Démarrage avec PM2
pm2 start dist/server.js --name fateweaver-backend

# Ou avec Docker
docker build -t fateweaver-backend .
docker run -p 3000:3000 fateweaver-backend
```

### **Variables d'environnement (production)**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@prod-db:5432/fateweaver
SESSION_SECRET=super_secret_production_key
CORS_ORIGIN=https://yourdomain.com

# Logs
LOG_LEVEL=warn
```

## 🤝 Contribution

### **Standards de développement**

- **TypeScript strict** partout
- **Tests obligatoires** pour les nouvelles fonctionnalités
- **Documentation** des APIs
- **Code review** obligatoire

### **Processus**

1. Créer une branche feature
2. Implémenter avec tests
3. Mettre à jour la documentation
4. Code review et validation
5. Merge après approval

---

**Backend API pour FateWeaver Bot**  
**Développé avec ❤️ par [MatthiasBlc](https://github.com/MatthiasBlc)**
