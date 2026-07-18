const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/auth\.currentUser\?\.getIdToken\(\)/g, "user?.getIdToken()");
fs.writeFileSync('src/App.tsx', code);
