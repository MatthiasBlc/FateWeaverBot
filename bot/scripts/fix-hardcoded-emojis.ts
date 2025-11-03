#!/usr/bin/env tsx
/**
 * Script to automatically fix hardcoded emojis in TypeScript files
 * Replaces hardcoded emojis with centralized constants from emojis.ts
 *
 * Usage:
 *   tsx scripts/fix-hardcoded-emojis.ts [file-pattern]
 *   tsx scripts/fix-hardcoded-emojis.ts --dry-run [file-pattern]
 *
 * Examples:
 *   tsx scripts/fix-hardcoded-emojis.ts src/features/admin/*.ts
 *   tsx scripts/fix-hardcoded-emojis.ts --dry-run src/utils/*.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Emoji replacements mapping
const EMOJI_REPLACEMENTS: Record<string, string> = {
  // Error emojis
  '"❌': '${STATUS.ERROR}',
  "'❌": '${STATUS.ERROR}',
  '❌': '${STATUS.ERROR}',

  // Success emojis
  '"✅': '${STATUS.SUCCESS}',
  "'✅": '${STATUS.SUCCESS}',
  '✅': '${STATUS.SUCCESS}',

  // Warning emojis
  '"⚠️': '${SYSTEM.WARNING}',
  "'⚠️": '${SYSTEM.WARNING}',
  '⚠️': '${SYSTEM.WARNING}',

  // Info emojis
  '"ℹ️': '${STATUS.INFO}',
  "'ℹ️": '${STATUS.INFO}',
  'ℹ️': '${STATUS.INFO}',

  // Celebration emojis
  '"🎉': '${CHANTIER.CELEBRATION}',
  "'🎉": '${CHANTIER.CELEBRATION}',
  '🎉': '${CHANTIER.CELEBRATION}',
  
  // Common emojis
  '"❤️': '${CHARACTER.HP_FULL}',
  '"💜': '${CHARACTER.MP_FULL}',
  '"⚡': '${CHARACTER.PA}',
  '"📋': '${CHARACTER.PROFILE}',
  '"🍞': '${HUNGER.ICON}',
  '"😊': '${HUNGER.FED}',
  '"😫': '${HUNGER.STARVATION}',
  '"💀': '${HUNGER.DEAD}',
  '"📝': '${CHANTIER.PLAN}',
  '"🚧': '${CHANTIER.IN_PROGRESS}',
  '"🛖': '${CHANTIER.ICON}',
  '"🔧': '${PROJECT.ACTIVE}',
  '"🛠️': '${PROJECT.ICON}',
  '"🧭': '${EXPEDITION.ICON}',
  '"⌛': '${EXPEDITION.DURATION}',
  '"📍': '${EXPEDITION.LOCATION}',
  
  // Capabilities emojis
  '"🏹': '${CAPABILITIES.HUNT}',
  '"🌿': '${CAPABILITIES.GATHER}',
  '"🎣': '${CAPABILITIES.FISH}',
  '"🪓': '${CAPABILITIES.CHOPPING}',
  '"⛏️': '${CAPABILITIES.MINING}',
  '"🧵': '${CAPABILITIES.WEAVING}',
  '"🔨': '${CAPABILITIES.FORGING}',
  '"🪚': '${CAPABILITIES.WOODWORKING}',
  '"🫕': '${CAPABILITIES.COOKING}',
  '"⚕️': '${CAPABILITIES.HEALING}',
  '"🔎': '${CAPABILITIES.RESEARCHING}'
};

// Constants to import based on usage
const IMPORTS_NEEDED: Record<string, string[]> = {
  'STATUS.ERROR': ['STATUS'],
  'STATUS.SUCCESS': ['STATUS'],
  'STATUS.WARNING': ['STATUS'],
  'STATUS.INFO': ['STATUS'],
  'STATUS.STATS': ['STATUS'],
  'SYSTEM.WARNING': ['SYSTEM'],
  'SYSTEM.SPARKLES': ['SYSTEM'],
  'SYSTEM.FORWARD': ['SYSTEM'],
  'SYSTEM.SEARCH': ['SYSTEM'],
  'SYSTEM.INBOX': ['SYSTEM'],
  'SYSTEM.PLUS': ['SYSTEM'],
  'SYSTEM.REFRESH': ['SYSTEM'],
  'SYSTEM.TRASH': ['SYSTEM'],
  'SYSTEM.CHART': ['SYSTEM'],
  'SYSTEM.ROCKET': ['SYSTEM'],
  'SYSTEM.BULB': ['SYSTEM'],
  'CHARACTER.HP_FULL': ['CHARACTER'],
  'CHARACTER.MP_FULL': ['CHARACTER'],
  'CHARACTER.PA': ['CHARACTER'],
  'CHARACTER.PROFILE': ['CHARACTER'],
  'HUNGER.DEAD': ['HUNGER'],
  'HUNGER.STARVATION': ['HUNGER'],
  'HUNGER.FED': ['HUNGER'],
  'HUNGER.ICON': ['HUNGER'],
  'CHANTIER.PLAN': ['CHANTIER'],
  'CHANTIER.IN_PROGRESS': ['CHANTIER'],
  'CHANTIER.COMPLETED': ['CHANTIER'],
  'CHANTIER.ICON': ['CHANTIER'],
  'CHANTIER.CELEBRATION': ['CHANTIER'],
  'PROJECT.ACTIVE': ['PROJECT'],
  'PROJECT.COMPLETED': ['PROJECT'],
  'PROJECT.ICON': ['PROJECT'],
  'PROJECT.CELEBRATION': ['PROJECT'],
  'EXPEDITION.PLANNING': ['EXPEDITION'],
  'EXPEDITION.ICON': ['EXPEDITION'],
  'EXPEDITION.DURATION': ['EXPEDITION'],
  'EXPEDITION.LOCATION': ['EXPEDITION'],
  'CAPABILITIES.HUNT': ['CAPABILITIES'],
  'CAPABILITIES.GATHER': ['CAPABILITIES'],
  'CAPABILITIES.FISH': ['CAPABILITIES'],
  'CAPABILITIES.CHOPPING': ['CAPABILITIES'],
  'CAPABILITIES.MINING': ['CAPABILITIES'],
  'CAPABILITIES.WEAVING': ['CAPABILITIES'],
  'CAPABILITIES.FORGING': ['CAPABILITIES'],
  'CAPABILITIES.WOODWORKING': ['CAPABILITIES'],
  'CAPABILITIES.COOKING': ['CAPABILITIES'],
  'CAPABILITIES.HEALING': ['CAPABILITIES'],
  'CAPABILITIES.RESEARCHING': ['CAPABILITIES']
};

interface FixResult {
  filePath: string;
  modified: boolean;
  replacements: number;
  errors: string[];
}

/**
 * Detect which emoji constants are used in the content
 */
