const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove from Voice Tab
code = code.replace(
  /\{\/\* Robot Head Visualization \*\/\}\s*<RobotFace\s*isAiSpeaking=\{isSpeaking\}\s*isUserSpeaking=\{userIsSpeaking\}\s*isConnected=\{isConnected\}\s*\/>/g,
  '{/* RobotFace moved to main header */}'
);

// 2. Remove from History Analyzer
code = code.replace(
  /<div className="flex items-center gap-4">\s*<div className="w-16 h-16 relative flex-shrink-0">\s*<RobotFace[^>]+>\s*<\/div>\s*<h3 className="text-xl font-bold text-slate-900">History Analyzer<\/h3>\s*<\/div>/g,
  '<h3 className="text-xl font-bold text-slate-900">History Analyzer</h3>'
);

// 3. Add to Main Header
code = code.replace(
  /<div className="w-full max-w-2xl text-center space-y-8 z-20 mt-4 mb-4">\s*<div className="space-y-8">\s*<h1 className="text-4xl md:text-5xl font-mono tracking-tighter font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">\s*Aura\s*<\/h1>\s*<p className="text-slate-600 text-base md:text-base max-w-md mx-auto font-sans">\s*Conversational Personality Analyzer. She listens, adapts, and learns about who you truly are through casual dialogue.\s*<\/p>\s*<\/div>/g,
  `<div className="w-full max-w-2xl text-center space-y-6 z-20 mt-4 mb-4">
        <div className="space-y-6 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-mono tracking-tighter font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
            Aura
          </h1>
          <div className="w-64 h-64 relative mb-4">
            <RobotFace 
              isAiSpeaking={isSpeaking} 
              isUserSpeaking={userIsSpeaking} 
              isConnected={isConnected} 
            />
          </div>
          <p className="text-slate-600 text-base md:text-base max-w-md mx-auto font-sans">
            Conversational Personality Analyzer. She listens, adapts, and learns about who you truly are through casual dialogue.
          </p>
        </div>`
);

// 4. Change Sign Out button
code = code.replace(
  /className="flex items-center space-x-3 text-base text-slate-800 hover:text-slate-900 px-3 py-1\.5 rounded-full bg-slate-100 hover:bg-slate-200 transition"/g,
  'className="flex items-center space-x-3 text-base text-white px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 transition shadow-md border border-blue-500/20 font-medium"'
);

fs.writeFileSync('src/App.tsx', code);
