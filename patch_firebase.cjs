const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');

code = code.replace(
  "authDomain: typeof window !== 'undefined' ? window.location.host : firebaseConfig.authDomain",
  "authDomain: firebaseConfig.authDomain"
);

fs.writeFileSync('src/firebase.ts', code);
