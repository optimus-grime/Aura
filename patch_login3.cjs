const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(`  const login = async () => {
    try {
      console.log("Starting login...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful!", result.user.email);
    } catch (e: any) {
      console.error("Login error:", e);
      alert('Login failed: ' + e.code + " - " + e.message);
    }
  };`, `  const login = async () => {
    try {
      console.log("Starting login...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful!", result.user.email);
    } catch (e: any) {
      console.error("Login error:", e);
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/web-storage-unsupported' || e.code === 'auth/unauthorized-domain' || e.code === 'auth/cross-origin-cookies-blocked') {
        alert("Sign in failed. This is often caused by third-party cookie restrictions when running in the AI Studio preview. Please click the 'Open in New Tab' icon (the square with an arrow) in the top right corner of the preview window to sign in successfully.");
      } else {
        alert('Login failed: ' + e.message + ' (Code: ' + e.code + ')');
      }
    }
  };`);
fs.writeFileSync('src/App.tsx', code);
