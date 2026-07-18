const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');

code = code.replace("const app = initializeApp(firebaseConfig);", 
`
// Use the current host as authDomain to route through the express proxy
// This avoids third-party cookie blocking on iOS/PWAs
const config = {
  ...firebaseConfig,
  authDomain: typeof window !== 'undefined' ? window.location.host : firebaseConfig.authDomain
};
const app = initializeApp(config);
`);

fs.writeFileSync('src/firebase.ts', code);
