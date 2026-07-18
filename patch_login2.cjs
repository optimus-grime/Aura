const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(`  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error(e);
      alert('Login failed: ' + e.message);
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
      alert('Login failed: ' + e.code + " - " + e.message);
    }
  };`);
fs.writeFileSync('src/App.tsx', code);
