import { auth } from '../firebase';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Search, Compass, Lightbulb, Map, Loader2, Sparkles, AlertCircle, LayoutList, Network, Download, FileText } from 'lucide-react';
import { SavedReport, LayeredInsightData, ReportData } from '../types';
import { Save } from 'lucide-react';
import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface LayeredInsightsViewProps {
  reports: SavedReport[];
  saveReport?: (reportData: ReportData) => Promise<void>;
}

export function LayeredInsightsView({ reports, saveReport }: LayeredInsightsViewProps) {
  const [insightData, setInsightData] = useState<LayeredInsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summarizeSuccess, setSummarizeSuccess] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Check if we already have it in localStorage
  useEffect(() => {
    const cached = localStorage.getItem('aura_layered_insights');
    if (cached) {
      try {
        setInsightData(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached layered insights");
      }
    }
  }, []);

  const generateInsights = async () => {
    if (reports.length === 0) {
      setError("Not enough data. Try logging multiple entries or audio samples first.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // Send a simplified version of reports to avoid token bloat
      const simplifiedReports = reports.map(r => ({
        date: r.date,
        summary: r.report.summary,
        mbti: r.report.mbti,
        bigFive: r.report.bigFive,
        communicationStyle: r.report.communicationStyle?.summary,
      }));

      const res = await fetch('/api/layered-insights', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: simplifiedReports })
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setInsightData(data);
      localStorage.setItem('aura_layered_insights', JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'Failed to generate layered insights.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportInsights = () => {
    if (!insightData) return;
    
    let text = `LAYERED INSIGHTS REPORT\n`;
    text += `=======================\n\n`;
    
    text += `THE SURFACE LEVEL:\n${insightData.surfaceLevel}\n\n`;
    text += `UNDERLYING PATTERNS:\n${insightData.underlyingPatterns}\n\n`;
    
    if (insightData.multiplePerspectives && insightData.multiplePerspectives.length > 0) {
      text += `MULTIPLE PERSPECTIVES:\n`;
      insightData.multiplePerspectives.forEach((p, i) => {
        text += `${i + 1}. ${p}\n`;
      });
      text += `\n`;
    }

    if (insightData.potentialScenarios && insightData.potentialScenarios.length > 0) {
      text += `POTENTIAL SCENARIOS:\n`;
      insightData.potentialScenarios.forEach((s, i) => {
        text += `${i + 1}. ${s}\n`;
      });
      text += `\n`;
    }

    if (insightData.informedDecisions && insightData.informedDecisions.length > 0) {
      text += `INFORMED DECISIONS & ACTIONS:\n`;
      insightData.informedDecisions.forEach((d, i) => {
        text += `- ${d}\n`;
      });
      text += `\n`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.href = url;
    downloadAnchorNode.download = `layered_insights_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    document.body.removeChild(downloadAnchorNode);
    URL.revokeObjectURL(url);
  };

  const exportInsightsPdf = async () => {
    if (!reportRef.current || !insightData) return;
    try {
      setIsDownloadingPdf(true);
      const canvas = await toCanvas(reportRef.current, {
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
      pdf.save(`layered_insights_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const summarizeAndSave = async () => {
    if (!insightData || !saveReport) return;
    
    setIsSummarizing(true);
    setSummarizeSuccess(false);
    setError(null);

    try {
      const response = await fetch('/api/summarize-layered-insights', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightData })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Summarization failed');
      }

      const summaryReport = await response.json();
      await saveReport(summaryReport);
      setSummarizeSuccess(true);
      
      setTimeout(() => setSummarizeSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to summarize insights');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!insightData && !isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-6 border border-blue-600/20">
          <Layers className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Layered Insights</h2>
        <p className="text-slate-600 max-w-md mb-8 leading-relaxed">
          Uncover underlying patterns and connections across all your interactions. Explore different perspectives, potential scenarios, and make more informed decisions based on your accumulated data.
        </p>
        {error && (
            <div className="flex items-center space-x-3 text-rose-600 mb-6 bg-rose-50 px-6 py-3 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4" />
                <span className="text-base font-medium">{error}</span>
            </div>
        )}
        <button
          onClick={generateInsights}
          disabled={reports.length === 0}
          className="flex items-center space-x-3 px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          <span>Generate Deep Analysis</span>
        </button>
        {reports.length === 0 && (
          <p className="text-sm text-slate-500 mt-4">You need to log at least one entry first.</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-8 pb-20 mt-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-600" />
            Layered Insights
          </h2>
          <p className="text-slate-600 text-base mt-1">A nuanced understanding of your patterns</p>
        </div>
        <div className="flex space-x-3">
          {insightData && (
            <div className="flex gap-2">
              <button
                onClick={exportInsightsPdf}
                disabled={isDownloadingPdf}
                className="flex items-center space-x-3 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition-colors text-base font-medium border border-slate-200 hover:border-slate-300 disabled:opacity-50"
                title="Export as PDF"
              >
                <FileText className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={exportInsights}
                className="flex items-center space-x-3 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition-colors text-base font-medium border border-slate-200 hover:border-slate-300"
                title="Export as Text File"
              >
                <Download className="w-4 h-4" />
                <span>TXT</span>
              </button>
              {saveReport && (
                <button
                  onClick={summarizeAndSave}
                  disabled={isSummarizing || summarizeSuccess}
                  className={`flex items-center space-x-3 px-6 py-2 rounded-xl transition-colors text-base font-medium border ${summarizeSuccess ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/50' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200 hover:border-slate-300'} disabled:opacity-50`}
                  title="Summarize & Save to Reports"
                >
                  {isSummarizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : summarizeSuccess ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4 text-blue-600" />
                  )}
                  <span>
                    {isSummarizing ? 'Saving...' : summarizeSuccess ? 'Saved' : 'Summarize & Save'}
                  </span>
                </button>
              )}
            </div>
          )}
          <button
            onClick={generateInsights}
            disabled={isLoading}
            className="flex items-center space-x-3 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl transition-colors text-base font-medium border border-slate-200 hover:border-slate-300 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-600" />}
            <span>{isLoading ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {isLoading && !insightData && (
        <div className="flex flex-col items-center justify-center py-20 px-6 h-64 bg-white/80 rounded-3xl border border-slate-200/50 shadow-inner">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-600 text-base animate-pulse text-center max-w-sm">
            Synthesizing historical data across multiple dimensions to uncover deeper patterns...
          </p>
        </div>
      )}

      {insightData && (
        <motion.div 
          ref={reportRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Surface Level */}
          <div className="bg-white/60 rounded-3xl p-8 md:p-8 border border-slate-200/80 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Search className="w-32 h-32 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-blue-600 border border-slate-200 shadow-inner">
                <Search className="w-5 h-5" />
              </div>
              The Surface Level
            </h3>
            <p className="text-slate-800 leading-relaxed text-[15px] md:text-base relative z-10 pl-14">
              {insightData.surfaceLevel}
            </p>
          </div>

          {/* Underlying Patterns */}
          <div className="bg-white/60 rounded-3xl p-8 md:p-8 border border-slate-200/80 shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Layers className="w-32 h-32 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-indigo-400 border border-slate-200 shadow-inner">
                <Layers className="w-5 h-5" />
              </div>
              Underlying Patterns
            </h3>
            <p className="text-slate-800 leading-relaxed text-[15px] md:text-base relative z-10 pl-14">
              {insightData.underlyingPatterns}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Multiple Perspectives */}
             <div className="bg-white/60 rounded-3xl p-8 border border-slate-200/80 shadow-xl">
                 <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-amber-400 border border-slate-200 shadow-inner">
                        <Compass className="w-4 h-4" />
                    </div>
                    Multiple Perspectives
                 </h3>
                 <ul className="space-y-8">
                    {insightData.multiplePerspectives.map((perspective, idx) => (
                        <li key={idx} className="flex gap-4 p-8 bg-slate-100/40 rounded-2xl border border-slate-200">
                            <span className="text-amber-400/50 font-bold shrink-0">{idx + 1}.</span>
                            <span className="text-slate-800 text-base leading-relaxed">{perspective}</span>
                        </li>
                    ))}
                 </ul>
             </div>

             {/* Potential Scenarios */}
             <div className="bg-white/60 rounded-3xl p-8 border border-slate-200/80 shadow-xl">
                 <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-fuchsia-400 border border-slate-200 shadow-inner">
                        <Map className="w-4 h-4" />
                    </div>
                    Potential Scenarios
                 </h3>
                 <ul className="space-y-8">
                    {insightData.potentialScenarios.map((scenario, idx) => (
                        <li key={idx} className="flex gap-4 p-8 bg-slate-100/40 rounded-2xl border border-slate-200">
                            <span className="text-fuchsia-400/50 font-bold shrink-0">{idx + 1}.</span>
                            <span className="text-slate-800 text-base leading-relaxed">{scenario}</span>
                        </li>
                    ))}
                 </ul>
             </div>
          </div>

          {/* Informed Decisions */}
          <div className="bg-white/60 rounded-3xl p-8 md:p-8 border border-slate-200/80 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-3">
              <div className="p-2 bg-blue-200/40 rounded-lg text-blue-600 border border-blue-600/20 shadow-inner">
                <Lightbulb className="w-5 h-5" />
              </div>
              Informed Decisions & Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insightData.informedDecisions.map((decision, idx) => (
                    <div key={idx} className="bg-slate-100/60 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                         <p className="text-slate-800 text-[15px] leading-relaxed mb-4">{decision}</p>
                         <div className="w-8 h-1 bg-blue-600/50 rounded-full mt-auto"></div>
                    </div>
                ))}
            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
}
