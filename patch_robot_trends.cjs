const fs = require('fs');

let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');
code = code.replace(
  '<div className="flex justify-between items-center">',
  `<div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 relative flex-shrink-0">
            <RobotFace isAiSpeaking={false} isUserSpeaking={false} isConnected={true} size="sm" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 hidden sm:block">Timeline Analysis</h2>
        </div>
        <div className="flex bg-white/80 p-1 rounded-xl border border-slate-200/80 w-fit">`
);

// We need to remove the extra `<div className="flex bg-white/80` because it's replaced
code = code.replace(
  '<div className="flex bg-white/80 p-1 rounded-xl border border-slate-200/80 w-fit">',
  ''
);

fs.writeFileSync('src/components/TrendsView.tsx', code);
