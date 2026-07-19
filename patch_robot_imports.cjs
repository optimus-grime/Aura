const fs = require('fs');

function addRobotToComponent(filepath, headerTitleRegex, replacement) {
  let code = fs.readFileSync(filepath, 'utf8');
  if (!code.includes("import { RobotFace }")) {
    // Add import after last import
    const lastImportIndex = code.lastIndexOf('import ');
    const endOfLastImport = code.indexOf('\n', lastImportIndex);
    code = code.substring(0, endOfLastImport) + "\nimport { RobotFace } from './RobotFace';" + code.substring(endOfLastImport);
  }
  
  code = code.replace(headerTitleRegex, replacement);
  fs.writeFileSync(filepath, code);
}

// 1. JournalView.tsx
addRobotToComponent(
  'src/components/JournalView.tsx',
  /<h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">\s*<BookOpen className="w-5 h-5 text-blue-600" \/>\s*Journaling & Self-Reflection\s*<\/h3>/g,
  `<div className="flex items-center gap-4">
                <div className="w-16 h-16 relative flex-shrink-0">
                  <RobotFace isAiSpeaking={false} isUserSpeaking={false} isConnected={true} size="sm" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Guided Reflection</h3>
              </div>`
);

// 2. StrategiesView.tsx (Action Plan)
addRobotToComponent(
  'src/components/StrategiesView.tsx',
  /<h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">\s*<Compass className="w-5 h-5 text-blue-600" \/>\s*Action Strategies\s*<\/h3>/g,
  `<div className="flex items-center gap-4">
                <div className="w-16 h-16 relative flex-shrink-0">
                  <RobotFace isAiSpeaking={false} isUserSpeaking={false} isConnected={true} size="sm" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Action Plan</h3>
              </div>`
);

// 3. TrendsView.tsx (Timeline)
addRobotToComponent(
  'src/components/TrendsView.tsx',
  /<h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">\s*<TrendingUp className="w-6 h-6 text-blue-600" \/>\s*Personality Timeline\s*<\/h2>/g,
  `<div className="flex items-center gap-4">
                <div className="w-16 h-16 relative flex-shrink-0">
                  <RobotFace isAiSpeaking={false} isUserSpeaking={false} isConnected={true} size="sm" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Timeline Analysis</h2>
              </div>`
);

