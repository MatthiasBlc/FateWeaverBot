# Rapport Statistique - Capacité CUISINER

## **🔢 FORMULES DE CALCUL OFFICIELLES**

### **📏 Mécaniques strictes (code source) :**

#### **1 PA :**
```
Input: 1-2 vivres
Output: random(0, input × 2) repas
Exemples:
- 1 vivres → 0 à 2 repas
- 2 vivres → 0 à 4 repas
```

#### **2 PA :**
```
Input: 2-5 vivres
Output: random(0, input × 3) repas
Exemples:
- 2 vivres → 0 à 6 repas
- 3 vivres → 0 à 9 repas
- 4 vivres → 0 à 12 repas
- 5 vivres → 0 à 15 repas
```

#### **🎲 Lucky Roll (Bonus) :**
```
2 tirages indépendants
Résultat = max(tirage1, tirage2)
Impact: ~+50% de rendement moyen
```

### **⚠️ Contraintes strictes :**
- **1 PA** : Input limité à 1-2 vivres
- **2 PA** : Input limité à 2-5 vivres
- **Output** : Entier aléatoire entre 0 et (input × multiplicateur)
- **Coût** : PA dépensés même en cas d'échec (0 repas)

---

## **PRINCIPE FONDAMENTAL**

### **🔄 1 REPAS = 1 VIVRE :**
- **10 vivres** = 10 personnes nourries
- **10 repas** = 10 personnes nourries
- **5 vivres + 5 repas** = 10 personnes nourries

**La cuisine ne crée pas de nourriture supplémentaire**, elle **transforme le format**.

### **✅ Avantages des repas (vs vivres) :**
- **Conservation** plus longue
- **Stockage** optimisé
- **Commerce** plus facile
- **Expéditions** plus adaptées
- **Valeur** potentiellement supérieure

### **❌ Coûts de la transformation :**
- **PA** dépensés (1-2)
- **Risque** de perte (7-50%)
- **Temps** et **effort** investis

---

## **2. CALCUL DE LA VALEUR RÉELLE**

### **1 PA - Transformation :**
| **Input** | **Output moyen** | **Gain brut** | **Coût PA** | **Valeur finale** |
|-----------|------------------|---------------|-------------|-------------------|
| 1 vivres | 1.0 repas | **0** | 1 PA | **1.0** (break-even) |
| 2 vivres | 2.0 repas | **0** | 1 PA | **2.0** (break-even) |

### **2 PA - Transformation :**
| **Input** | **Output moyen** | **Gain brut** | **Coût PA** | **Valeur finale** |
|-----------|------------------|---------------|-------------|-------------------|
| 2 vivres | 3.0 repas | **+1** | 2 PA | **3.0** (+50%) |
| 3 vivres | 4.5 repas | **+1.5** | 2 PA | **4.5** (+50%) |
| 4 vivres | 6.0 repas | **+2** | 2 PA | **6.0** (+50%) |
| 5 vivres | 7.5 repas | **+2.5** | 2 PA | **7.5** (+50%) |

---

## **3. AVANTAGES NON-QUANTIFIABLES**

### **🔸 Conservation :**
- **Vivres** : Périssables, durée limitée
- **Repas** : Plus durables, conservation étendue

### **🔸 Logistique :**
- **Vivres** : Stockage basique
- **Repas** : Format optimisé, moins d'encombrement

### **🔸 Commerce :**
- **Vivres** : Marchandise standard
- **Repas** : Produit transformé, plus précieux

### **🔸 Expéditions :**
- **Vivres** : Format de base
- **Repas** : Format voyage, conservation prolongée

---

## **4. PROBABILITÉS DÉTAILLÉES**

### **1 PA - Distribution des résultats**

#### **1PA-1V (Break-even : 33%)**
```
33% → Perte totale | 33% → Break-even | 33% → +1 repas
```
- **33% de chance** : Perte de 1 vivres (-1 net)
- **33% de chance** : Break-even (0 net)
- **33% de chance** : Gain de 1 repas (+1 net)
- **Conclusion** : **À éviter** (risque = bénéfice)

#### **1PA-2V (Break-even : 20%)**
```
20% → -2 vivres | 20% → -1 vivres | 20% → Break-even | 20% → +1 repas | 20% → +2 repas
```
- **40% de chance** : Perte de vivres (-2 ou -1)
- **20% de chance** : Break-even (0 net)
- **40% de chance** : Gain (+1 ou +2 repas)
- **Conclusion** : **À éviter** (risque > bénéfice)

### **2 PA - Distribution des résultats**

#### **2PA-2V (Break-even : 14%)**
```
14% → -2 | 14% → -1 | 14% → Break-even | 14% → +1 | 14% → +2 | 14% → +3 | 14% → +4
```
- **28% de chance** : Perte (-2 ou -1)
- **14% de chance** : Break-even (0 net)
- **58% de chance** : Gain (+1 à +4 repas)
- **Break-even** : 14% (gain ≥ 2 repas)

#### **2PA-5V (Break-even : 6%)**
```
6% → -5 | 6% → -4 | 6% → -3 | 6% → -2 | 6% → -1 | 6% → Break-even | 6% → +1 | 6% → +2 | 6% → +3 | 6% → +4 | 6% → +5 | 6% → +6 | 6% → +7 | 6% → +8 | 6% → +9 | 6% → +10
```
- **31% de chance** : Perte (-5 à -1)
- **6% de chance** : Break-even (0 net)
- **63% de chance** : Gain (+1 à +10 repas)
- **Break-even** : 6% (gain ≥ 5 repas)

