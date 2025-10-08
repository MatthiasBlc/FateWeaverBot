#!/usr/bin/env node

/**
 * Context Helper - Système intelligent de chargement de contexte
 *
 * Analyse la tâche en cours et suggère le contexte optimal à charger
 * pour minimiser les tokens tout en gardant les informations pertinentes.
 *
 * Usage:
 *   node scripts/context-helper.js init
 *   node scripts/context-helper.js suggest --task "fix expedition bug"
 *   node scripts/context-helper.js auto-suggest
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const CONTEXT_MAP_PATH = path.join(PROJECT_ROOT, '.claude/context-map.json');
const LAST_SESSION_PATH = path.join(PROJECT_ROOT, '.claude/last-session.json');
const TODO_PATH = path.join(PROJECT_ROOT, 'docs/TODO.md');

// Charger la carte de contexte
function loadContextMap() {
  try {
    const content = fs.readFileSync(CONTEXT_MAP_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Erreur de lecture context-map.json:', error.message);
    process.exit(1);
  }
}

// Sauvegarder la dernière session
function saveLastSession(context) {
  const session = {
    timestamp: new Date().toISOString(),
    context: context,
    files_loaded: context.suggested_files || []
  };
  fs.writeFileSync(LAST_SESSION_PATH, JSON.stringify(session, null, 2));
}

// Récupérer les fichiers modifiés récemment (via git)
function getRecentlyModifiedFiles(days = 1) {
  try {
    const cmd = `git log --since="${days} days ago" --name-only --pretty=format: | sort -u`;
    const result = execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf8' });
    return result.split('\n').filter(f => f && f.endsWith('.ts') || f.endsWith('.md'));
  } catch (error) {
    console.warn('⚠️  Git non disponible, skip fichiers récents');
    return [];
  }
}

// Lire TODO.md pour détecter tâche en cours
function detectCurrentTask() {
  try {
    const todoContent = fs.readFileSync(TODO_PATH, 'utf8');

    // Détecter "EN COURS" dans TODO
    const inProgressMatch = todoContent.match(/###.*\(EN COURS\)([\s\S]*?)(?=###|$)/);
    if (inProgressMatch) {
      return {
        type: 'continue',
        description: inProgressMatch[1].substring(0, 200).trim()
      };
    }

    // Détecter première tâche non complétée
    const todoMatch = todoContent.match(/- \[ \](.*)/);
    if (todoMatch) {
      return {
        type: 'todo',
        description: todoMatch[1].trim()
      };
    }

    return { type: 'unknown', description: 'Aucune tâche détectée' };
  } catch (error) {
    return { type: 'unknown', description: 'TODO.md non accessible' };
  }
}

// Analyser une tâche et suggérer le contexte
function analyzeTask(taskDescription) {
  const contextMap = loadContextMap();
  const suggestions = {
    always_load: contextMap.always_load.files,
    on_demand: [],
    code_contexts: [],
    tokens_estimate: contextMap.always_load.tokens_estimate
  };

  const taskLower = taskDescription.toLowerCase();

  // Analyser on_demand
  for (const [key, config] of Object.entries(contextMap.on_demand)) {
    const matches = config.triggers.some(trigger => taskLower.includes(trigger.toLowerCase()));
    if (matches) {
      suggestions.on_demand.push(...config.patterns);
      suggestions.tokens_estimate += config.tokens_estimate;
    }
  }

  // Analyser code_contexts
  for (const [key, config] of Object.entries(contextMap.code_contexts)) {
    if (taskLower.includes(key)) {
      suggestions.code_contexts.push(key);
      suggestions.tokens_estimate += config.tokens_estimate;
    }
  }

  // Scénarios communs
  for (const [scenario, config] of Object.entries(contextMap.common_scenarios)) {
    if (taskLower.includes(scenario.replace('_', ' '))) {
      console.log(`\n💡 Scénario détecté : ${config.description}`);
      console.log(`   ${config.suggestion}`);
    }
  }

  return suggestions;
}

// Afficher les suggestions
function displaySuggestions(suggestions, task) {
  console.log('\n🎯 CONTEXTE SUGGÉRÉ\n');
  console.log('Tâche détectée :', task.description || 'Non spécifiée');
  console.log('\n📂 Fichiers à charger :\n');

  console.log('  ✅ Always load (minimal):');
  suggestions.always_load.forEach(f => console.log(`     - ${f}`));

  if (suggestions.on_demand.length > 0) {
    console.log('\n  📚 Documentation pertinente:');
    suggestions.on_demand.forEach(f => console.log(`     - ${f}`));
  }

  if (suggestions.code_contexts.length > 0) {
    console.log('\n  💻 Code contexts:');
    suggestions.code_contexts.forEach(ctx => console.log(`     - ${ctx}/ (voir .claude/context-map.json)`));
  }

  console.log(`\n📊 Tokens estimés : ~${suggestions.tokens_estimate.toLocaleString()}`);

  // Budget recommendation
  const contextMap = loadContextMap();
  let budget = 'light';
  if (suggestions.tokens_estimate > 25000) budget = 'heavy';
  else if (suggestions.tokens_estimate > 10000) budget = 'medium';

  console.log(`💡 Budget recommandé : ${budget} (${contextMap.token_budget[budget].tokens.toLocaleString()} tokens)\n`);

  return suggestions;
}

// Commande: init
function cmdInit() {
  console.log('🤖 Context Helper - Initialisation\n');

  // Détecter tâche courante
  const task = detectCurrentTask();
  console.log('📋 Analyse de la tâche courante...');

  // Fichiers récents
  const recentFiles = getRecentlyModifiedFiles(1);
  if (recentFiles.length > 0) {
    console.log(`\n📝 Fichiers modifiés récemment (24h) : ${recentFiles.length}`);
    recentFiles.slice(0, 5).forEach(f => console.log(`   - ${f}`));
    if (recentFiles.length > 5) console.log(`   ... et ${recentFiles.length - 5} autres`);
  }

  // Analyser et suggérer
  const suggestions = analyzeTask(task.description);
  displaySuggestions(suggestions, task);

  // Sauvegarder session
  saveLastSession({ task, suggestions, recentFiles });

  console.log('✅ Contexte analysé et sauvegardé\n');
  console.log('💬 Prochain : Charge les fichiers suggérés ci-dessus dans Claude\n');
}

// Commande: suggest
function cmdSuggest(taskArg) {
  console.log('🤖 Context Helper - Suggestion\n');

  const task = { type: 'manual', description: taskArg };
  const suggestions = analyzeTask(taskArg);
  displaySuggestions(suggestions, task);

  saveLastSession({ task, suggestions });
}

// Commande: auto-suggest (pour hook)
function cmdAutoSuggest() {
  const task = detectCurrentTask();
  const suggestions = analyzeTask(task.description);

  // Output minimaliste pour hook
  console.log('🎯 Contexte auto-détecté:');
  console.log(`   Tâche: ${task.description.substring(0, 60)}...`);
  console.log(`   Tokens: ~${suggestions.tokens_estimate.toLocaleString()}`);

  saveLastSession({ task, suggestions });
}

// Commande: list
function cmdList() {
  const contextMap = loadContextMap();

  console.log('\n📚 CONTEXTES DISPONIBLES\n');

  console.log('📂 Code Contexts:');
  for (const [key, config] of Object.entries(contextMap.code_contexts)) {
    console.log(`   ${key.padEnd(15)} - ${config.description} (~${config.tokens_estimate} tokens)`);
  }

  console.log('\n📖 Documentation On-Demand:');
  for (const [key, config] of Object.entries(contextMap.on_demand)) {
    console.log(`   ${key.padEnd(15)} - ${config.description} (~${config.tokens_estimate} tokens)`);
  }

  console.log('\n💡 Scénarios Communs:');
  for (const [key, config] of Object.entries(contextMap.common_scenarios)) {
    console.log(`   ${key.padEnd(15)} - ${config.description}`);
  }

  console.log('');
}

// Main
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      cmdInit();
      break;

    case 'suggest':
      const taskIndex = args.indexOf('--task');
      if (taskIndex === -1 || !args[taskIndex + 1]) {
        console.error('❌ Usage: node context-helper.js suggest --task "description"');
        process.exit(1);
      }
      cmdSuggest(args[taskIndex + 1]);
      break;

    case 'auto-suggest':
      cmdAutoSuggest();
      break;

    case 'list':
      cmdList();
      break;

    default:
      console.log(`
🤖 Context Helper - Système de Contexte Intelligent

Usage:
  node scripts/context-helper.js init
    → Analyse la tâche courante et suggère le contexte optimal

  node scripts/context-helper.js suggest --task "description"
    → Suggère le contexte pour une tâche spécifique

  node scripts/context-helper.js auto-suggest
    → Mode automatique pour hook (output minimal)

  node scripts/context-helper.js list
    → Liste tous les contextes disponibles

Exemples:
  node scripts/context-helper.js init
  node scripts/context-helper.js suggest --task "fix expedition bug"
  node scripts/context-helper.js list
      `);
      break;
  }
}

main();
