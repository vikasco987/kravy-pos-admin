import sys
import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacements dictionary (only if not already followed by a dark class)
    replacements = {
        r'bg-white(?!\s+dark:bg-)': 'bg-white dark:bg-[#1A1A2E]',
        r'bg-gray-50(?!\s+dark:bg-)': 'bg-gray-50 dark:bg-[#0F0F23]',
        r'bg-gray-100(?!\s+dark:bg-)': 'bg-gray-100 dark:bg-gray-800',
        r'text-gray-900(?!\s+dark:text-)': 'text-gray-900 dark:text-white',
        r'text-gray-800(?!\s+dark:text-)': 'text-gray-800 dark:text-gray-200',
        r'text-gray-700(?!\s+dark:text-)': 'text-gray-700 dark:text-gray-300',
        r'text-gray-600(?!\s+dark:text-)': 'text-gray-600 dark:text-gray-400',
        r'text-gray-500(?!\s+dark:text-)': 'text-gray-500 dark:text-gray-400',
        r'border-gray-200(?!\s+dark:border-)': 'border-gray-200 dark:border-gray-800',
        r'border-gray-100(?!\s+dark:border-)': 'border-gray-100 dark:border-gray-800',
        r'border-gray-300(?!\s+dark:border-)': 'border-gray-300 dark:border-gray-700',
    }

    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)

    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

if __name__ == "__main__":
    for f in sys.argv[1:]:
        update_file(f)
