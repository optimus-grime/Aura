import { auth } from '../firebase';
import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedReport } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Trash2, Filter, Info, CloudLightning, FileText } from 'lucide-react';
import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { AnalysisReport } from './AnalysisReport';

interface TrendsViewProps {
  reports: SavedReport[];
  onViewReport: (report: SavedReport) => void;
  onDeleteReport: (id: string) => void;
}

const TRAIT_DESCRIPTIONS: Record<string, string> = {
  openness: 'Inventive and curious vs. consistent and cautious',
  conscientiousness: 'Efficient and organized vs. extravagant and careless',
  extraversion: 'Outgoing and energetic vs. solitary and reserved',
  agreeableness: 'Friendly and compassionate vs. critical and rational',
  neuroticism: 'Sensitive and nervous vs. resilient and confident'
};

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-4 rounded-xl shadow-2xl w-72">
        <p className="text-slate-300 font-medium mb-2 border-b border-slate-800 pb-2">{data.date} at {data.time}</p>
        <div className="py-2 space-y-1.5">
          {payload.map((entry: any, index: number) => (
             <div key={`item-${index}`} className="flex justify-between items-center text-sm">
                <span style={{ color: entry.color }} className="font-medium drop-shadow-sm">{entry.name}</span>
                <span className="text-slate-200 font-mono">{entry.value}</span>
             </div>
          ))}
        </div>
        {data.summary && (
          <p className="text-xs text-slate-400 border-t border-slate-800 pt-3 mt-1 leading-relaxed">
             {data.summary}
          </p>
        )}
      </div>
    );
  }
  return null;
};



