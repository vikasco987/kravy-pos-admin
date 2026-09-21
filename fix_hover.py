import sys

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix hover bugs
    content = content.replace('hover:bg-black/10 dark:bg-white/10', 'hover:bg-black/10 dark:hover:bg-white/10')
    content = content.replace('hover:bg-black/5 dark:bg-white/5', 'hover:bg-black/5 dark:hover:bg-white/5')
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed hovers {filepath}")

if __name__ == "__main__":
    for f in sys.argv[1:]:
        fix_file(f)
