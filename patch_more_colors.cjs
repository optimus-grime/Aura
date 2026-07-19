const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  // Fix buttons contrast
  code = code.replace(/bg-cyan-600 text-slate-900/g, "bg-blue-600 text-white");
  code = code.replace(/bg-cyan-600/g, "bg-blue-600");

  code = code.replace(/bg-slate-900\/60/g, "bg-white");
  code = code.replace(/bg-slate-900\/80/g, "bg-white");
  code = code.replace(/bg-gray-900\/50/g, "bg-white");
  code = code.replace(/bg-gray-700\/80/g, "bg-slate-200");
  code = code.replace(/text-gray-400/g, "text-slate-500");
  code = code.replace(/bg-gray-700/g, "bg-slate-200");
  code = code.replace(/text-gray-500/g, "text-slate-400");
  code = code.replace(/border-gray-700/g, "border-slate-200");

  code = code.replace(/text-slate-800/g, "text-slate-900");
  code = code.replace(/text-slate-700/g, "text-slate-800");
  
  // Specific backgrounds
  code = code.replace(/backgroundColor: '#0f172a'/g, "backgroundColor: '#ffffff'");

  fs.writeFileSync(filepath, code);
}

const files = [
  'src/App.tsx',
  'src/components/AnalysisReport.tsx',
  'src/components/CSVImporter.tsx',
  'src/components/DailyChatView.tsx',
  'src/components/JournalView.tsx',
  'src/components/LayeredInsightsView.tsx',
  'src/components/PersonalityArchiveView.tsx',
  'src/components/StrategiesView.tsx',
  'src/components/TrendsView.tsx'
];

files.forEach(patchFile);

