const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/components/TrendsView.tsx',
  'src/components/StrategiesView.tsx',
  'src/components/JournalView.tsx',
  'src/components/CSVImporter.tsx',
  'src/components/AnalysisReport.tsx',
  'src/components/LayeredInsightsView.tsx',
  'src/components/DailyChatView.tsx',
  'src/App.tsx'
];

for (const file of filesToUpdate) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes("fetch('/api")) {
    // Add import statement for auth
    const importAuth = "import { auth } from '" + (file === 'src/App.tsx' ? './firebase' : '../firebase') + "';\n";
    if (!content.includes(importAuth)) {
        content = importAuth + content;
    }

    // Replace fetch('/api... with something that adds headers
    content = content.replace(/fetch\('(\/api[^']*)',\s*\{/g, `fetch('$1', {
        headers: {
          'Authorization': \`Bearer \${await auth.currentUser?.getIdToken()}\`,
          ...(() => {
             // We need to keep the original headers if any, but regular expression replacement is tricky to merge correctly.
             // Let's use a replacer function instead.
          })()
        },`);
  }
}