---

## **5. IMPACT DU LUCKY ROLL**

### **Bonus Lucky Roll :**
- **2 tirages** au lieu d'1
- **Résultat** : Meilleur des deux gardé
- **Impact** : Réduction du risque + augmentation du gain

### **Avec Lucky Roll - Nouveaux gains :**

| **Config** | **Input** | **Output ⭐** | **Gain ⭐** | **Break-even ⭐** | **Bonus** |
|------------|-----------|--------------|-------------|------------------|-----------|
| **1PA-1V** | 1 | 1.5 | **+0.5** | **58%** | **+250%** |
| **1PA-2V** | 2 | 3.0 | **+1** | **64%** | **∞** |
| **2PA-2V** | 2 | 4.5 | **+2.5** | **75%** | **+150%** |
| **2PA-3V** | 3 | 6.75 | **+3.75** | **83%** | **+150%** |
| **2PA-4V** | 4 | 9.0 | **+5** | **88%** | **+150%** |
| **2PA-5V** | 5 | 11.25 | **+6.25** | **90%** | **+150%** |

---

## **6. EFFICACITÉ RÉELLE**

### **Comparaison qualitative (pas quantitative) :**

| **Capacité** | **Gain/PA** | **Risque** | **Avantages** |
|--------------|-------------|------------|---------------|
| **Chasser** | 3.0 | 0% | Gain direct |
| **Cueillir** | 2.0 | 0% | Gain direct |
| **Pêcher** | 1.6 | 0% | Gain direct |
| **Cuisine 2PA ⭐** | 3.125 | 10% | Transformation + conservation |

### **Break-even analysis (Lucky Roll) :**
- **2PA-5V ⭐** : 90% de chance de gain (10% de perte max)
- **2PA-4V ⭐** : 88% de chance de gain (12% de perte max)
- **2PA-3V ⭐** : 83% de chance de gain (17% de perte max)
- **2PA-2V ⭐** : 75% de chance de gain (25% de perte max)
- **1PA-2V ⭐** : 64% de chance de gain (36% de perte max)
- **1PA-1V ⭐** : 58% de chance de gain (42% de perte max)

---

## **7. RECOMMANDATIONS STRATÉGIQUES**

### **🎯 Quand utiliser la cuisine :**
1. **Préparation d'expéditions** : Repas plus adaptés aux voyages
2. **Stockage longue durée** : Repas se conservent mieux
3. **Commerce** : Repas plus précieux que vivres
4. **Surplus important** : 5+ vivres disponibles pour 2PA-5V
5. **Avec Lucky Roll** : 58-90% de chance de gain selon config

### **⚠️ Quand éviter la cuisine :**
1. **Stock vivres critique** : Risque de perte (10-42%)
2. **1PA configurations ⭐** : 58-64% de chance de gain (avec Lucky Roll)
3. **Sans Lucky Roll** : Moins efficace que la collecte directe
4. **Stock < 5 vivres** : Configurations sous-optimales

### **📈 Stratégies optimales :**
- **🏆 Premium** : 2PA-5V ⭐ (3.125 unités/PA, 90% break-even)
- **💰 Équilibré** : 2PA-4V ⭐ (2.5 unités/PA, 88% break-even)
- **⚡ Rapide** : 2PA-3V ⭐ (1.875 unités/PA, 83% break-even)
- **🎰 Risqué** : 2PA-2V ⭐ (1.25 unités/PA, 75% break-even)
- **🚫 1PA sans ⭐** : Seulement 20-33% break-even, à éviter absolument

---

## **8. COMPARAISON FINALE**

### **Vs Collecte directe :**

| **Aspect** | **Collecte (Chasser)** | **Cuisine (2PA-5V ⭐)** |
|------------|------------------------|--------------------------|
| **Gain/PA** | 3.0 vivres | 3.125 repas |
| **Risque** | 0% | 10% |
| **Avantages** | Gain direct | Conservation + logistique |
| **Usage** | Nourriture immédiate | Stockage + expéditions |

### **Break-even vs collecte :**
- **Cuisine 2PA ⭐** : 3.125/PA (avec avantages qualitatifs)
- **Chasser** : 3.0/PA (gain direct pur)
- **Différence** : +4% mais avec conservation et logistique

---

## **CONCLUSION FINALE**

La **cuisine n'est pas une capacité de gain** mais une **capacité de transformation** avec des avantages qualitatifs cruciaux.

### **🚫 1PA Configurations :**
- **1PA-1V** : 33% de risque de perte (67% de gain/break-even)
- **1PA-2V** : 40% de risque de perte (60% de gain/break-even)
- **Conclusion** : Rentables avec Lucky Roll, risquées sans

### **✅ 2PA Configurations :**
- **2PA-5V ⭐** : 3.125 vivres/PA (meilleur que chasser)
- **90% break-even** avec Lucky Roll (vs 6% sans bonus)
- **Avantages** : Conservation, stockage, commerce, expéditions

### **🎯 Stratégie recommandée :**
> **Attendre 5+ vivres → Cuisiner 2PA-5V avec Lucky Roll → +125% de valorisation + avantages qualitatifs**

La cuisine est **meilleure que la chasse** si on valorise les avantages de conservation et logistique, mais **inférieure** si on cherche seulement du gain pur ! 🎲🍽️
