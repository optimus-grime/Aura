const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';",
  "import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';");

code = code.replace(`  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log("Login successful!", result.user.email);
      }
    }).catch((e: any) => {
      console.error("Login error:", e);
      if (e.code === 'auth/unauthorized-domain') {
        alert("Sign in failed. You need to add this app's URL to the Authorized Domains in the Firebase Console (Authentication > Settings > Authorized domains).");
      } else if (e.code !== 'auth/popup-closed-by-user') {
        alert('Login failed: ' + e.message + ' (Code: ' + e.code + ')');
      }
    });
  }, []);

  const login = async () => {
    try {
      console.log("Starting login...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      // Use signInWithRedirect instead of popup for better PWA compatibility
      await signInWithRedirect(auth, provider);
    } catch (e: any) {
      console.error("Login error:", e);
      alert('Login failed: ' + e.message + ' (Code: ' + e.code + ')');
    }
  };`, `  const login = async () => {
    try {
      console.log("Starting login...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
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

fs.writeFileSync('src/App.tsx', code);
