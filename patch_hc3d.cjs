const fs = require('fs');
let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');

code = code.replace(
  "console.log('highcharts3d export is:', typeof highcharts3d, highcharts3d);\nif (typeof highcharts3d === 'function') {\n    highcharts3d(Highcharts);\n}",
  `
if (typeof highcharts3d === 'function') {
    highcharts3d(Highcharts);
} else if (highcharts3d && typeof highcharts3d.default === 'function') {
    highcharts3d.default(Highcharts);
}
  `
);
fs.writeFileSync('src/components/TrendsView.tsx', code);
