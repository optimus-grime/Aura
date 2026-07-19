const fs = require('fs');

let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');

// The main tables/cards
code = code.replace(/className="mt-6 bg-slate-100 p-8 rounded-xl border border-slate-200"/g, 'className="mt-6 bg-white shadow-sm p-8 rounded-xl border border-slate-200"');
code = code.replace(/className="mt-6 flex items-start space-x-3 bg-slate-100 p-8 rounded-xl border border-slate-200"/g, 'className="mt-6 flex items-start space-x-3 bg-white shadow-sm p-8 rounded-xl border border-slate-200"');

// Comparison details cards
code = code.replace(/className="p-8 bg-slate-100 rounded-xl border border-slate-200 flex flex-col"/g, 'className="p-8 bg-white shadow-sm rounded-xl border border-slate-200 flex flex-col"');

// Comparison summary container
code = code.replace(/className="w-full bg-slate-100\/80 rounded-xl p-5 border border-slate-200 mt-4 text-left"/g, 'className="w-full bg-white shadow-sm rounded-xl p-6 border border-slate-200 mt-4 text-left"');

// Comparison internal elements using bg-white/80 inside the summary
code = code.replace(/className="bg-white\/80 p-3 rounded-lg border border-slate-200"/g, 'className="bg-slate-50 p-4 rounded-lg border border-slate-200"');

// "Delete all" button
code = code.replace(/className="flex items-center space-x-3 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900/g, 'className="flex items-center space-x-3 px-6 py-2 bg-white hover:bg-slate-50 text-slate-900 shadow-sm');

// "Analyze Differences" button
code = code.replace(/className="px-6 py-2 rounded-full bg-slate-100 text-blue-600 font-medium hover:bg-slate-200/g, 'className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm');

// Comparison drop down background
code = code.replace(/className="bg-slate-100 text-slate-900/g, 'className="bg-white shadow-sm text-slate-900');

// "Sentiment Over Time" LineChart container
code = code.replace(/className="h-\[250px\] w-full relative"/g, 'className="h-[300px] w-full relative bg-white border border-slate-200 rounded-xl shadow-sm p-4 mt-2"');

fs.writeFileSync('src/components/TrendsView.tsx', code);