function detectUsedConstants(content: string): Set<string> {
  const used = new Set<string>();

  for (const [pattern, constants] of Object.entries(IMPORTS_NEEDED)) {
    if (content.includes(pattern)) {
      constants.forEach(c => used.add(c));
    }
  }

  return used;
}

/**
 * Get the relative import path from a file to emojis.ts
 */
function getEmojiImportPath(filePath: string): string {
  const fileDir = path.dirname(filePath);
  const projectRoot = path.resolve(process.cwd(), 'src');
  const relativeToSrc = path.relative(fileDir, projectRoot);

  if (relativeToSrc === '') {
    return './constants/emojis.js';
  }

  const depth = relativeToSrc.split(path.sep).filter(p => p === '..').length;
  const prefix = '../'.repeat(depth === 0 ? 1 : depth);

  return `${prefix}constants/emojis.js`;
}

/**
 * Add imports to the file if not already present
 */
function addImports(content: string, filePath: string, constants: Set<string>): string {
  if (constants.size === 0) return content;

  // Check if emojis import already exists
  const hasEmojiImport = content.includes('from "./constants/emojis.js"') ||
                         content.includes('from "../constants/emojis.js"') ||
                         content.includes('from "../../constants/emojis.js"') ||
                         content.includes('from "../../../constants/emojis.js"');

  if (hasEmojiImport) {
    // Import exists, check if we need to add constants
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"](\.\.\/)*constants\/emojis\.js['"]/;
    const match = content.match(importRegex);

    if (match) {
      const existingImports = match[1].split(',').map(s => s.trim());
      const missingConstants = Array.from(constants).filter(c => !existingImports.includes(c));

      if (missingConstants.length > 0) {
        const newImports = [...existingImports, ...missingConstants].sort().join(', ');
        content = content.replace(importRegex, `import { ${newImports} } from ${match[0].match(/['"](.*)['"]/)?.[0]}`);
      }
    }

    return content;
  }

  // Check if any of the constants are already imported elsewhere (prevent duplicates)
  for (const constant of Array.from(constants)) {
    const alreadyImported = content.match(new RegExp(`import\\s*\\{[^}]*\\b${constant}\\b[^}]*\\}`, 'm'));
    if (alreadyImported) {
      // Constant already imported, remove it from the list
      constants.delete(constant);
    }
  }

  // If all constants are already imported, no need to add import
  if (constants.size === 0) return content;

  // No import exists, add it
  const importPath = getEmojiImportPath(filePath);
  const constantsList = Array.from(constants).sort().join(', ');
  const newImport = `import { ${constantsList} } from "${importPath}";\n`;

  // Find the last import statement (handle multi-line imports)
  const lines = content.split('\n');
  let lastImportIndex = -1;
  let inMultilineImport = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Check if starting a new import
    if (trimmed.startsWith('import ')) {
      lastImportIndex = i;
      // Check if it's a multi-line import (no semicolon and not closed)
      if (!trimmed.includes(';') && !trimmed.match(/from\s+['"][^'"]+['"]/)) {
        inMultilineImport = true;
      } else {
        inMultilineImport = false;
      }
    } else if (inMultilineImport) {
      // Continue tracking multi-line import until we find the closing
      lastImportIndex = i;
      if (trimmed.includes(';') || trimmed.match(/from\s+['"][^'"]+['"]/)) {
        inMultilineImport = false;
      }
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, newImport);
    return lines.join('\n');
  }

  // No imports found, add at the beginning (after comments/eslint directives)
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed === '') {
      insertIndex = i + 1;
    } else {
      break;
    }
  }

  lines.splice(insertIndex, 0, newImport);
  return lines.join('\n');
}

