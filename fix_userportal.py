import sys
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # REVERT existing dual classes to simplify
    content = re.sub(r'bg-[a-zA-Z0-9_/-]+ dark:bg-\[#[A-Fa-f0-9]+\](/\d+)?', lambda m: 'bg-[#' + m.group(0).split('[#')[1], content)
    content = re.sub(r'bg-[a-zA-Z0-9_/-]+ dark:bg-white(/\d+)?', lambda m: 'bg-white' + (m.group(1) or ''), content)
    content = re.sub(r'border-[a-zA-Z0-9_/-]+ dark:border-white(/\d+)?', lambda m: 'border-white' + (m.group(1) or ''), content)
    content = re.sub(r'text-[a-zA-Z0-9_/-]+ dark:text-slate-\d+', lambda m: 'text-slate-' + m.group(0).split('slate-')[1], content)
    content = re.sub(r'hover:bg-[a-zA-Z0-9_/-]+ dark:hover:bg-white(/\d+)?', lambda m: 'hover:bg-white' + (m.group(1) or ''), content)

    # NOW APPLY fresh mappings
    
    # Backgrounds
    content = content.replace('bg-[#0f0f12]', 'bg-gray-50 dark:bg-[#0f0f12]')
    content = content.replace('bg-[#16161a]', 'bg-white dark:bg-[#16161a]')
    content = content.replace('bg-[#0D1117]', 'bg-gray-100 dark:bg-[#0D1117]')
    content = content.replace('bg-[#121214]', 'bg-white dark:bg-[#121214]')
    content = content.replace('bg-[#1A1A2E]', 'bg-white dark:bg-[#1A1A2E]')
    
    # Background opacities
    # Avoid replacing within already processed strings by checking if 'dark:' is nearby, but simpler:
    content = re.sub(r'(?<!dark:)bg-white/5(?!0)', 'bg-black/5 dark:bg-white/5', content)
    content = re.sub(r'(?<!dark:)bg-white/10(?!0)', 'bg-black/10 dark:bg-white/10', content)
    content = re.sub(r'(?<!dark:)bg-white/20(?!0)', 'bg-black/20 dark:bg-white/20', content)
    
    content = re.sub(r'(?<!dark:)bg-white/\[0.01\]', 'bg-black/[0.01] dark:bg-white/[0.01]', content)
    content = re.sub(r'(?<!dark:)bg-white/\[0.02\]', 'bg-black/[0.02] dark:bg-white/[0.02]', content)

    # Borders
    content = re.sub(r'(?<!dark:)border-white/5(?!0)', 'border-gray-200 dark:border-white/5', content)
    content = re.sub(r'(?<!dark:)border-white/10(?!0)', 'border-gray-300 dark:border-white/10', content)
    content = re.sub(r'(?<!dark:)border-white/20(?!0)', 'border-gray-400 dark:border-white/20', content)

    # Texts
    content = re.sub(r'(?<!dark:)text-slate-200', 'text-gray-900 dark:text-slate-200', content)
    content = re.sub(r'(?<!dark:)text-slate-300', 'text-gray-800 dark:text-slate-300', content)
    content = re.sub(r'(?<!dark:)text-slate-400', 'text-gray-700 dark:text-slate-400', content)
    content = re.sub(r'(?<!dark:)text-slate-500', 'text-gray-600 dark:text-slate-500', content)
    content = re.sub(r'(?<!dark:)text-slate-600', 'text-gray-500 dark:text-slate-600', content)
    content = re.sub(r'(?<!dark:)text-white/40', 'text-black/40 dark:text-white/40', content)
    
    # Hovers
    content = re.sub(r'(?<!dark:)hover:bg-white/5(?!0)', 'hover:bg-black/5 dark:hover:bg-white/5', content)
    content = re.sub(r'(?<!dark:)hover:bg-white/10(?!0)', 'hover:bg-black/10 dark:hover:bg-white/10', content)
    content = re.sub(r'(?<!dark:)hover:bg-white/20(?!0)', 'hover:bg-black/20 dark:hover:bg-white/20', content)
    content = re.sub(r'(?<!dark:)hover:text-white', 'hover:text-black dark:hover:text-white', content)
    
    # Specific edge cases manually observed in UserPortal.tsx
    # We had text-white as well in some places, but let's leave it unless we see text-white where it should be dark text
    content = re.sub(r'(?<!dark:)text-white(?!/)', 'text-gray-900 dark:text-white', content)
    
    # Fix nested replacements that might have occurred like text-gray-900 dark:text-gray-900 dark:text-white
    content = content.replace('text-gray-900 dark:text-gray-900 dark:text-white', 'text-gray-900 dark:text-white')

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fully Fixed {filepath}")

if __name__ == "__main__":
    for f in sys.argv[1:]:
        fix_file(f)
