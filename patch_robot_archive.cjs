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

// 1. PersonalityArchiveView.tsx
addRobotToComponent(
  'src/components/PersonalityArchiveView.tsx',
  /<h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-400 mb-2">\s*Aura Evolution\s*<\/h2>/g,
  `<div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 relative flex-shrink-0">
            <RobotFace isAiSpeaking={false} isUserSpeaking={false} isConnected={true} size="sm" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Aura Evolution
          </h2>
        </div>`
);

// 2. LayeredInsightsView.tsx
let layered = fs.readFileSync('src/components/LayeredInsightsView.tsx', 'utf8');
layered = layered.replace(
  /<h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-400">\s*Layered Profile Insights\s*<\/h2>/g,
  `<div className="flex items-center gap-4">
            <div className="w-16 h-16 relative flex-shrink-0">
              <RobotFace isAiSpeaking={false} isUserSpeaking={false} isConnected={true} size="sm" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Layered Profile Insights
            </h2>
          </div>`
);
if (!layered.includes("import { RobotFace }")) {
    const lastImportIndex = layered.lastIndexOf('import ');
    const endOfLastImport = layered.indexOf('\n', lastImportIndex);
    layered = layered.substring(0, endOfLastImport) + "\nimport { RobotFace } from './RobotFace';" + layered.substring(endOfLastImport);
}
fs.writeFileSync('src/components/LayeredInsightsView.tsx', layered);

