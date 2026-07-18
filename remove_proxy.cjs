const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const targetStr = `  // Proxy Firebase Auth requests to the actual Firebase project domain
  // This solves third-party cookie issues on iOS/Safari in PWAs
  app.use('/__/auth', createProxyMiddleware({
    target: 'https://personal-hub-492517.firebaseapp.com',
    changeOrigin: true,
  }));`;

code = code.replace(targetStr, '');

fs.writeFileSync('server.ts', code);
