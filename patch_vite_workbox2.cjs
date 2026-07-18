const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

code = code.replace(`workbox: {
          maximumFileSizeToCacheInBytes: 5000000 // 5MB
        },`, `workbox: {
          maximumFileSizeToCacheInBytes: 5000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        },`);

fs.writeFileSync('vite.config.ts', code);
