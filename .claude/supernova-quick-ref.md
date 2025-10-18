# 🚀 Supernova - Référence Rapide pour Claude

## ⚡ CHECKLIST AUTOMATIQUE

### 🎯 Quand proposer Supernova ?
- [ ] Tâche répétitive sur >3 fichiers ?
- [ ] Code à écrire >100 lignes ?
- [ ] Migration mécanique / refactoring ?
- [ ] Tests systématiques ?

**SI OUI → PROTOCOLE SUPERNOVA AUTOMATIQUE**

---

## 📋 PROTOCOLE (3 phases automatiques)

### Phase 1 : Créer le fichier de prompt détaillé
```bash
Fichier : .supernova/prompt-[nom-tache].md
Contenu : Instructions complètes, chemins absolus, format du rapport
OBLIGATION : Inclure "Crée rapport : .supernova/report-[nom-tache].md avec résumé ≤300 tokens en première section"
```

### Phase 2 : Fournir le mini-prompt (≤50 tokens)
```markdown
## 🚀 PROMPT POUR SUPERNOVA

Copie et colle ceci à Supernova :

```
Lis `.supernova/prompt-[nom-tache].md` et exécute.
Crée rapport : `.supernova/report-[nom-tache].md` avec résumé ≤300 tokens en première section.
```

Dis-moi "Terminé" quand c'est fait ! 🎯
```

### Phase 3 : Validation (après "Terminé")
1. Lire `.supernova/report-[nom-tache].md`
2. Lire UNIQUEMENT la première section (résumé)
3. Si OK → Continuer
4. Si problème → Lire sections pertinentes

---

## ❌ JAMAIS

- ❌ Oublier de proposer Supernova pour tâche >3 fichiers ou >100 lignes
- ❌ Fournir un mini-prompt de >50 tokens
- ❌ Oublier de créer le fichier de prompt AVANT le mini-prompt
- ❌ Oublier de demander un résumé ≤300 tokens dans le rapport
- ❌ Lire le rapport complet si le résumé indique que tout est OK

---

## ✅ TOUJOURS

- ✅ Proposer Supernova pour tâches volumineuses/répétitives
- ✅ Créer `.supernova/prompt-[nom].md` avec toutes les instructions
- ✅ Fournir mini-prompt ≤50 tokens
- ✅ Demander rapport avec résumé ≤300 tokens en première section
- ✅ Attendre "Terminé" de l'utilisateur
- ✅ Lire le résumé d'abord, détails seulement si nécessaire

---

**Phrase clé** : "Économise tes crédits - propose Supernova SYSTÉMATIQUEMENT pour toute tâche >3 fichiers ou >100 lignes"
