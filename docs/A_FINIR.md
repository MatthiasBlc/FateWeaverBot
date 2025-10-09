Dans ta mémoire, lorsque tu utilise Supernova, peut être faut-il affiner le protocle ?
Demander un rapport
Préciser de faire des buid et vérifications de types
faire des commits
Ne pas tourner en boucle (il corrige une erreur par une erreur et reviens à la première et ainsi de suite)
Ne pas supprimer les fichier si facilement (car il a tendance à supprimer les fichiers en les considérants
corrompus plutôt que de chercher à les corriger et cela le fait entrer dans une boucle similaire)
etc

● Tu as totalement raison ! Le protocole Supernova manque de précision. Je vais l'améliorer avec ton retour
d'expérience :

● Read(~/Repo/FateWeaverBot/.claude/collaboration.md)
⎿ Read 50 lines (ctrl+o to expand)

● Update(~/Repo/FateWeaverBot/.claude/collaboration.md)
⎿ Updated ../.claude/collaboration.md with 32 additions and 7 removals  
 127 ## 📄 INSTRUCTIONS COMPLÈTES
128 Lis et exécute : `/chemin/absolu/vers/docs/supernova-prompt-X.md`
129  
 130 - ## ⚠️ RÈGLES CRITIQUES
131 - 1. Commandes npm : `cd /chemin/absolu && npm run build`
132 - 2. Tester APRÈS CHAQUE modification
133 - 3. Committer APRÈS CHAQUE succès
130 + ## ⚠️ RÈGLES CRITIQUES - IMPÉRATIF
131  
 132 + ### 🚫 INTERDICTIONS ABSOLUES
133 + 1. **NE JAMAIS supprimer un fichier** sans avoir essayé au moins 3 corrections différentes
134 + 2. **NE JAMAIS considérer un fichier "corrompu"** - les fichiers ont juste des erreurs TypeScript + à corriger
135 + 3. **NE JAMAIS tourner en boucle** - Si même erreur après 2 tentatives, STOP et documente le + problème
136 + 4. **NE JAMAIS committer sans build** - Le build DOIT passer avant chaque commit
137 +  
 138 + ### ✅ PROCÉDURE OBLIGATOIRE
139 +  
 140 + **Après CHAQUE modification de fichier :**
141 + 1. `cd /chemin/absolu && npm run build` (backend OU bot selon le fichier)
142 + 2. Si erreur TypeScript → **CORRIGER dans le même fichier** (pas de suppression)
143 + 3. Si même erreur 2 fois → **STOP, documenter, passer à la tâche suivante**
144 + 4. Si build OK → `git add . && git commit -m "message descriptif"`
145 + 5. Continuer avec la tâche suivante
146 +  
 147 + **Gestion des erreurs TypeScript :**
148 + - Erreur de syntaxe → Corriger la syntaxe (accolade, parenthèse, etc.)
149 + - Import manquant → Ajouter l'import
150 + - Type incorrect → Ajuster le type
151 + - Variable non utilisée → Supprimer ou utiliser la variable
152 + - **JAMAIS** → Supprimer le fichier et le recréer
153 +  
 154 + ### 📊 RAPPORT FINAL OBLIGATOIRE
155 + Tu DOIS fournir un rapport détaillé à la fin avec :
156 + - ✅ Fichiers modifiés (liste complète avec nombre de lignes)
157 + - ✅ Commits créés (liste avec messages)
158 + - ✅ Builds réussis (backend + bot si applicable)
159 + - ✅ Erreurs rencontrées et résolues
160 + - ⚠️ Problèmes NON résolus (si bloqué)
161 + - 📈 Métriques : Temps estimé, lignes ajoutées/supprimées
162 +  
 163 ## 🎯 TÂCHES
164 [Liste courte des tâches principales]
165  
 166 - ## 📊 RAPPORT FINAL
167 - À la fin, fournis un rapport avec [liste des métriques attendues]
168 -  
 166 ## 🚀 COMMENCE
