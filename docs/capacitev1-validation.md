# 🧪 **PROTOCOLE DE TESTS - SYSTÈME DE CAPACITÉS V1**

## 📋 **Liste complète des tests à effectuer**

### 🎯 **Tests des Capacités Individuelles (Priorité HIGH)**

#### **Test 1 : Capacité Chasse - Été**
**Préconditions :** Saison été active, personnage avec PA > 0, faim < 4

**Étapes :**
1. Utiliser `/use-capacity` et sélectionner "Chasse"
2. Vérifier le coût en PA (devrait être déduit)
3. Observer le résultat (succès/échec selon conditions)
4. Vérifier les logs publics dans le canal

**Résultats attendus :**
- ✅ Succès : Message "Vous avez chassé avec succès" + loot
- ❌ Échec : "La chasse n'a rien donné cette fois"
- ✅ PA correctement déduits
- ✅ Logs publics visibles

---

#### **Test 2 : Capacité Chasse - Hiver**
**Préconditions :** Saison hiver active, personnage avec PA > 0, faim < 4

**Étapes :**
1. Changer la saison en hiver avec `/season-admin set winter`
2. Utiliser `/use-capacity` et sélectionner "Chasse"
3. Vérifier le comportement différent de l'été

**Résultats attendus :**
- ✅ Comportement différent selon la saison
- ✅ PA correctement déduits
- ✅ Logs adaptés à la saison

---

#### **Test 3 : Capacité Cueillette - Été**
**Préconditions :** Saison été active, personnage avec PA > 0

**Étapes :**
1. Utiliser `/use-capacity` et sélectionner "Cueillette"
2. Vérifier le coût en PA et le résultat

**Résultats attendus :**
- ✅ Cueillette fonctionnelle en été
- ✅ PA déduits correctement
- ✅ Résultats cohérents avec la saison

---

#### **Test 4 : Capacité Cueillette - Hiver**
**Préconditions :** Saison hiver active, personnage avec PA > 0

**Étapes :**
1. Saison hiver active
2. Utiliser `/use-capacity` et sélectionner "Cueillette"

**Résultats attendus :**
- ✅ Comportement différent selon la saison
- ✅ Gestion appropriée des conditions hivernales

---

#### **Test 5 : Capacité Pêche (Lucky Roll)**
**Préconditions :** Saison été ou hiver, personnage avec PA > 0

**Étapes :**
1. Utiliser `/use-capacity` et sélectionner "Pêche"
2. Observer le système de lucky roll
3. Tester plusieurs fois pour voir la variance

**Résultats attendus :**
- ✅ Système de lucky roll fonctionnel
- ✅ Différents niveaux de succès possibles
- ✅ Animation ou indication du lucky roll

---

#### **Test 6 : Capacité Divertir (Compteur PM)**
**Préconditions :** Personnage avec PA > 0, capacité Divertir connue

**Étapes :**
1. Utiliser `/use-capacity` et sélectionner "Divertir"
2. Vérifier l'augmentation des PM
3. Tester l'accumulation du compteur
4. Vérifier le bonus après plusieurs utilisations

**Résultats attendus :**
- ✅ PM augmentés correctement
- ✅ Système de compteur fonctionnel
- ✅ Bonus PM après seuil atteint

---

### 🔧 **Tests de Système (Priorité HIGH)**

#### **Test 7 : Gestion des Points d'Action**
**Préconditions :** Personnage avec différents niveaux de PA

**Étapes :**
1. Tester avec PA = 4 (maximum)
2. Tester avec PA = 1 (minimum)
3. Tester avec PA = 0 (impossible)
4. Vérifier la déduction après utilisation

**Résultats attendus :**
- ✅ Refus d'utilisation si PA insuffisants
- ✅ Déduction correcte après utilisation réussie
- ✅ Messages d'erreur appropriés

---

#### **Test 8 : Mise à jour des Stocks**
**Préconditions :** Système de capacités fonctionnel

**Étapes :**
1. Vérifier l'état initial des stocks
2. Utiliser une capacité qui affecte les stocks
3. Vérifier la mise à jour des stocks
4. Tester la persistance après redémarrage

**Résultats attendus :**
- ✅ Stocks mis à jour correctement
- ✅ Persistance des modifications
- ✅ Cohérence des données

---

### 📢 **Tests d'Interface (Priorité MEDIUM)**

#### **Test 9 : Logs Publics**
**Préconditions :** Capacités utilisées avec succès

**Étapes :**
1. Utiliser une capacité avec résultat positif
2. Vérifier l'apparition du message public
3. Tester différents types de résultats
4. Vérifier la fréquence et le format

**Résultats attendus :**
- ✅ Messages publics apparaissent dans le canal
- ✅ Format cohérent et informatif
- ✅ Pas de spam excessif

---

#### **Test 10 : Boutons d'Action Rapide**
**Préconditions :** Profil utilisateur avec capacités

**Étapes :**
1. Afficher le profil avec `/profil`
2. Cliquer sur les boutons de capacités
3. Vérifier l'exécution de la capacité
4. Tester avec différents niveaux de PA

