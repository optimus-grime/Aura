const fs = require('fs');

const file = 'src/components/RobotFace.tsx';
let code = fs.readFileSync(file, 'utf8');

// Just print to see the exact structure
console.log(code.substring(0, 500));
