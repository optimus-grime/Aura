const fs = require('fs');

let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');

// Add Highcharts imports
const importTarget = "import { RobotFace } from './RobotFace';";
if (!code.includes("import Highcharts")) {
    const highchartsImports = `import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import highcharts3d from 'highcharts/highcharts-3d';

if (typeof Highcharts === 'object') {
    highcharts3d(Highcharts);
}
`;
    code = code.replace(importTarget, importTarget + "\n" + highchartsImports);
}

// Build the options generator inside the component
// The component is `export function TrendsView`
// Let's add the options right before `return (`
const optionsGenerator = `
  const highchartsOptions = useMemo(() => {
    const traitColors: Record<string, string> = {
      openness: '#06b6d4',
      conscientiousness: '#8b5cf6',
      extraversion: '#f59e0b',
      agreeableness: '#10b981',
      neuroticism: '#ef4444'
    };

    return {
        chart: {
            type: 'area',
            options3d: {
                enabled: true,
                alpha: 15,
                beta: 25,
                depth: 300,
                viewDistance: 50
            },
            backgroundColor: 'transparent'
        },
        title: { text: null },
        xAxis: {
            categories: chartData.map(d => d.date + ' ' + d.time),
            gridLineColor: '#e2e8f0',
            labels: { style: { color: '#64748b' } }
        },
        yAxis: {
            min: 0,
            max: 100,
            title: { text: null },
            gridLineColor: '#e2e8f0',
            labels: { style: { color: '#64748b' } }
        },
        plotOptions: {
            area: {
                depth: 50,
                marker: { enabled: false },
                states: {
                    inactive: {
                        opacity: 0.1
                    }
                }
            }
        },
        legend: {
           itemStyle: { color: '#334155' }
        },
        tooltip: {
            shared: true
        },
        series: [
            {
                name: 'Openness',
                data: chartData.map(d => d.openness),
                color: traitColors.openness,
                visible: selectedTraits.includes('openness'),
                fillOpacity: 0.6
            },
            {
                name: 'Conscientiousness',
                data: chartData.map(d => d.conscientiousness),
                color: traitColors.conscientiousness,
                visible: selectedTraits.includes('conscientiousness'),
                fillOpacity: 0.6
            },
            {
                name: 'Extraversion',
                data: chartData.map(d => d.extraversion),
                color: traitColors.extraversion,
                visible: selectedTraits.includes('extraversion'),
                fillOpacity: 0.6
            },
            {
                name: 'Agreeableness',
                data: chartData.map(d => d.agreeableness),
                color: traitColors.agreeableness,
                visible: selectedTraits.includes('agreeableness'),
                fillOpacity: 0.6
            },
            {
                name: 'Neuroticism',
                data: chartData.map(d => d.neuroticism),
                color: traitColors.neuroticism,
                visible: selectedTraits.includes('neuroticism'),
                fillOpacity: 0.6
            }
        ],
        credits: { enabled: false }
    };
  }, [chartData, selectedTraits]);

  return (`;

code = code.replace(/return \(/g, (match, offset) => {
    // only replace the FIRST return ( which is for the component, wait there are early returns?
    return match;
});

// Since there are multiple early returns, I should find the `return (` at the end
// "return (" followed by "<motion.div"
code = code.replace("  return (\n    <motion.div", optionsGenerator + "\n    <motion.div");

// Now replace the LineChart section
const oldLineChartStr = `<ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                content={<CustomChartTooltip />}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                wrapperStyle={{ zIndex: 100 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {selectedTraits.includes('openness') && <Line type="monotone" dataKey="openness" name="Openness" stroke="#06b6d4" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
              {selectedTraits.includes('conscientiousness') && <Line type="monotone" dataKey="conscientiousness" name="Conscientiousness" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
              {selectedTraits.includes('extraversion') && <Line type="monotone" dataKey="extraversion" name="Extraversion" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
              {selectedTraits.includes('agreeableness') && <Line type="monotone" dataKey="agreeableness" name="Agreeableness" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
              {selectedTraits.includes('neuroticism') && <Line type="monotone" dataKey="neuroticism" name="Neuroticism" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
            </LineChart>
          </ResponsiveContainer>`;

const newHighchartsStr = `<HighchartsReact highcharts={Highcharts} options={highchartsOptions} containerProps={{ style: { height: '100%', width: '100%' } }} />`;

code = code.replace(oldLineChartStr, newHighchartsStr);

fs.writeFileSync('src/components/TrendsView.tsx', code);