**Résultats attendus :**
- ✅ Boutons fonctionnels et réactifs
- ✅ Même comportement que `/use-capacity`
- ✅ Gestion correcte des PA insuffisants

---

### ⏰ **Tests Automatisés (Priorité MEDIUM)**

#### **Test 11 : Changement Automatique de Saison**
**Préconditions :** Cron configuré et actif

**Étapes :**
1. Vérifier la saison actuelle
2. Attendre ou simuler le changement automatique
3. Vérifier le changement effectif
4. Tester les notifications associées

**Résultats attendus :**
- ✅ Changement automatique selon l'horaire
- ✅ Notification appropriée aux utilisateurs
- ✅ Mise à jour correcte de la saison

---

### 🛡️ **Tests de Robustesse (Priorité MEDIUM)**

#### **Test 12 : Gestion des Erreurs**
**Préconditions :** Système en conditions normales

**Étapes :**
1. Tester avec paramètres invalides
2. Simuler des erreurs de base de données
3. Tester les timeouts réseau
4. Vérifier les erreurs de permissions

**Résultats attendus :**
- ✅ Messages d'erreur informatifs
- ✅ Pas de crash du système
- ✅ Logs d'erreur appropriés
- ✅ Recovery gracieux

---

## 🎯 **Critères de Succès Généraux**

### ✅ **Fonctionnalités Core**
- Toutes les capacités fonctionnent selon leur spécification
- Gestion correcte des PA et des coûts
- Interface utilisateur intuitive et réactive
- Logs et retours appropriés

### ✅ **Sécurité**
- Contrôles de permissions respectés
- Gestion sécurisée des données utilisateur
- Pas de fuite d'informations sensibles

### ✅ **Performance**
- Temps de réponse acceptables (< 2 secondes)
- Pas de dégradation sous charge normale
- Gestion mémoire efficace

### ✅ **Maintenabilité**
- Code lisible et bien structuré
- Gestion d'erreurs complète
- Documentation à jour

---

## 📊 **Checklist de Tests**

### 🎯 **Tests des Capacités Individuelles**

#### **Chasse**
- [ ] Test été : Succès avec conditions optimales
- [ ] Test été : Échec avec conditions défavorables
- [ ] Test hiver : Succès avec conditions optimales
- [ ] Test hiver : Échec avec conditions défavorables

#### **Cueillette**
- [ ] Test été : Succès avec conditions optimales
- [ ] Test été : Échec avec conditions défavorables
- [ ] Test hiver : Succès avec conditions optimales
- [ ] Test hiver : Échec avec conditions défavorables

#### **Pêche**
- [ ] Test lucky roll : Résultat normal
- [ ] Test lucky roll : Résultat exceptionnel
- [ ] Test lucky roll : Échec normal

#### **Divertir**
- [ ] Test première utilisation : +1 PM
- [ ] Test accumulation compteur
- [ ] Test bonus après seuil (3 utilisations)

### 🔧 **Tests de Système**

#### **Gestion des PA**
- [ ] Test PA = 4 : Utilisation normale
- [ ] Test PA = 1 : Utilisation minimum
- [ ] Test PA = 0 : Refus d'utilisation

#### **Interface**
- [ ] Test `/use-capacity` : Menu fonctionnel
- [ ] Test `/profil` : Boutons d'action rapide
- [ ] Test `/season-admin` : Gestion saisons
- [ ] Test `/character-admin` : Gestion capacités

#### **Automatisation**
- [ ] Test changement saison automatique
- [ ] Test cron hebdomadaire

### 📢 **Tests d'Intégration**

#### **Logs et Communication**
- [ ] Test logs publics après succès
- [ ] Test logs privés après échec
- [ ] Test notifications de saison

#### **Persistance**
- [ ] Test sauvegarde des capacités
- [ ] Test sauvegarde des compteurs
- [ ] Test sauvegarde des stocks

---

## 🚀 **Recommandations d'Exécution**

### **Phase 1 : Tests Unitaires (1h)**
1. Tester chaque capacité individuellement
2. Valider les coûts en PA
3. Vérifier les résultats selon les saisons

### **Phase 2 : Tests d'Intégration (45min)**
1. Tester les interactions entre commandes
2. Valider la persistance des données
3. Tester les interfaces utilisateur

### **Phase 3 : Tests de Charge (30min)**
1. Utilisation intensive des capacités
2. Test de concurrence
3. Vérification des performances

### **Phase 4 : Tests de Robustesse (15min)**
1. Scénarios d'erreur
2. Conditions limites
3. Recovery après erreurs

---

## 📝 **Template de Rapport de Test**

Pour chaque test, noter :

```
**Test :** [Nom du test]
**Statut :** ✅ PASS / ❌ FAIL / ⚠️ WARNING
**Préconditions vérifiées :** [O/N]
**Étapes suivies :** [Résumé]
**Résultats observés :** [Description]
**Conformité :** [O/N/Partiel]
**Notes :** [Observations particulières]
```

---

## 🎮 **Bon Testing !**

**Temps estimé total :** 2-3 heures de tests manuels approfondis

Le système est maintenant **100% développé** et prêt pour validation complète ! 🚀
