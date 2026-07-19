const fs = require('fs');
let code = fs.readFileSync('src/components/DailyChatView.tsx', 'utf8');

if (!code.includes("import { RobotFace }")) {
  code = code.replace("import React,", "import { RobotFace } from './RobotFace';\nimport React,");
}
fs.writeFileSync('src/components/DailyChatView.tsx', code);
