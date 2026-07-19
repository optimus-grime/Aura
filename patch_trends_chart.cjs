const fs = require('fs');

let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');

// 1. Chart Background to White & Update Options for Highcharts
code = code.replace(
  /backgroundColor: 'transparent'/g,
  "backgroundColor: '#ffffff'"
);

// Decrease X-axis labels by 75%. If we have many points, we can use tickPixelInterval or step.
code = code.replace(
  /gridLineColor: '#e2e8f0',\s*labels: \{ style: \{ color: '#64748b' \} \}/g,
  `gridLineColor: '#f1f5f9',
            labels: { 
               style: { color: '#64748b', fontWeight: '500' },
               step: 4
            }`
);

// PlotOptions: increase fill opacity and add depth/shadows to area
code = code.replace(
  /plotOptions: \{\s*area: \{\s*depth: 50,\s*marker: \{ enabled: false \},\s*states: \{\s*inactive: \{\s*opacity: 0\.1\s*\}\s*\}\s*\}\s*\}/g,
  `plotOptions: {
            area: {
                depth: 120, // deeper ribbons
                marker: { enabled: false },
                lineWidth: 2,
                states: {
                    inactive: {
                        opacity: 0.15
                    },
                    hover: {
                        brightness: 0.1
                    }
                }
            }
        }`
);

// High saturation ribbons: fillOpacity: 0.6 -> 0.95
code = code.replace(/fillOpacity: 0\.6/g, "fillOpacity: 0.9, edgeWidth: 1, edgeColor: 'rgba(0,0,0,0.1)'");

// 2. Toggles & Buttons
// Toggle buttons Timeline vs Compare
code = code.replace(
  /className=\{`px-6 py-2 rounded-lg text-base font-medium transition-colors \$\{viewMode === 'timeline' \? 'bg-blue-600\/20 text-blue-600 shadow-inner' : 'text-slate-500 hover:text-slate-800'\}`\}/g,
  "className={`px-6 py-2 rounded-lg text-base font-medium transition-all ${viewMode === 'timeline' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}"
);
code = code.replace(
  /className=\{`px-6 py-2 rounded-lg text-base font-medium transition-colors \$\{viewMode === 'comparison' \? 'bg-blue-600\/20 text-blue-600 shadow-inner' : 'text-slate-500 hover:text-slate-800'\}`\}/g,
  "className={`px-6 py-2 rounded-lg text-base font-medium transition-all ${viewMode === 'comparison' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}"
);

// Fix Trait filters from text to bold fill
// Original: 
// { id: 'openness', label: 'Openness', color: 'border-[#06b6d4] text-[#06b6d4]' }
// We can use the Highcharts colors in the style directly.
code = code.replace(
  /className=\{`px-3 py-1\.5 rounded-full rounded-r-none text-sm font-medium transition-all \$\{\n\s*selectedTraits\.includes\(t\.id\) \n\s*\? `\$\{t\.color\.replace\('border-', 'bg-slate-100 border-r border-'\)\} text-slate-900`\n\s*: 'text-slate-600 hover:text-slate-800'\n\s*\}`\}/g,
  "className={`px-3 py-1.5 rounded-full rounded-r-none text-sm font-medium transition-all ${selectedTraits.includes(t.id) ? 'text-white border-r shadow-md' : 'text-slate-600 hover:text-slate-800 bg-white border-r border-slate-200'}`} style={selectedTraits.includes(t.id) ? { backgroundColor: t.color.match(/#([a-fA-F0-9]{6})/)[0], borderColor: t.color.match(/#([a-fA-F0-9]{6})/)[0] } : {}}"
);

// Ensure trait pills don't have bg-white/40 when inactive wrapper, it should just be clean
code = code.replace(/className="relative flex items-center bg-white\/40 rounded-full border border-slate-200 pr-1"/g, 'className="relative flex items-center bg-white rounded-full border border-slate-200 pr-1 shadow-sm"');


// PDF Icon color (FileText) - currently text-indigo-400 / hover:bg-indigo-500/10
code = code.replace(/text-indigo-400/g, 'text-blue-600');
code = code.replace(/hover:bg-indigo-500\/10/g, 'hover:bg-blue-600/10');

// "View" button
code = code.replace(/bg-blue-600\/10 hover:bg-blue-600\/20 text-blue-600/g, 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-blue-700/20');

// Ensure main chart container has white background
code = code.replace(
  /<div className="h-\[300px\] w-full relative">/g,
  '<div className="h-[400px] w-full relative bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-2">'
);


fs.writeFileSync('src/components/TrendsView.tsx', code);
