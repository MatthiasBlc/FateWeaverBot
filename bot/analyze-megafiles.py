#!/usr/bin/env python3
"""
Analyze mega-files to understand their structure and suggest splits
"""
import re
from pathlib import Path

MEGA_FILES = [
    "src/features/admin/projects-admin/project-add.ts",
    "src/features/admin/new-element-admin.handlers.ts",
    "src/features/admin/element-object-admin.handlers.ts",
    "src/features/projects/projects.handlers.ts",
    "src/features/users/users.handlers.ts",
    "src/features/chantiers/chantiers.handlers.ts",
]

def analyze_file(filepath):
    """Analyze a TypeScript file structure"""
    if not Path(filepath).exists():
        return None

    with open(filepath, 'r') as f:
        content = f.read()

    # Count lines
    lines = content.split('\n')
    total_lines = len(lines)

    # Find exported functions
    exported_funcs = re.findall(r'export\s+(?:async\s+)?function\s+(\w+)', content)

    # Find imports
    imports = re.findall(r'import.*from\s+["\']([^"\']+)["\']', content)

    # Find comments/sections
    sections = re.findall(r'/\*\*\s*\n\s*\*\s+(.+?)\n', content)

    return {
        'path': filepath,
        'total_lines': total_lines,
        'exported_functions': exported_funcs,
        'num_exports': len(exported_funcs),
        'num_imports': len(set(imports)),
        'sections': sections[:10],  # First 10 sections
    }

def suggest_split(analysis):
    """Suggest how to split a file based on analysis"""
    if not analysis:
        return []

    funcs = analysis['exported_functions']
    lines = analysis['total_lines']

    suggestions = []

    # Group functions by prefix
    prefixes = {}
    for func in funcs:
        # Extract prefix (handle, create, update, delete, etc.)
        match = re.match(r'^(handle|create|update|delete|get|build|format|display|edit|add|remove)([A-Z]\w+)', func)
        if match:
            prefix = match.group(1)
            prefixes.setdefault(prefix, []).append(func)

    # Suggest splits based on prefixes
    for prefix, funcs_list in prefixes.items():
        if len(funcs_list) >= 3:  # Only suggest if 3+ functions
            suggestions.append({
                'type': 'by_action',
                'action': prefix,
                'functions': funcs_list,
                'estimated_lines': (len(funcs_list) / analysis['num_exports']) * lines
            })

    return suggestions

def main():
    print("="*70)
    print("MEGA-FILE ANALYSIS FOR PHASE 4")
    print("="*70)
    print()

    analyses = []

    for filepath in MEGA_FILES:
        print(f"📄 Analyzing: {filepath}")
        analysis = analyze_file(filepath)

        if analysis:
            analyses.append(analysis)
            print(f"   Lines: {analysis['total_lines']}")
            print(f"   Exports: {analysis['num_exports']} functions")
            print(f"   Imports: {analysis['num_imports']} unique")

            if analysis['sections']:
                print(f"   Sections found:")
                for section in analysis['sections'][:3]:
                    print(f"      • {section}")

            # Suggest splits
            suggestions = suggest_split(analysis)
            if suggestions:
                print(f"   Split suggestions:")
                for sug in suggestions[:3]:
                    print(f"      → {sug['action']}-*.ts ({len(sug['functions'])} functions, ~{int(sug['estimated_lines'])} lines)")

            print()

    # Summary
    print("="*70)
    print("SUMMARY")
    print("="*70)
    total_lines = sum(a['total_lines'] for a in analyses)
    total_exports = sum(a['num_exports'] for a in analyses)
    print(f"Total mega-file lines: {total_lines}")
    print(f"Total exported functions: {total_exports}")
    print(f"Average lines per file: {total_lines // len(analyses)}")
    print(f"Average exports per file: {total_exports // len(analyses)}")

if __name__ == "__main__":
    main()
