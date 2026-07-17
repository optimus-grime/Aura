const fs = require('fs');
let code = fs.readFileSync('src/hooks/useLiveAudio.ts', 'utf8');

if (!code.includes("import { auth }")) {
  code = "import { auth } from '../firebase';\n" + code;
}

code = code.replace(/const wsUrl = \`\$\{protocol\}\/\/\$\{window\.location\.host\}\/live\`;/g, 
"const token = await auth.currentUser?.getIdToken();\n      const wsUrl = \`\$\{protocol\}//\$\{window.location.host\}/live?token=\$\{token\}\`;");

fs.writeFileSync('src/hooks/useLiveAudio.ts', code);
