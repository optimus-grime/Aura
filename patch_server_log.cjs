const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("console.error('Error verifying Firebase token:', error.message, error.code, error);",
  "console.error('Error verifying Firebase token:', error.message, error.code, error); fs_node.appendFileSync('auth_error.log', new Date().toISOString() + ' ' + error.message + '\\n');");

fs.writeFileSync('server.ts', code);
