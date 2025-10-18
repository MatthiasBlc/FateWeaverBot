# 📊 Supernova Reports

Ce dossier contient les rapports générés par **Code Supernova** après l'exécution de tâches déléguées.

## 🎯 Convention de nommage

Les fichiers de rapport suivent la convention :
```
supernova-report-[nom-tache]-[YYYYMMDD].md
```

**Exemples** :
- `supernova-report-phase5-migration-20251010.md`
- `supernova-report-refactor-handlers-20251010.md`

## 📝 Structure des rapports

Chaque rapport contient obligatoirement :

### 1. RÉSUMÉ EXÉCUTIF (≤300 tokens)
Section lue systématiquement par Claude Code pour valider rapidement le succès de la tâche.

### 2. RAPPORT DÉTAILLÉ
Sections détaillées lues seulement si le résumé indique des problèmes ou si investigation nécessaire :
- 📁 Fichiers Modifiés
- 💾 Commits Créés
- ✅ Builds Réussis
- 🔧 Erreurs Résolues
- ⚠️ Problèmes Non Résolus
- 📈 Métriques

## 💡 Workflow

1. **Supernova** crée le rapport automatiquement à la fin de sa tâche
2. **Utilisateur** informe Claude Code : "Terminé"
3. **Claude Code** lit le résumé (300 tokens) → Validation rapide
4. **Si problèmes** → Claude lit les sections pertinentes du rapport détaillé

## 🔒 Versioning

- Les rapports sont versionnés dans Git pour historique et traçabilité
- Ils servent de documentation des migrations et refactorings effectués
- Utiles pour auditer les changements et comprendre l'évolution du projet

---

**Voir aussi** : `.claude/collaboration.md` pour le protocole complet de collaboration avec Supernova
