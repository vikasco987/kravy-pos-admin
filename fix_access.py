import sys
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Revert the broken replacements first
    content = content.replace('bg-white dark:bg-[#1A1A2E]/5', 'bg-black/5 dark:bg-white/5')
    content = content.replace('bg-white dark:bg-[#1A1A2E]/10', 'bg-black/10 dark:bg-white/10')
    content = content.replace('bg-white dark:bg-[#1A1A2E]/[0.02]', 'bg-black/[0.02] dark:bg-white/[0.02]')
    content = content.replace('bg-white dark:bg-[#1A1A2E]/[0.01]', 'bg-black/[0.01] dark:bg-white/[0.01]')
    
    # Fix the hardcoded dark backgrounds
    content = content.replace('bg-[#0B0B1A]', 'bg-gray-50 dark:bg-[#0B0B1A]')
    
    # Fix the hardcoded text colors
    content = content.replace('text-slate-200', 'text-gray-900 dark:text-slate-200')
    content = content.replace('text-slate-300', 'text-gray-800 dark:text-slate-300')
    content = content.replace('text-slate-400', 'text-gray-600 dark:text-slate-400')
    content = content.replace('text-slate-500', 'text-gray-500 dark:text-slate-500')
    
    # Fix borders
    content = content.replace('border-white/10', 'border-gray-200 dark:border-white/10')
    content = content.replace('border-white/5', 'border-gray-200 dark:border-white/5')
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed {filepath}")

if __name__ == "__main__":
    for f in sys.argv[1:]:
        fix_file(f)
