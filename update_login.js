const fs = require('fs');
const path = '/Users/vikas/.gemini/antigravity-ide/scratch/kravy-electron-lite/src/pages/Login.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['min-h-screen bg-[#0a0a0a]', 'min-h-screen bg-gray-50 dark:bg-[#0a0a0a]'],
  ['border-white/10', 'border-gray-200 dark:border-white/10'],
  ['border-white/5', 'border-gray-200 dark:border-white/5'],
  ['text-white ', 'text-gray-900 dark:text-white '],
  ['text-white/50', 'text-gray-500 dark:text-white/50'],
  ['text-white/30', 'text-gray-400 dark:text-white/30'],
  ['text-white/40', 'text-gray-500 dark:text-white/40'],
  ['text-white/20', 'text-gray-400 dark:text-white/20'],
  ['text-white/5', 'text-gray-300 dark:text-white/5'],
  ['placeholder:text-white/20', 'placeholder:text-gray-400 dark:placeholder:text-white/20'],
  ['focus:bg-white dark:bg-[#1A1A2E]/10', 'focus:bg-gray-50 dark:focus:bg-[#1A1A2E]/10'],
  ['bg-emerald-500/5', 'bg-emerald-50 dark:bg-emerald-500/5'],
  ['border-emerald-500/20', 'border-emerald-200 dark:border-emerald-500/20'],
  ['bg-blue-500/5', 'bg-blue-50 dark:bg-blue-500/5'],
  ['border-blue-500/20', 'border-blue-200 dark:border-blue-500/20'],
  ['text-white"', 'text-gray-900 dark:text-white"'],
];

replacements.forEach(([from, to]) => {
  content = content.split(from).join(to);
});

fs.writeFileSync(path, content);
console.log('Done!');
