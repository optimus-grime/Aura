const fs = require('fs');
let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');

code = code.replace(/stroke="#374151"/g, 'stroke="#e2e8f0"');
code = code.replace(/stroke="#9ca3af"/g, 'stroke="#64748b"');
code = code.replace(/stroke: '#475569'/g, "stroke: '#cbd5e1'");

fs.writeFileSync('src/components/TrendsView.tsx', code);
