const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('http-proxy-middleware')) {
  code = "import { createProxyMiddleware } from 'http-proxy-middleware';\n" + code;
}

code = code.replace("const PORT = 3000;", `const PORT = 3000;
  
  // Proxy Firebase Auth requests to the actual Firebase project domain
  // This solves third-party cookie issues on iOS/Safari in PWAs
  app.use('/__/auth', createProxyMiddleware({
    target: 'https://personal-hub-492517.firebaseapp.com',
    changeOrigin: true,
  }));
`);

fs.writeFileSync('server.ts', code);
