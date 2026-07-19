const fs = require('fs');
let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');

code = code.replace(
"if (typeof Highcharts === 'object') {",
"console.log('highcharts3d export is:', typeof highcharts3d, highcharts3d);\nif (typeof highcharts3d === 'function') {"
);

fs.writeFileSync('src/components/TrendsView.tsx', code);
