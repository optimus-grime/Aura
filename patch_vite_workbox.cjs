const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

code = code.replace("manifest: {", 
`workbox: {
          maximumFileSizeToCacheInBytes: 5000000 // 5MB
        },
        manifest: {`);

fs.writeFileSync('vite.config.ts', code);
