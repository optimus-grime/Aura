const fs = require('fs');
let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');
console.log(code.includes('rotateZ(-45deg)'));