167 Lis le prompt détaillé et commence !
168 \`\`\`

● Maintenant améliorons le template détaillé :

● Update(~/Repo/FateWeaverBot/.claude/collaboration.md)
⎿ Updated ../.claude/collaboration.md with 84 additions and 5 removals  
 182 **Fichiers cibles** : [Nombre] fichiers ([Nombre] lignes)
183 **Résultat attendu** : [Métriques de succès]
184  
 185 - ## ⚠️ RÈGLES CRITIQUES
185 + ## ⚠️ RÈGLES CRITIQUES - IMPÉRATIF
186  
 187 - 1. **Commandes** : [Commandes exactes avec chemins absolus]
188 - 2. **Ordre** : [Ordre d'exécution strict]
189 - 3. **Tests** : [Quand et comment tester]
190 - 4. **Commits** : [Format et fréquence]
187 + ### 🚫 INTERDICTIONS ABSOLUES
188 + 1. **NE JAMAIS supprimer un fichier** sans avoir essayé au moins 3 corrections différentes
189 + 2. **NE JAMAIS considérer un fichier "corrompu"** - Corriger les erreurs TypeScript, pas + supprimer
190 + 3. **NE JAMAIS tourner en boucle** - Si même erreur après 2 tentatives :
191 + - STOP immédiatement
192 + - Documente l'erreur dans le rapport
193 + - Passe à la tâche suivante
194 + 4. **NE JAMAIS committer sans build** - Build DOIT passer avant commit
195  
 196 + ### ✅ WORKFLOW STRICT PAR FICHIER
197 +  
 198 + `       199 +  Pour CHAQUE fichier modifié :
       200 +  1. Modifier le fichier
       201 +  2. cd /chemin/absolu && npm run build
       202 +  3. Si erreur :
       203 +     a. Lire l'erreur TypeScript complète
       204 +     b. Corriger DANS LE MÊME FICHIER (pas de suppression)
       205 +     c. Re-build
       206 +     d. Si même erreur → Tenter correction différente (max 2 fois)
       207 +     e. Si toujours erreur → STOP, documenter, passer au suivant
       208 +  4. Si build OK :
       209 +     a. git add .
       210 +     b. git commit -m "feat: description précise"
       211 +     c. Passer au fichier suivant
       212 + `
213 +  
 214 + ### 🔍 GESTION ERREURS TYPESCRIPT
215 +  
 216 + **Types d'erreurs et corrections :**
217 + - `Unexpected token` → Vérifier accolades/parenthèses/virgules
218 + - `Cannot find name` → Ajouter import ou déclarer la variable
219 + - `Type X is not assignable to Y` → Ajuster le type ou le cast
220 + - `X is declared but never used` → Utiliser la variable ou supprimer la déclaration
221 + - `Missing closing brace` → Compter les accolades, ajouter la manquante
222 +  
 223 + **SI BLOQUÉ après 2 tentatives :**
224 + 1. Laisser le fichier dans son état actuel
225 + 2. Documenter : "❌ Fichier X : Erreur Y non résolue après 2 tentatives"
226 + 3. Passer à la tâche suivante
227 + 4. **NE PAS** supprimer le fichier
228 +  
 229 + ### 📊 RAPPORT FINAL OBLIGATOIRE
230 +  
 231 + Structure EXACTE du rapport à fournir :
232 +  
 233 + `` markdown
       234 +  # ✅ RAPPORT FINAL - [NOM TÂCHE]
       235 +  
       236 +  ## 📁 Fichiers Modifiés
       237 +  - `/chemin/fichier1.ts` (+X lignes, -Y lignes)
       238 +  - `/chemin/fichier2.ts` (+X lignes, -Y lignes)
       239 +  Total : X fichiers
       240 +  
       241 +  ## 💾 Commits Créés
       242 +  1. `abc1234` - feat: description commit 1
       243 +  2. `def5678` - feat: description commit 2
       244 +  Total : X commits
       245 +  
       246 +  ## ✅ Builds Réussis
       247 +  - ✅ Backend : `npm run build` (0 errors)
       248 +  - ✅ Bot : `npm run build` (0 errors)
       249 +  
       250 +  ## 🔧 Erreurs Résolues
       251 +  1. **Fichier X, ligne Y** : Erreur Z → Corrigé en [explication]
       252 +  2. **Fichier A, ligne B** : Erreur C → Corrigé en [explication]
       253 +  
       254 +  ## ⚠️ Problèmes Non Résolus (SI APPLICABLE)
       255 +  - ❌ Fichier `/path/file.ts` : Erreur "message" après 2 tentatives
       256 +  - Raison : [Explication de pourquoi bloqué]
       257 +  
       258 +  ## 📈 Métriques
       259 +  - Durée estimée : X heures
       260 +  - Lignes ajoutées : +XXX
       261 +  - Lignes supprimées : -XXX
       262 +  - Taux de succès : X/Y tâches complétées
       263 +   ``
264 +  
 265 + ### 🎯 COMMANDES EXACTES
266 + - **Build backend** : `cd /home/bouloc/Repo/FateWeaverBot/backend && npm run build`
267 + - **Build bot** : `cd /home/bouloc/Repo/FateWeaverBot/bot && npm run build`
268 + - **Commit** : `git add . && git commit -m "message"`
269 + - **Prisma** : `cd /home/bouloc/Repo/FateWeaverBot/backend && npx prisma migrate dev --name 
           + nom_migration`
270 +  
 271 ## 📦 TÂCHES (dans l'ordre)
272  
 273 ### Tâche 1 : [Nom]
⎿ Session limit reached ∙ resets 6pm
/upgrade to increase your usage limit.
