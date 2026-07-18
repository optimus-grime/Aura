const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "  useEffect(() => {\n    const unsub = onAuthStateChanged(auth, u => {",
  "  useEffect(() => {\n    getRedirectResult(auth).catch(e => console.error('Redirect result error:', e));\n    const unsub = onAuthStateChanged(auth, u => {"
);

fs.writeFileSync('src/App.tsx', code);
