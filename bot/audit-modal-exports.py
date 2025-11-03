#!/usr/bin/env python3
"""
Audit script to check all modal handler imports and verify exports exist
"""
import re
import os
from pathlib import Path

def extract_imports_from_modal_handler():
    """Extract all dynamic imports from modal-handler.ts"""
    imports = []
    with open('src/utils/modal-handler.ts', 'r') as f:
        content = f.read()

    # Find all patterns like: const { functionName } = await import("path")
    pattern = r'const\s*\{\s*(\w+)\s*\}\s*=\s*await\s*import\(\s*["\']([^"\']+)["\']\s*\)'
    matches = re.findall(pattern, content)

    for func_name, import_path in matches:
        # Convert relative path to absolute
        abs_path = import_path.replace('../', 'src/')
        abs_path = abs_path.replace('.js', '.ts')
        imports.append((func_name, abs_path))

    return imports

def check_export_exists(file_path, function_name):
    """Check if a function is exported from a file"""
    if not os.path.exists(file_path):
        return False, f"File not found: {file_path}"

    with open(file_path, 'r') as f:
        content = f.read()

    # Check for export patterns
    patterns = [
        rf'export\s+async\s+function\s+{function_name}\s*\(',
        rf'export\s+function\s+{function_name}\s*\(',
        rf'export\s+const\s+{function_name}\s*=',
    ]

    for pattern in patterns:
        if re.search(pattern, content):
            return True, "Found"

    return False, "Not exported"

def main():
    print("="*70)
    print("MODAL HANDLER EXPORT AUDIT")
    print("="*70)
    print()

    imports = extract_imports_from_modal_handler()

    missing = []
    found = []

    for func_name, file_path in imports:
        exists, msg = check_export_exists(file_path, func_name)

        if exists:
            found.append((func_name, file_path))
            print(f"✅ {func_name}")
            print(f"   📁 {file_path}")
        else:
            missing.append((func_name, file_path, msg))
            print(f"❌ {func_name}")
            print(f"   📁 {file_path}")
            print(f"   ⚠️  {msg}")
        print()

    print("="*70)
    print(f"SUMMARY: {len(found)} found, {len(missing)} missing")
    print("="*70)

    if missing:
        print("\nMISSING EXPORTS TO FIX:")
        for func_name, file_path, msg in missing:
            print(f"  • {func_name} in {file_path}")

if __name__ == "__main__":
    main()
