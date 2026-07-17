const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const __filename = fileURLToPath\(import.meta.url\);\nconst __dirname = path.dirname\(__filename\);\nlet projectId = 'personal-hub-492517';\ntry {\n  const configContent = fs_node.readFileSync\(path.join\(__dirname, 'firebase-applet-config.json'\), 'utf-8'\);/g, 
`let projectId = 'personal-hub-492517';
try {
  const configContent = fs_node.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8');`);

fs.writeFileSync('server.ts', code);
