const fs = require('fs');

// App.tsx
let codeApp = fs.readFileSync('src/App.tsx', 'utf8');
codeApp = codeApp.replace(
  /<h3 className="text-lg font-medium text-slate-800">History Analyzer<\/h3>/g,
  `<div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative flex-shrink-0">
                    <RobotFace isAiSpeaking={false} isUserSpeaking={false} isConnected={true} size="sm" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">History Analyzer</h3>
                </div>`
);
fs.writeFileSync('src/App.tsx', codeApp);

// DailyChatView.tsx
let codeDaily = fs.readFileSync('src/components/DailyChatView.tsx', 'utf8');
codeDaily = codeDaily.replace(
  /<h2 className="text-2xl font-medium text-slate-800 flex items-center gap-3">\s*<MessageCircle className="w-6 h-6 text-blue-600" \/>\s*Daily Check-In\s*<\/h2>/g,
  `<div className="flex items-center gap-4">
                 <div className="w-16 h-16 relative flex-shrink-0">
                   <RobotFace isAiSpeaking={false} isUserSpeaking={false} isConnected={true} size="sm" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900">Daily Check-In</h2>
              </div>`
);
fs.writeFileSync('src/components/DailyChatView.tsx', codeDaily);

