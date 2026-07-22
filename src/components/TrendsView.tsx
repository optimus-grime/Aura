import { auth } from '../firebase';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedReport } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Trash2, Info, CloudLightning, FileText } from 'lucide-react';
import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { AnalysisReport } from './AnalysisReport';
import { MoodCalendarView } from './MoodCalendarView';

interface TrendsViewProps {
  reports: SavedReport[];
  onViewReport: (report: SavedReport) => void;
  onDeleteReport: (id: string) => void;
  initialViewMode?: 'timeline' | 'calendar' | 'comparison';
}

const TRAITS = [
  { id: 'openness', name: 'Openness', color: '#06b6d4', description: 'Inventive/curious vs. consistent/cautious' },
  { id: 'conscientiousness', name: 'Conscientiousness', color: '#8b5cf6', description: 'Efficient/organized vs. extravagant/careless' },
  { id: 'extraversion', name: 'Extraversion', color: '#f59e0b', description: 'Outgoing/energetic vs. solitary/reserved' },
  { id: 'agreeableness', name: 'Agreeableness', color: '#10b981', description: 'Friendly/compassionate vs. critical/rational' },
  { id: 'neuroticism', name: 'Neuroticism', color: '#ef4444', description: 'Sensitive/nervous vs. resilient/confident' }
];

const TRAIT_DESCRIPTIONS: Record<string, string> = {
  openness: 'Inventive and curious vs. consistent and cautious',
  conscientiousness: 'Efficient and organized vs. extravagant and careless',
  extraversion: 'Outgoing and energetic vs. solitary and reserved',
  agreeableness: 'Friendly and compassionate vs. critical and rational',
  neuroticism: 'Sensitive and nervous vs. resilient and confident'
};

const CustomChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-6 rounded-xl shadow-2xl w-72">
        <p className="text-slate-800 font-medium mb-2 border-b border-slate-200 pb-2">{data.date} at {data.time}</p>
        <div className="py-2 space-y-1.5">
          {payload.map((entry: any, index: number) => (
             <div key={`item-${index}`} className="flex justify-between items-center text-base">
                <span style={{ color: entry.color }} className="font-medium drop-shadow-sm">{entry.name}</span>
                <span className="text-slate-900 font-mono font-bold">{entry.value}</span>
             </div>
          ))}
        </div>
        {data.summary && (
          <p className="text-sm text-slate-600 border-t border-slate-200 pt-3 mt-1 leading-relaxed line-clamp-3">
             {data.summary}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const SmallMultipleTooltip = ({ active, payload, traitName, traitColor }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-4 rounded-xl shadow-xl w-60 z-50">
        <p className="text-slate-800 font-medium mb-1.5 border-b border-slate-100 pb-1.5 text-[11px]">{data.date} at {data.time}</p>
        <div className="flex justify-between items-center text-sm mb-1.5">
          <span style={{ color: traitColor }} className="font-semibold">{traitName}</span>
          <span className="text-slate-900 font-mono font-bold">{payload[0].value}</span>
        </div>
        {data.summary && (
          <p className="text-xs text-slate-500 leading-normal line-clamp-2">
            {data.summary}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function TrendsView({ reports, onViewReport, onDeleteReport, initialViewMode }: TrendsViewProps) {
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']);
  const [activeTraitInfo, setActiveTraitInfo] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'comparison'>(initialViewMode || 'timeline');
  const [compareReport1Id, setCompareReport1Id] = useState<string | null>(reports.length > 0 ? reports[0].id : null);
  const [compareReport2Id, setCompareReport2Id] = useState<string | null>(reports.length > 1 ? reports[1].id : null);
  
  const [expandedBaseline, setExpandedBaseline] = useState(false);
  const [expandedComparison, setExpandedComparison] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [comparisonSummary, setComparisonSummary] = useState<{ summary: string; keyDifferences: { trait: string; meaning: string }[] } | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  const trendsRef = useRef<HTMLDivElement>(null);
  
  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]
    );
  };

  const handleDownloadPdf = async () => {
    if (!trendsRef.current) return;
    try {
      setIsDownloadingPdf(true);
      const canvas = await toCanvas(trendsRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`trends_insights_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="w-full flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-600">No analysis reports found. Try speaking or pasting text to generate a profile.</p>
      </div>
    );
  }

  // Sort reports chronologically for the chart
  const chronologicalReports = [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const chartData = chronologicalReports.map(rp => {
    const dateObj = new Date(rp.date);
    const shortDate = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
    return {
      date: dateObj.toLocaleDateString(),
      shortDate,
      time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      openness: rp.report.bigFive?.openness || 0,
      conscientiousness: rp.report.bigFive?.conscientiousness || 0,
      extraversion: rp.report.bigFive?.extraversion || 0,
      agreeableness: rp.report.bigFive?.agreeableness || 0,
      neuroticism: rp.report.bigFive?.neuroticism || 0,
      sentiment: rp.report.readiness?.score || null,
      summary: rp.report.summary,
      report: rp.report
    };
  });

  const rep1 = reports.find(r => r.id === compareReport1Id);
  const rep2 = reports.find(r => r.id === compareReport2Id);

  const handleCompare = async () => {
    if (!rep1 || !rep2) return;
    setIsComparing(true);
    setComparisonSummary(null);
    setCompareError(null);
    try {
      const response = await fetch('/api/compare-reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ report1: rep1.report, report2: rep2.report }),
      });
      const data = await response.json();
      if (data.summary) {
        setComparisonSummary(data);
      } else if (data.error) {
        let errStr = data.error;
        if (typeof errStr === 'string' && errStr.includes('unregistered callers')) {
          errStr = 'Gemini API key is missing or invalid. Please configure GEMINI_API_KEY in application settings.';
        }
        setCompareError(errStr);
      }
    } catch (e: any) {
      console.error(e);
      setCompareError(e?.message || 'Failed to fetch comparison.');
    } finally {
      setIsComparing(false);
    }
  };

  const comparisonData = rep1 && rep2 ? [
    { subject: 'Openness', A: rep1.report.bigFive?.openness || 0, B: rep2.report.bigFive?.openness || 0, fullMark: 100 },
    { subject: 'Conscientiousness', A: rep1.report.bigFive?.conscientiousness || 0, B: rep2.report.bigFive?.conscientiousness || 0, fullMark: 100 },
    { subject: 'Extraversion', A: rep1.report.bigFive?.extraversion || 0, B: rep2.report.bigFive?.extraversion || 0, fullMark: 100 },
    { subject: 'Agreeableness', A: rep1.report.bigFive?.agreeableness || 0, B: rep2.report.bigFive?.agreeableness || 0, fullMark: 100 },
    { subject: 'Neuroticism', A: rep1.report.bigFive?.neuroticism || 0, B: rep2.report.bigFive?.neuroticism || 0, fullMark: 100 },
  ] : [];

  return (
    <motion.div 
      ref={trendsRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full flex flex-col mt-8 space-y-8 relative"
      onClick={() => setActiveTraitInfo(null)}
    >
      <div className="flex justify-between items-center w-full">
        <h2 className="text-2xl font-bold text-slate-900 hidden sm:block">Timeline Analysis</h2>
        
        <div className="flex bg-white/80 p-1 rounded-xl border border-slate-200/80 w-fit flex-wrap gap-1">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${viewMode === 'timeline' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${viewMode === 'calendar' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            Mood Calendar
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${viewMode === 'comparison' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            Compare Reports
          </button>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center space-x-3 px-6 py-2 bg-blue-600 text-white shadow-md hover:bg-blue-700 rounded-xl transition-colors text-base font-medium border border-blue-500/20 disabled:opacity-50" title="Download PDF"
        >
          <FileText className="w-4 h-4" />
          <span>PDF</span>
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <MoodCalendarView reports={reports} onViewReport={onViewReport} />
      ) : viewMode === 'timeline' ? (
      <div className="bg-white backdrop-blur-md rounded-2xl border border-slate-200 p-8 shadow-xl w-full">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-slate-900">Big Five Trends over Time</h3>
          <div className="flex flex-wrap gap-2 justify-end">
            {TRAITS.map(t => (
              <div key={t.id} className="relative flex items-center bg-white rounded-full border border-slate-200 pr-1 shadow-sm">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTrait(t.id); }}
                  className={`px-3 py-1.5 rounded-full rounded-r-none text-xs font-semibold transition-all ${selectedTraits.includes(t.id) ? 'text-white border-r shadow-md' : 'text-slate-600 hover:text-slate-800 bg-white border-r border-slate-200'}`} style={selectedTraits.includes(t.id) ? { backgroundColor: t.color, borderColor: t.color } : {}}
                >
                  {t.name}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveTraitInfo(activeTraitInfo === t.id ? null : t.id); }}
                  className={`p-1 rounded-full hover:bg-slate-100/80 transition-colors ${activeTraitInfo === t.id ? 'text-blue-600' : 'text-slate-500'}`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                
                <AnimatePresence>
                  {activeTraitInfo === t.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full right-0 mb-2 w-56 bg-slate-100 border border-slate-200/80 text-slate-800 text-xs rounded-xl p-3 shadow-2xl z-20 text-center leading-relaxed backdrop-blur-sm pointer-events-none"
                    >
                      {TRAIT_DESCRIPTIONS[t.id]}
                      <div className="absolute top-full right-3 -mt-[1px] border-4 border-transparent border-t-slate-700/80" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Small Multiples Sparkline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-10">
          {TRAITS.map(trait => {
            const isVisible = selectedTraits.includes(trait.id);
            if (!isVisible) return null;
            
            const lastVal = chartData.length > 0 ? chartData[chartData.length - 1][trait.id as keyof typeof chartData[0]] : null;
            
            return (
              <div key={trait.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-48">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-800">{trait.name}</span>
                    <span style={{ color: trait.color }} className="text-sm font-mono font-bold">
                      {lastVal !== null ? `${lastVal}` : '-'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight">{trait.description}</p>
                </div>
                
                <div className="h-24 w-full mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={chartData} 
                      margin={{ top: 5, right: 10, left: -32, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="shortDate" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={[0, 100]}
                        ticks={[0, 50, 100]}
                      />
                      <Tooltip 
                        content={<SmallMultipleTooltip traitName={trait.name} traitColor={trait.color} />}
                        cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                        wrapperStyle={{ zIndex: 100 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey={trait.id} 
                        stroke={trait.color} 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 mb-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h3 className="text-lg font-semibold text-slate-900">Sentiment Over Time (Mood Fluctuations)</h3>
          </div>
          <div className="h-[300px] w-full relative bg-white border border-slate-200 rounded-xl shadow-sm p-4 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  content={<CustomChartTooltip />}
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  wrapperStyle={{ zIndex: 100 }}
                />
                <Line connectNulls type="monotone" dataKey="sentiment" name="Sentiment / Readiness" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 bg-white shadow-sm p-8 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
             <Info className="w-5 h-5 text-blue-600" />
             <h4 className="text-slate-900 font-medium">MBTI vs Big Five Introspection</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base text-slate-800 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="pb-2 font-medium">Session Date</th>
                  <th className="pb-2 font-medium">MBTI Type</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Dominant Trait</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">Lower Trait</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chronologicalReports.map((rp, i) => {
                  const b5 = rp.report.bigFive || {};
                  const traits = [
                    { name: 'O', val: b5.openness || 0 },
                    { name: 'C', val: b5.conscientiousness || 0 },
                    { name: 'E', val: b5.extraversion || 0 },
                    { name: 'A', val: b5.agreeableness || 0 },
                    { name: 'N', val: b5.neuroticism || 0 }
                  ];
                  traits.sort((a, b) => b.val - a.val);
                  const highest = traits[0];
                  const lowest = traits[traits.length - 1];

                  return (
                    <tr key={i} className="border-b border-slate-200 hover:bg-slate-100/30 transition-colors">
                      <td className="py-3 pr-4 whitespace-nowrap">
                         <span className="font-medium text-slate-900">{new Date(rp.date).toLocaleDateString()}</span>
                      </td>
                      <td className="py-3 pr-4">
                         <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-600/10 text-blue-600 border border-blue-600/20 font-medium tracking-wide">
                            {rp.report.mbti || 'N/A'}
                         </span>
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                         {highest ? `${highest.name} (${highest.val})` : '-'}
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                         {lowest ? `${lowest.name} (${lowest.val})` : '-'}
                      </td>
                      <td className="py-3 text-right">
                         <div className="flex justify-end gap-2">
                           <button onClick={() => setExportingReportId(rp.id)} className="p-1 hover:bg-blue-600/10 text-blue-600 rounded-lg transition-colors" title="Download Report PDF">
                             <FileText className="w-4 h-4" />
                           </button>
                           <button onClick={() => onViewReport(rp)} className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-blue-700/20 rounded-lg text-sm font-medium transition-colors border border-blue-600/20">
                             View
                           </button>
                           <button onClick={() => onDeleteReport(rp.id)} className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex items-start space-x-3 bg-white shadow-sm p-8 rounded-xl border border-slate-200">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-base text-slate-800 leading-relaxed">
            <p className="font-medium text-slate-900 mb-1">Understanding Your Trait Scores</p>
            <p>
              The grid displays your personality trait expression on a 0-100 scale over time in a small-multiples format. 
              Higher values indicate a stronger expression of the trait. For example, a high score in Extraversion means you're leaning more towards outgoing behavior, while a lower score leans towards introversion.
              Hover over points on the sparklines to read specific notes and summaries for individual dates.
            </p>
          </div>
        </div>
      </div>
      ) : (
      <div className="bg-white backdrop-blur-md rounded-2xl border border-slate-200 p-8 shadow-xl w-full">
        <h3 className="text-lg font-medium text-slate-900 mb-6">Compare Trends</h3>
        
        {reports.length < 2 ? (
            <p className="text-slate-600">Need at least 2 reports to compare.</p>
        ) : (
            <div className="flex flex-col space-y-8">
               <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1 w-full flex flex-col space-y-1">
                     <label className="text-base font-medium text-slate-600">Baseline Report</label>
                     <select 
                       className="bg-white shadow-sm text-slate-900 p-2 rounded-lg border border-slate-200 w-full outline-none focus:border-blue-600"
                       value={compareReport1Id || ''}
                       onChange={e => setCompareReport1Id(e.target.value)}
                     >
                       {reports.map(r => (
                          <option key={r.id} value={r.id}>{new Date(r.date).toLocaleString()} ({r.report.mbti}{r.report.enneagram ? ` / ${r.report.enneagram}` : ''})</option>
                       ))}
                     </select>
                  </div>
                  <div className="flex-1 w-full flex flex-col space-y-1">
                     <label className="text-base font-medium text-slate-600">Comparison Report</label>
                     <select 
                       className="bg-white shadow-sm text-slate-900 p-2 rounded-lg border border-slate-200 w-full outline-none focus:border-blue-600"
                       value={compareReport2Id || ''}
                       onChange={e => setCompareReport2Id(e.target.value)}
                     >
                       {reports.map(r => (
                          <option key={r.id} value={r.id}>{new Date(r.date).toLocaleString()} ({r.report.mbti}{r.report.enneagram ? ` / ${r.report.enneagram}` : ''})</option>
                       ))}
                     </select>
                  </div>
               </div>

               {rep1 && rep2 && (
                   <div className="flex flex-col items-center justify-center p-8 bg-white/30 rounded-xl border border-slate-200/50">
                      <div className="h-[500px] w-full max-w-2xl relative flex flex-col items-center justify-center my-6">
                        <div className="w-full h-full relative">
                           <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={comparisonData}>
                                 <defs>
                                   <filter id="glowA" x="-20%" y="-20%" width="140%" height="140%">
                                     <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#06b6d4" floodOpacity="0.3" />
                                   </filter>
                                   <filter id="glowB" x="-20%" y="-20%" width="140%" height="140%">
                                     <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#d946ef" floodOpacity="0.3" />
                                   </filter>
                                 </defs>
                                 <PolarGrid stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" />
                                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 14, fontWeight: '700' }} />
                                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                 
                                 <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', padding: '12px 20px', fontWeight: 'bold' }} 
                                    itemStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '15px' }}
                                    labelStyle={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', tracking: 'widest' }}
                                 />
                                 
                                 {/* Baseline - Volumetric Glass Opacities and Flat Styling */}
                                 <Radar name="Baseline" dataKey="A" stroke="#06b6d4" strokeWidth={2.5} fill="#06b6d4" fillOpacity={0.25} style={{ filter: 'url(#glowA)' }} />

                                 {/* Comparison - Volumetric Glass Opacities and Flat Styling */}
                                 <Radar name="Comparison" dataKey="B" stroke="#d946ef" strokeWidth={2.5} fill="#d946ef" fillOpacity={0.25} style={{ filter: 'url(#glowB)' }} />
                                 
                              </RadarChart>
                           </ResponsiveContainer>
                        </div>
                        
                        {/* Custom Legend */}
                        <div className="flex justify-center items-center space-x-8 mt-6">
                           <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 rounded-md bg-[#06b6d4] border-2 border-[#06b6d4] shadow-sm"></div>
                              <span className="text-base font-bold text-slate-700">Baseline</span>
                           </div>
                           <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 rounded-md bg-[#d946ef] border-2 border-[#d946ef] shadow-sm"></div>
                              <span className="text-base font-bold text-slate-700">Comparison</span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-8 bg-white shadow-sm rounded-xl border border-slate-200 flex flex-col">
                          <h4 className="font-semibold text-blue-600 mb-2 text-base">Baseline Details</h4>
                          <p className="text-base text-slate-800"><strong>MBTI:</strong> {rep1.report.mbti}</p>
                          {rep1.report.enneagram && <p className="text-base text-slate-800"><strong>Enneagram:</strong> {rep1.report.enneagram}</p>}
                          <p className="text-base text-slate-800"><strong>Readiness:</strong> {rep1.report.readiness?.score || 'N/A'}/100</p>
                          {rep1.report.summary && (
                            <div className="mt-2 text-sm text-slate-600">
                              <p className="text-slate-800 leading-relaxed text-base font-normal">{rep1.report.summary}</p>
                            </div>
                          )}
                        </div>
                        <div className="p-8 bg-white shadow-sm rounded-xl border border-slate-200 flex flex-col">
                          <h4 className="font-semibold text-purple-600 mb-2 text-base">Comparison Details</h4>
                          <p className="text-base text-slate-800"><strong>MBTI:</strong> {rep2.report.mbti}</p>
                          {rep2.report.enneagram && <p className="text-base text-slate-800"><strong>Enneagram:</strong> {rep2.report.enneagram}</p>}
                          <p className="text-base text-slate-800"><strong>Readiness:</strong> {rep2.report.readiness?.score || 'N/A'}/100</p>
                          {rep2.report.summary && (
                            <div className="mt-2 text-sm text-slate-600">
                              <p className="text-slate-800 leading-relaxed text-base font-normal">{rep2.report.summary}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comparison Summary Section */}
                      <div className="w-full mt-6 flex flex-col items-center">
                        {compareError && (
                          <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm max-w-lg text-center">
                            {compareError}
                          </div>
                        )}
                        {!comparisonSummary && !isComparing && (
                          <button
                            onClick={handleCompare}
                            className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm transition-colors border border-blue-200/50 flex items-center space-x-3"
                          >
                            <CloudLightning className="w-4 h-4" />
                            <span>Analyze Differences</span>
                          </button>
                        )}
                        {isComparing && (
                          <div className="flex items-center space-x-3 text-blue-600 animate-pulse">
                            <CloudLightning className="w-5 h-5" />
                            <span>Analyzing...</span>
                          </div>
                        )}
                        {comparisonSummary && (
                          <div className="w-full bg-white shadow-sm rounded-xl p-6 border border-slate-200 mt-4 text-left">
                            <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                              <CloudLightning className="w-4 h-4 text-blue-600" />
                              Comparison Insights
                            </h4>
                            <p className="text-base text-slate-800 mb-4 leading-relaxed">
                              {comparisonSummary.summary}
                            </p>
                            {comparisonSummary.keyDifferences && comparisonSummary.keyDifferences.length > 0 && (
                              <div className="space-y-3">
                                {comparisonSummary.keyDifferences.map((diff, i) => (
                                  <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="font-semibold text-blue-600 text-base mb-1">{diff.trait}</div>
                                    <div className="text-slate-700 text-base leading-relaxed">{diff.meaning}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={handleCompare}
                              className="mt-4 text-sm text-slate-500 hover:text-slate-600 underline decoration-slate-600 underline-offset-4"
                            >
                              Re-analyze
                            </button>
                          </div>
                        )}
                      </div>
                   </div>
               )}
            </div>
        )}
      </div>
      )}

      {exportingReportId && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none', width: '2xl' }}>
          <AnalysisReport 
            report={reports.find(r => r.id === exportingReportId)?.report!} 
            onClose={() => {}}
            autoDownload={true}
            onDownloadComplete={() => setExportingReportId(null)}
          />
        </div>
      )}
    </motion.div>
  );
}
