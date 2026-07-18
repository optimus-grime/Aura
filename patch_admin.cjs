const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("import admin from 'firebase-admin';", "import { initializeApp } from 'firebase-admin/app';\nimport { getAuth } from 'firebase-admin/auth';");
code = code.replace("admin.initializeApp({ projectId });", "initializeApp({ projectId });");
code = code.replace(/admin\.auth\(\)\.verifyIdToken/g, "getAuth().verifyIdToken");

fs.writeFileSync('server.ts', code);
