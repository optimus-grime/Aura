const fs = require('fs');

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
    const importAuth = "import { auth } from '" + (file === 'src/App.tsx' ? './firebase' : '../firebase') + "';\n";
    if (!content.includes(importAuth) && !content.includes("import { auth }")) {
        content = importAuth + content;
    }

    // A better approach is to wrap the fetch options.
    // Replace: fetch('/api/xxx', {
    // With: fetch('/api/xxx', { headers: { 'Authorization': \`Bearer \${await auth.currentUser?.getIdToken()}\`, ... },
    // Since some have headers: { 'Content-Type': 'application/json' }, we can just regex replace `headers: {`
    
    // Actually, all of these use `headers: { 'Content-Type': 'application/json' }`
    content = content.replace(/headers:\s*\{/g, `headers: {
        'Authorization': \`Bearer \${await auth.currentUser?.getIdToken()}\`,`);

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
