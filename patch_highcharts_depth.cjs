const fs = require('fs');

let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');
code = code.replace(
  /options3d: \{\s*enabled: true,\s*alpha: 15,\s*beta: 25,\s*depth: 300,\s*viewDistance: 50\s*\}/g,
  `options3d: {
                enabled: true,
                alpha: 15,
                beta: 30,
                depth: 400,
                viewDistance: 50
            }`
);
fs.writeFileSync('src/components/TrendsView.tsx', code);
