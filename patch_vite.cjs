const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

code = "import { VitePWA } from 'vite-plugin-pwa';\n" + code;
code = code.replace("plugins: [react(), tailwindcss()],", 
`plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'AI Insights App',
          short_name: 'Insights',
          description: 'Personalized AI journaling and analysis',
          theme_color: '#0f172a',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],`);

fs.writeFileSync('vite.config.ts', code);
