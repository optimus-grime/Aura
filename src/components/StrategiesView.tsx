import { auth } from '../firebase';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Zap, RefreshCw, Compass, Lightbulb } from 'lucide-react';
import { ReportData, SituationalStrategy } from '../types';

interface StrategiesViewProps {
  latestReport: ReportData | null;
}

export function StrategiesView({ latestReport }: StrategiesViewProps) {
  const [strategies, setStrategies] = useState<SituationalStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStrategies = async () => {
    if (!latestReport) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: latestReport }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate strategies');
      }
      const data = await response.json();
      if (data.strategies) {
        setStrategies(data.strategies);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  if (!latestReport) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
          <Target className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-medium text-slate-300">No Profile Found</h3>
        <p className="text-slate-400 max-w-md leading-relaxed">
          Complete a voice or text analysis first so we can generate strategic advice tailored specifically to your traits.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full flex items-start justify-center mt-8 pb-20"
    >
      <div className="w-full max-w-3xl flex flex-col space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 p-6 shadow-xl">
            <div>
              <h2 className="text-2xl font-medium text-slate-200 flex items-center gap-3">
                 <Compass className="w-6 h-6 text-cyan-400" />
                 Action Plan
              </h2>
              <p className="text-slate-400 mt-2">
                 Practical strategies for leveraging your {latestReport.mbti ? `${latestReport.mbti} ` : ''}traits in everyday life.
              </p>
            </div>
            
            <button 
              onClick={generateStrategies}
              disabled={isLoading}
              className="px-6 py-3 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-medium transition-colors border border-cyan-500/30 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                  <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Formulating...</span>
                  </>
                ) : (
                  <>
                      <Zap className="w-4 h-4" />
                      <span>{strategies.length > 0 ? "Refresh Strategies" : "Generate Strategies"}</span>
                  </>
                )}
            </button>
        </div>

        {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
               Error: {error}
            </div>
        )}

        <div className="space-y-6 flex flex-col">
          <AnimatePresence>
            {strategies.map((s, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900/80 border border-gray-800 backdrop-blur-md rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-cyan-800/50 transition-colors"
              >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-3 mb-4 border-b border-gray-800 pb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                      <Target className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-slate-200">{s.situation}</h3>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {s.traitsLeveraged.map((t, idx) => (
                             <span key={idx} className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {t}
                             </span>
                          ))}
                        </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-slate-300 leading-relaxed text-sm">
                      {s.strategy}
                    </p>
                  </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {strategies.length === 0 && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 border border-dashed border-gray-800 rounded-2xl">
                <Compass className="w-8 h-8 mb-4 opacity-50" />
                <p>Click "Generate Strategies" to plan how to make the most out of your natural traits.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
