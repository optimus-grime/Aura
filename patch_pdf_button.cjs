const fs = require('fs');

let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');

// Update the PDF button at the top
code = code.replace(
  /className="flex items-center space-x-3 px-6 py-2 bg-white hover:bg-slate-50 text-slate-900 shadow-sm rounded-xl transition-colors text-base font-medium border border-slate-200 hover:border-slate-300 disabled:opacity-50"\s*title="Download PDF"/g,
  'className="flex items-center space-x-3 px-6 py-2 bg-blue-600 text-white shadow-md hover:bg-blue-700 rounded-xl transition-colors text-base font-medium border border-blue-500/20 disabled:opacity-50" title="Download PDF"'
);

fs.writeFileSync('src/components/TrendsView.tsx', code);