export function TrendsView({ reports, onViewReport, onDeleteReport }: TrendsViewProps) {
  const [selectedTraits, setSelectedTraits] = useState<string[]>(['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']);
  const [activeTraitInfo, setActiveTraitInfo] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'timeline' | 'comparison'>('timeline');
  const [compareReport1Id, setCompareReport1Id] = useState<string | null>(reports.length > 0 ? reports[0].id : null);
  const [compareReport2Id, setCompareReport2Id] = useState<string | null>(reports.length > 1 ? reports[1].id : null);
  
  const [expandedBaseline, setExpandedBaseline] = useState(false);
  const [expandedComparison, setExpandedComparison] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [comparisonSummary, setComparisonSummary] = useState<{ summary: string; keyDifferences: { trait: string; meaning: string }[] } | null>(null);
  const [isComparing, setIsComparing] = useState(false);

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
        backgroundColor: '#0f172a',
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
        <p className="text-slate-400">No analysis reports found. Try speaking or pasting text to generate a profile.</p>
      </div>
    );
  }

  // Sort reports chronologically for the chart
  const chronologicalReports = [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const chartData = chronologicalReports.map(rp => {
    const dateObj = new Date(rp.date);
    return {
      date: dateObj.toLocaleDateString(),
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
    try {
      const response = await fetch('/api/compare-reports', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ report1: rep1.report, report2: rep2.report }),
      });
      const data = await response.json();
      if (data.summary) {
        setComparisonSummary(data);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to fetch comparison.');
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
      <div className="flex justify-between items-center">
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800/80 w-fit">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'timeline' ? 'bg-cyan-500/20 text-cyan-400 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Timeline
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'comparison' ? 'bg-cyan-500/20 text-cyan-400 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Compare Reports
          </button>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors text-sm font-medium border border-slate-700/50 hover:border-slate-600 disabled:opacity-50"
          title="Download PDF"
        >
          <FileText className="w-4 h-4" />
          <span>PDF</span>
        </button>
      </div>

      {viewMode === 'timeline' ? (
      <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 p-6 shadow-xl w-full">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h3 className="text-lg font-medium text-slate-200">Big Five Trends over Time</h3>
          <div className="flex flex-wrap gap-2 justify-end">
            {[
              { id: 'openness', label: 'Openness', color: 'border-[#06b6d4] text-[#06b6d4]' },
              { id: 'conscientiousness', label: 'Conscientiousness', color: 'border-[#8b5cf6] text-[#8b5cf6]' },
              { id: 'extraversion', label: 'Extraversion', color: 'border-[#f59e0b] text-[#f59e0b]' },
              { id: 'agreeableness', label: 'Agreeableness', color: 'border-[#10b981] text-[#10b981]' },
              { id: 'neuroticism', label: 'Neuroticism', color: 'border-[#ef4444] text-[#ef4444]' }
            ].map(t => (
              <div key={t.id} className="relative flex items-center bg-slate-900/40 rounded-full border border-slate-700/30 pr-1">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTrait(t.id); }}
                  className={`px-3 py-1.5 rounded-full rounded-r-none text-xs font-medium transition-all ${
                    selectedTraits.includes(t.id) 
                      ? `${t.color.replace('border-', 'bg-slate-800 border-r border-')} text-white`
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveTraitInfo(activeTraitInfo === t.id ? null : t.id); }}
                  className={`p-1 rounded-full hover:bg-slate-800/80 transition-colors ${activeTraitInfo === t.id ? 'text-cyan-400' : 'text-slate-500'}`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
                
                <AnimatePresence>
                  {activeTraitInfo === t.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute bottom-full right-0 mb-2 w-56 bg-slate-800 border border-slate-700/80 text-slate-300 text-xs rounded-xl p-3 shadow-2xl z-20 text-center leading-relaxed backdrop-blur-sm pointer-events-none"
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
        <div className="h-[300px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                content={<CustomChartTooltip />}
                cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                wrapperStyle={{ zIndex: 100 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {selectedTraits.includes('openness') && <Line type="monotone" dataKey="openness" name="Openness" stroke="#06b6d4" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
              {selectedTraits.includes('conscientiousness') && <Line type="monotone" dataKey="conscientiousness" name="Conscientiousness" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
              {selectedTraits.includes('extraversion') && <Line type="monotone" dataKey="extraversion" name="Extraversion" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
              {selectedTraits.includes('agreeableness') && <Line type="monotone" dataKey="agreeableness" name="Agreeableness" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
              {selectedTraits.includes('neuroticism') && <Line type="monotone" dataKey="neuroticism" name="Neuroticism" stroke="#ef4444" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-12 mb-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h3 className="text-lg font-medium text-slate-200">Sentiment Over Time (Mood Fluctuations)</h3>
          </div>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  content={<CustomChartTooltip />}
                  cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }}
                  wrapperStyle={{ zIndex: 100 }}
                />
                <Line connectNulls type="monotone" dataKey="sentiment" name="Sentiment / Readiness" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 4, fill: '#0a0a0a', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
             <Info className="w-5 h-5 text-cyan-400" />
             <h4 className="text-slate-200 font-medium">MBTI vs Big Five Introspection</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-700/50 text-slate-400">
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
                    <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 pr-4 whitespace-nowrap">
                         <span className="font-medium text-slate-200">{new Date(rp.date).toLocaleDateString()}</span>
                      </td>
                      <td className="py-3 pr-4">
                         <span className="inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium tracking-wide">
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
                           <button onClick={() => setExportingReportId(rp.id)} className="p-1 hover:bg-indigo-500/10 text-indigo-400 rounded-lg transition-colors" title="Download Report PDF">
                             <FileText className="w-4 h-4" />
                           </button>
                           <button onClick={() => onViewReport(rp)} className="px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-medium transition-colors border border-cyan-500/20">
                             View
                           </button>
                           <button onClick={() => onDeleteReport(rp.id)} className="p-1 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors">
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

        <div className="mt-6 flex items-start space-x-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300 leading-relaxed">
            <p className="font-medium text-slate-200 mb-1">Understanding Your Trait Scores</p>
            <p>
              The chart displays your personality trait expression on a 0-100 scale over time. 
              Higher values indicate a stronger expression of the trait. For example, a high score in Extraversion means you're leaning more towards outgoing behavior, while a lower score leans towards introversion.
              Hover over the trait toggles above to see brief explanations, or hover over points on the chart to read summaries for specific dates.
            </p>
          </div>
        </div>
      </div>
      ) : (
      <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 p-6 shadow-xl w-full">
        <h3 className="text-lg font-medium text-slate-200 mb-6">Compare Trends</h3>
        
        {reports.length < 2 ? (
            <p className="text-slate-400">Need at least 2 reports to compare.</p>
        ) : (
            <div className="flex flex-col space-y-6">
               <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1 w-full flex flex-col space-y-1">
                     <label className="text-sm font-medium text-slate-400">Baseline Report</label>
                     <select 
                       className="bg-slate-800 text-slate-200 p-2 rounded-lg border border-slate-700 w-full outline-none focus:border-cyan-500"
                       value={compareReport1Id || ''}
                       onChange={e => setCompareReport1Id(e.target.value)}
                     >
                       {reports.map(r => (
                          <option key={r.id} value={r.id}>{new Date(r.date).toLocaleString()} ({r.report.mbti}{r.report.enneagram ? ` / ${r.report.enneagram}` : ''})</option>
                       ))}
                     </select>
                  </div>
                  <div className="flex-1 w-full flex flex-col space-y-1">
                     <label className="text-sm font-medium text-slate-400">Comparison Report</label>
                     <select 
                       className="bg-slate-800 text-slate-200 p-2 rounded-lg border border-slate-700 w-full outline-none focus:border-cyan-500"
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
                   <div className="flex flex-col items-center justify-center p-4 bg-slate-900/30 rounded-xl border border-slate-800/50">
                      <div className="h-[400px] w-full max-w-lg">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadarChart cx="50%" cy="50%" outerRadius="70%" data={comparisonData}>
                              <PolarGrid stroke="#374151" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280' }} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ color: '#e2e8f0' }} />
                              <Legend />
                              <Radar name="Baseline" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                              <Radar name="Comparison" dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                           </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col">
                          <h4 className="font-medium text-cyan-400 mb-2">Baseline Details</h4>
                          <p className="text-sm text-slate-300"><strong>MBTI:</strong> {rep1.report.mbti}</p>
                          {rep1.report.enneagram && <p className="text-sm text-slate-300"><strong>Enneagram:</strong> {rep1.report.enneagram}</p>}
                          <p className="text-sm text-slate-300"><strong>Readiness:</strong> {rep1.report.readiness?.score || 'N/A'}/100</p>
                          {rep1.report.summary && (
                            <div className="mt-2 text-xs text-slate-400">
                              <p className={`${expandedBaseline ? '' : 'line-clamp-3'}`}>{rep1.report.summary}</p>
                              <button 
                                onClick={() => setExpandedBaseline(!expandedBaseline)}
                                className="text-cyan-500 hover:text-cyan-400 mt-1 font-medium select-none"
                              >
                                {expandedBaseline ? 'Show less' : 'Read more'}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col">
                          <h4 className="font-medium text-purple-400 mb-2">Comparison Details</h4>
                          <p className="text-sm text-slate-300"><strong>MBTI:</strong> {rep2.report.mbti}</p>
                          {rep2.report.enneagram && <p className="text-sm text-slate-300"><strong>Enneagram:</strong> {rep2.report.enneagram}</p>}
                          <p className="text-sm text-slate-300"><strong>Readiness:</strong> {rep2.report.readiness?.score || 'N/A'}/100</p>
                          {rep2.report.summary && (
                            <div className="mt-2 text-xs text-slate-400">
                              <p className={`${expandedComparison ? '' : 'line-clamp-3'}`}>{rep2.report.summary}</p>
                              <button 
                                onClick={() => setExpandedComparison(!expandedComparison)}
                                className="text-purple-500 hover:text-purple-400 mt-1 font-medium select-none"
                              >
                                {expandedComparison ? 'Show less' : 'Read more'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Comparison Summary Section */}
                      <div className="w-full mt-6 flex flex-col items-center">
                        {!comparisonSummary && !isComparing && (
                          <button
                            onClick={handleCompare}
                            className="px-6 py-2 rounded-full bg-slate-800 text-cyan-400 font-medium hover:bg-slate-700 transition-colors border border-cyan-900/50 flex items-center space-x-2"
                          >
                            <CloudLightning className="w-4 h-4" />
                            <span>Analyze Differences</span>
                          </button>
                        )}
                        {isComparing && (
                          <div className="flex items-center space-x-2 text-cyan-500 animate-pulse">
                            <CloudLightning className="w-5 h-5" />
                            <span>Analyzing...</span>
                          </div>
                        )}
                        {comparisonSummary && (
                          <div className="w-full bg-slate-800/80 rounded-xl p-5 border border-slate-700/50 mt-4 text-left">
                            <h4 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
                              <CloudLightning className="w-4 h-4 text-cyan-400" />
                              Comparison Insights
                            </h4>
                            <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                              {comparisonSummary.summary}
                            </p>
                            {comparisonSummary.keyDifferences && comparisonSummary.keyDifferences.length > 0 && (
                              <div className="space-y-3">
                                {comparisonSummary.keyDifferences.map((diff, i) => (
                                  <div key={i} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                                    <div className="font-medium text-cyan-400 text-sm mb-1">{diff.trait}</div>
                                    <div className="text-slate-400 text-sm leading-relaxed">{diff.meaning}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={handleCompare}
                              className="mt-4 text-xs text-slate-500 hover:text-slate-400 underline decoration-slate-600 underline-offset-4"
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