/**
 * Fix emojis in a single file
 */
function fixEmojisInFile(filePath: string, dryRun: boolean = false): FixResult {
  const result: FixResult = {
    filePath,
    modified: false,
    replacements: 0,
    errors: [],
  };

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Apply replacements with a smarter approach
    // Match the entire string pattern: "❌ text..." or '❌ text...'
    // and replace with template literal: `${STATUS.ERROR} text...`

    // Pattern 1: Double-quoted strings with emojis (match on single line only, no newlines)
    // Skip strings that contain backticks (would create nested template literal issues)
    content = content.replace(/"(❌|✅|⚠️|ℹ️|🎉)\s([^"\n\r]*)"/g, (match, emoji, text) => {
      // Skip if text contains backticks (would conflict with template literals)
      if (text.includes('`')) {
        return match; // Return unchanged
      }

      const emojiMap: Record<string, string> = {
        '❌': '${STATUS.ERROR}',
        '✅': '${STATUS.SUCCESS}',
        '⚠️': '${SYSTEM.WARNING}',
        'ℹ️': '${STATUS.INFO}',
        '🎉': '${CHANTIER.CELEBRATION}',
      };
      result.replacements++;
      return `\`${emojiMap[emoji]} ${text}\``;
    });

    // Pattern 2: Double-quoted strings with emoji but no trailing text
    content = content.replace(/"(❌|✅|⚠️|ℹ️|🎉)"/g, (match, emoji) => {
      const emojiMap: Record<string, string> = {
        '❌': '${STATUS.ERROR}',
        '✅': '${STATUS.SUCCESS}',
        '⚠️': '${SYSTEM.WARNING}',
        'ℹ️': '${STATUS.INFO}',
        '🎉': '${CHANTIER.CELEBRATION}',
      };
      result.replacements++;
      return `\`${emojiMap[emoji]}\``;
    });

    // Pattern 3: Single-quoted strings with emojis (match on single line only, no newlines)
    // Skip strings that contain backticks (would create nested template literal issues)
    content = content.replace(/'(❌|✅|⚠️|ℹ️|🎉)\s([^'\n\r]*)'/g, (match, emoji, text) => {
      // Skip if text contains backticks (would conflict with template literals)
      if (text.includes('`')) {
        return match; // Return unchanged
      }

      const emojiMap: Record<string, string> = {
        '❌': '${STATUS.ERROR}',
        '✅': '${STATUS.SUCCESS}',
        '⚠️': '${SYSTEM.WARNING}',
        'ℹ️': '${STATUS.INFO}',
        '🎉': '${CHANTIER.CELEBRATION}',
      };
      result.replacements++;
      return `\`${emojiMap[emoji]} ${text}\``;
    });

    // Pattern 4: Single-quoted strings with emoji but no trailing text
    content = content.replace(/'(❌|✅|⚠️|ℹ️|🎉)'/g, (match, emoji) => {
      const emojiMap: Record<string, string> = {
        '❌': '${STATUS.ERROR}',
        '✅': '${STATUS.SUCCESS}',
        '⚠️': '${SYSTEM.WARNING}',
        'ℹ️': '${STATUS.INFO}',
        '🎉': '${CHANTIER.CELEBRATION}',
      };
      result.replacements++;
      return `\`${emojiMap[emoji]}\``;
    });

    if (content !== originalContent) {
      result.modified = true;

      // Detect which constants are used
      const usedConstants = detectUsedConstants(content);

      // Add imports
      content = addImports(content, filePath, usedConstants);

      if (!dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }

  } catch (error) {
    result.errors.push(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Recursively find all TypeScript files in a directory
 */
function findTsFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.includes('node_modules') && !entry.name.includes('dist')) {
          files.push(...findTsFiles(fullPath));
        }
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.ts') &&
            !entry.name.endsWith('.d.ts') &&
            !entry.name.endsWith('.test.ts') &&
            !entry.name.startsWith('_')) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return files;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const inputPaths = args.filter(arg => !arg.startsWith('--'));

  // If specific files/dirs provided, use those, otherwise scan default dirs
  const baseDirs = inputPaths.length > 0 ? inputPaths : [
    'src/features',
    'src/utils',
    'src/modals',
    'src/commands',
  ];

  console.log('🔍 Finding TypeScript files...');
  console.log(`Scanning: ${baseDirs.join(', ')}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}\n`);

  const allFiles: string[] = [];

  for (const basePath of baseDirs) {
    const fullPath = path.resolve(process.cwd(), basePath);

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        allFiles.push(...findTsFiles(fullPath));
      } else if (stats.isFile() && fullPath.endsWith('.ts')) {
        allFiles.push(fullPath);
      }
    } else {
      console.warn(`⚠️  Path not found: ${basePath}`);
    }
  }

  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];

  // Filter out already fixed files
  const filesToFix = uniqueFiles.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('"❌') || content.includes('"✅') ||
           content.includes('"⚠️') || content.includes("'❌") ||
           content.includes("'✅");
  });

  console.log(`📁 Found ${uniqueFiles.length} TypeScript files`);
  console.log(`🎯 ${filesToFix.length} files have hardcoded emojis\n`);

  if (filesToFix.length === 0) {
    console.log('✅ No files need fixing!');
    return;
  }

  const results: FixResult[] = [];
  let totalReplacements = 0;
  let filesModified = 0;
  let errors = 0;

  for (const file of filesToFix) {
    const result = fixEmojisInFile(file, dryRun);
    results.push(result);

    if (result.modified) {
      filesModified++;
      totalReplacements += result.replacements;
      console.log(`${dryRun ? '📝' : '✅'} ${file}: ${result.replacements} replacements`);
    }

    if (result.errors.length > 0) {
      errors++;
      console.error(`❌ ${file}:`);
      result.errors.forEach(err => console.error(`   ${err}`));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Files scanned: ${filesToFix.length}`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  console.log(`   Errors: ${errors}`);

  if (dryRun) {
    console.log('\n💡 This was a dry run. Re-run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ All files processed successfully!');
    console.log('🔨 Run `npm run build` to verify the changes.');
  }
}

// Run the script
try {
  main();
} catch (error) {
  console.error('Fatal error:', error);
  process.exit(1);
}
