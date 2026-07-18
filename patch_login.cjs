const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';",
  "import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';");

code = code.replace(
  /\/\/ We use signInWithPopup.*?const result = await signInWithPopup\(auth, provider\);\s+console\.log\("Login successful!", result\.user\?\.email\);/s,
  "await signInWithRedirect(auth, provider);"
);

fs.writeFileSync('src/App.tsx', code);
