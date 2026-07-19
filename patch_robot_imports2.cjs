const fs = require('fs');

function addRobotToComponent(filepath, headerTitleRegex, replacement) {
  let code = fs.readFileSync(filepath, 'utf8');
  if (!code.includes("import { RobotFace }")) {
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
  /<h2 className="text-2xl font-medium text-slate-900 flex items-center gap-3">\s*<PenTool className="w-6 h-6 text-blue-600" \/>\s*Tailored Journaling\s*<\/h2>/g,
  `<div className="flex items-center gap-4">
                <div className="w-16 h-16 relative flex-shrink-0">
                  <RobotFace isAiSpeaking={false} isUserSpeaking={false} isConnected={true} size="sm" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Tailored Journaling</h2>
              </div>`
);

// 2. StrategiesView.tsx
let strat = fs.readFileSync('src/components/StrategiesView.tsx', 'utf8');
// Let's check what is in StrategiesView
