const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("console.error('Error verifying Firebase token:', error);",
  "console.error('Error verifying Firebase token:', error.message, error.code, error);");

fs.writeFileSync('server.ts', code);
