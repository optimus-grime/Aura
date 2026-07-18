const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("return res.status(403).json({ error: 'Unauthorized: Invalid token' });", "return res.status(403).json({ error: 'Unauthorized: Invalid token - ' + error.message });");

fs.writeFileSync('server.ts', code);
