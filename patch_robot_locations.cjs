const fs = require('fs');

const files = [
  'src/components/DailyChatView.tsx',
  'src/components/JournalView.tsx',
  'src/components/StrategiesView.tsx',
  'src/components/PersonalityArchiveView.tsx',
  'src/components/LayeredInsightsView.tsx',
  'src/components/TrendsView.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Remove import
    code = code.replace(/import \{ RobotFace \} from '\.\/RobotFace';\n?/g, '');
    
    // Remove the injected headers and restore them
    code = code.replace(
      /<div className="flex items-center gap-4">\s*<div className="w-16 h-16 relative flex-shrink-0">\s*<RobotFace[^>]+>\s*<\/div>\s*<h2 className="text-2xl font-bold text-slate-900 hidden sm:block">Timeline Analysis<\/h2>\s*<\/div>/g,
      '<h2 className="text-2xl font-bold text-slate-900 hidden sm:block">Timeline Analysis</h2>'
    );
    code = code.replace(
      /<div className="flex items-center gap-4">\s*<div className="w-16 h-16 relative flex-shrink-0">\s*<RobotFace[^>]+>\s*<\/div>\s*<h2 className="text-2xl font-bold text-slate-900">([^<]+)<\/h2>\s*<\/div>/g,
      '<h2 className="text-2xl font-bold text-slate-900">$1</h2>'
    );
    code = code.replace(
      /<div className="flex items-center gap-4 mb-2">\s*<div className="w-16 h-16 relative flex-shrink-0">\s*<RobotFace[^>]+>\s*<\/div>\s*<h2 className="text-2xl font-bold text-slate-900">\s*([^<]+)\s*<\/h2>\s*<\/div>/g,
      '<h2 className="text-2xl font-bold text-slate-900 mb-2">$1</h2>'
    );
    code = code.replace(
      /<div className="flex items-center gap-4">\s*<div className="w-16 h-16 relative flex-shrink-0">\s*<RobotFace[^>]+>\s*<\/div>\s*<h3 className="text-xl font-bold text-slate-900">([^<]+)<\/h3>\s*<\/div>/g,
      '<h3 className="text-xl font-bold text-slate-900">$1</h3>'
    );
    
    fs.writeFileSync(file, code);
  }
});
