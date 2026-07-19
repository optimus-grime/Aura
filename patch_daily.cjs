const fs = require('fs');
let code = fs.readFileSync('src/components/DailyChatView.tsx', 'utf8');

// Remove import
code = code.replace(/import \{ RobotFace \} from '\.\/RobotFace';\n?/g, '');

// Remove face block
code = code.replace(
  /\s*\{\/\* Face \*\/\}\s*<div className="flex justify-center -mt-4 mb-2 scale-90">\s*<RobotFace\s*isAiSpeaking=\{isChatLoading\}\s*isUserSpeaking=\{chatInput\.trim\(\)\.length > 0\}\s*isConnected=\{true\}\s*exaggerated=\{true\}\s*\/>\s*<\/div>/g,
  ''
);

fs.writeFileSync('src/components/DailyChatView.tsx', code);
