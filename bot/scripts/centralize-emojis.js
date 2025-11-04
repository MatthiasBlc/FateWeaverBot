#!/usr/bin/env node

/**
 * Script d'automatisation pour centraliser les emojis hardcodés
 *
 * Remplace:
 * - ❌ → ${STATUS.ERROR}
 * - ✅ → ${STATUS.SUCCESS}
 * - ⚠️ → ${SYSTEM.WARNING}
 *
 * Usage: node scripts/centralize-emojis.js
 */

const fs = require('fs');
const path = require('path');

const EMOJI_REPLACEMENTS = [
  { emoji: '❌', constant: 'STATUS.ERROR', category: 'STATUS' },
  { emoji: '✅', constant: 'STATUS.SUCCESS', category: 'STATUS' },
  { emoji: '⚠️', constant: 'SYSTEM.WARNING', category: 'SYSTEM' },
];

const files = [
  // Deploy scripts
  'src/deploy-commands-force.ts',
  'src/deploy-commands.ts',
  'src/commands/_template.ts',

  // Expeditions handlers (11 fichiers)
  'src/features/expeditions/handlers/expedition-create-resources.ts',
  'src/features/expeditions/handlers/expedition-create.ts',
  'src/features/expeditions/handlers/expedition-display.ts',
  'src/features/expeditions/handlers/expedition-emergency.ts',
  'src/features/expeditions/handlers/expedition-join.ts',
  'src/features/expeditions/handlers/expedition-leave.ts',
  'src/features/expeditions/handlers/expedition-resource-management.ts',
  'src/features/expeditions/handlers/expedition-transfer.ts',

  // Admin handlers
  'src/features/admin/character-admin/character-capabilities.ts',
  'src/features/admin/character-admin/character-objects.ts',
  'src/features/admin/character-admin/character-skills.ts',
  'src/features/admin/character-admin/character-stats.ts',
  'src/features/admin/emoji-admin.handlers.ts',
  'src/features/admin/expedition-admin.handlers.ts',
  'src/features/admin/expedition-admin-resource-handlers.ts',
  'src/features/admin/projects-admin/project-add/step-1-init.ts',
  'src/features/admin/projects-admin/project-add/step-2-types.ts',
  'src/features/admin/projects-admin/project-add/step-5-finalize.ts',
  'src/features/admin/projects-admin/project-delete.ts',
  'src/features/admin/projects-admin/project-edit.ts',
  'src/features/admin/stock-admin/stock-add.ts',
  'src/features/admin/stock-admin/stock-remove.ts',

  // Projects/Users
  'src/features/projects/handlers/projects-display.ts',
  'src/features/projects/handlers/projects-helpers.ts',
  'src/features/projects/handlers/projects-view.ts',
  'src/features/projects/project-creation.ts',
  'src/features/users/give-object.handlers.ts',
  'src/features/users/users.handlers.ts',

  // Utils
  'src/utils/button-handler.ts',
  'src/utils/embeds.ts',
];

let totalReplacements = 0;
let filesModified = 0;

function processFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  let fileReplacements = 0;

  // Track which constants we need to import
  const neededConstants = new Set();

  // Replace emojis
  for (const { emoji, constant, category } of EMOJI_REPLACEMENTS) {
    const regex = new RegExp(emoji, 'g');
    const matches = content.match(regex);

    if (matches) {
      // Replace in template literals
      content = content.replace(
        new RegExp(`"([^"]*?)${emoji}([^"]*?)"`, 'g'),
        (match, before, after) => {
          neededConstants.add(category);
          fileReplacements += 1;
          return `\`${before}\${${constant}}${after}\``;
        }
      );

      // Replace in existing template literals
      content = content.replace(
        new RegExp(`\`([^\`]*?)${emoji}([^\`]*?)\``, 'g'),
        (match, before, after) => {
          neededConstants.add(category);
          fileReplacements += 1;
          return `\`${before}\${${constant}}${after}\``;
        }
      );

      modified = true;
    }
  }

  if (modified) {
    // Check if imports already exist
    const hasStatusImport = content.includes('import { STATUS }') || content.includes('import {STATUS}');
    const hasSystemImport = content.includes('import { SYSTEM }') || content.includes('import {SYSTEM}');

    // Add missing imports
    const importsToAdd = [];
    if (neededConstants.has('STATUS') && !hasStatusImport) {
      importsToAdd.push('STATUS');
    }
    if (neededConstants.has('SYSTEM') && !hasSystemImport) {
      importsToAdd.push('SYSTEM');
    }

    if (importsToAdd.length > 0) {
      // Find the last import statement
      const importRegex = /^import .* from .*;$/gm;
      const imports = content.match(importRegex);

      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const importStatement = `import { ${importsToAdd.join(', ')} } from "@shared/constants/emojis";`;
        content = content.replace(lastImport, `${lastImport}\n${importStatement}`);
      } else {
        // No imports found, add at the top
        const importStatement = `import { ${importsToAdd.join(', ')} } from "@shared/constants/emojis";\n\n`;
        content = importStatement + content;
      }
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    filesModified++;
    totalReplacements += fileReplacements;
    console.log(`✅ ${filePath} (${fileReplacements} replacements)`);
  }
}

console.log('🔄 Starting emoji centralization...\n');

files.forEach(processFile);

console.log(`\n✅ Done!`);
console.log(`📊 Files modified: ${filesModified}/${files.length}`);
console.log(`📊 Total replacements: ${totalReplacements}`);
