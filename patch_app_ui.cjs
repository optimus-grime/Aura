const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the login logic
code = code.replace(/  useEffect\(\(\) => \{\n    getRedirectResult[\s\S]*?const login = async \(\) => \{[\s\S]*?try \{[\s\S]*?console\.log\("Starting login\.\.\."\);[\s\S]*?const provider = new GoogleAuthProvider\(\);[\s\S]*?provider\.setCustomParameters\(\{[\s\S]*?prompt: 'select_account'[\s\S]*?\}\);[\s\S]*?await signInWithRedirect\(auth, provider\);[\s\S]*?\} catch \(e: any\) \{[\s\S]*?console\.error\("Login redirect error:", e\);[\s\S]*?\}[\s\S]*?\};/, 
`  const login = async () => {
    try {
      console.log("Starting login...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // We use signInWithPopup as it is more reliable in PWA standalone mode than redirect
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful!", result.user?.email);
    } catch (e: any) {
      console.error("Login error:", e);
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/web-storage-unsupported' || e.code === 'auth/unauthorized-domain' || e.code === 'auth/cross-origin-cookies-blocked') {
        alert("Sign in failed. This is often caused by third-party cookie restrictions. Please click 'Open in New Tab' (square with arrow) to sign in, or enable cross-site tracking.");
      } else {
        alert('Login failed: ' + e.message + ' (Code: ' + e.code + ')');
      }
    }
  };`);
  
// We should also replace the getRedirectResult import
code = code.replace("import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';", 
  "import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';");

fs.writeFileSync('src/App.tsx', code);
