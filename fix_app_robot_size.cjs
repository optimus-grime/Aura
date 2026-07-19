const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<div className="w-64 h-64 relative mb-4">/g,
  '<div className="relative mb-6">'
);

fs.writeFileSync('src/App.tsx', code);
