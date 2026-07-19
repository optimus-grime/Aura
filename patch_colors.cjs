const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  // Main backgrounds
  code = code.replace(/bg-slate-950/g, "bg-gray-50");
  code = code.replace(/bg-gray-950/g, "bg-gray-50");
  code = code.replace(/text-slate-50\b/g, "text-slate-900");
  
  // Cards and containers
  code = code.replace(/bg-slate-900\/80/g, "bg-white");
  code = code.replace(/bg-slate-900\/50/g, "bg-white/80");
  code = code.replace(/bg-gray-900\/50/g, "bg-white");
  code = code.replace(/bg-slate-900/g, "bg-white");
  code = code.replace(/bg-gray-900/g, "bg-white");
  code = code.replace(/bg-slate-800\/50/g, "bg-slate-100");
  code = code.replace(/bg-slate-800/g, "bg-slate-100");
  code = code.replace(/bg-gray-800/g, "bg-slate-100");
  
  // Text colors
  code = code.replace(/text-slate-200/g, "text-slate-800");
  code = code.replace(/text-slate-300/g, "text-slate-700");
  code = code.replace(/text-slate-400/g, "text-slate-600");
  code = code.replace(/text-slate-100/g, "text-slate-900");
  
  // Borders
  code = code.replace(/border-slate-800/g, "border-slate-200");
  code = code.replace(/border-slate-700\/50/g, "border-slate-200");
  code = code.replace(/border-slate-700\/30/g, "border-slate-200");
  code = code.replace(/border-slate-700/g, "border-slate-200");
  code = code.replace(/border-gray-800/g, "border-slate-200");
  code = code.replace(/border-slate-600/g, "border-slate-300");
  
  // Accents
  code = code.replace(/cyan-400/g, "blue-600");
  code = code.replace(/cyan-500/g, "blue-600");
  code = code.replace(/cyan-900/g, "blue-200");
  code = code.replace(/text-rose-400/g, "text-rose-600");
  code = code.replace(/bg-rose-400\/10/g, "bg-rose-50");
  code = code.replace(/bg-rose-500\/10/g, "bg-rose-50");
  code = code.replace(/border-rose-500\/20/g, "border-rose-200");

  code = code.replace(/text-emerald-400/g, "text-emerald-600");
  code = code.replace(/bg-emerald-400/g, "bg-emerald-500");

  code = code.replace(/text-white/g, "text-slate-900"); // for buttons usually

  // Hover states
  code = code.replace(/hover:text-white/g, "hover:text-slate-900");
  code = code.replace(/hover:bg-slate-800/g, "hover:bg-slate-100");
  code = code.replace(/hover:bg-slate-700\/50/g, "hover:bg-slate-200");
  code = code.replace(/hover:bg-slate-700/g, "hover:bg-slate-200");

  // Fix buttons that might be affected by text-white -> text-slate-900
  // "bg-blue-600 text-slate-900" is bad contrast. We want "bg-blue-600 text-white".
  code = code.replace(/bg-blue-600 text-slate-900/g, "bg-blue-600 text-white");
  code = code.replace(/bg-blue-600 font-medium hover:bg-blue-600 transition-colors/g, "bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors");
  code = code.replace(/text-slate-950 bg-blue-600/g, "text-white bg-blue-600");
  code = code.replace(/bg-blue-600 text-slate-950/g, "bg-blue-600 text-white");

  // Typography scaling (base font size 16px min, line heights, bold headers)
  code = code.replace(/text-sm/g, "text-base"); // bump base text sizes
  code = code.replace(/text-xs/g, "text-sm");
  
  // Padding & Spacing (Increase padding)
  // "p-4" -> "p-6" or "p-8", "p-6" -> "p-8"
  // For safety, let's just do it in specific cases via regex
  code = code.replace(/\bp-4\b/g, "p-6");
  code = code.replace(/\bp-6\b/g, "p-8");
  code = code.replace(/\bpx-4\b/g, "px-6");
  code = code.replace(/\bpy-4\b/g, "py-6");
  code = code.replace(/\bspace-y-4\b/g, "space-y-6");
  code = code.replace(/\bspace-y-6\b/g, "space-y-8");
  code = code.replace(/\bspace-x-2\b/g, "space-x-3");

  // Special case for overlay background which was slate-950/60
  code = code.replace(/bg-gray-50\/60/g, "bg-slate-900/40");
  code = code.replace(/bg-gray-50\/80/g, "bg-slate-900/60");

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

