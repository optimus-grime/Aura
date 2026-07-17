import React from 'react';
import { SavedReport } from '../types';
import { Calendar, BrainCircuit, Activity, Clock } from 'lucide-react';

interface PersonalityArchiveViewProps {
  reports: SavedReport[];
}

export const PersonalityArchiveView: React.FC<PersonalityArchiveViewProps> = ({ reports }) => {
  const sortedReports = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedReports.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center h-[50vh]">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-300">No Archives Yet</h2>
        <p className="text-slate-500 mt-2">Check back after you complete some personality assessments.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400 mb-2">
          Aura Evolution
        </h2>
        <p className="text-slate-400">Track how your personality traits, mindset, and readiness shift over time.</p>
      </div>

      <div className="relative border-l border-slate-700/50 ml-4 md:ml-6 space-y-12 pb-12">
        {sortedReports.map((reportEntry, idx) => {
          const r = reportEntry.report;
          const dateObj = new Date(reportEntry.date);
          const isLatest = idx === 0;

          return (
            <div key={reportEntry.id} className="relative pl-8 md:pl-12">
              <div className={`absolute -left-3 md:-left-3.5 top-0 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center border-4 border-slate-950 ${isLatest ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-slate-600'}`}>
                {isLatest && <div className="w-2 h-2 bg-slate-900 rounded-full" />}
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl hover:border-slate-700 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                   <div className="flex items-center gap-2 text-cyan-400">
                     <Calendar className="w-4 h-4" />
                     <span className="font-mono text-sm uppercase tracking-wider">{dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                   </div>
                   <div className="flex gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                     {r.mbti && <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">{r.mbti}</span>}
                     {r.enneagram && <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">{r.enneagram}</span>}
                   </div>
                </div>

                {r.summary && (
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
                    {r.summary}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {r.readiness && (
                    <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
                      <div className="bg-rose-500/10 p-3 rounded-lg text-rose-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Readiness</div>
                        <div className="text-lg font-bold text-slate-200">{r.readiness.score}/100</div>
                      </div>
                    </div>
                  )}

                  {r.mbtiFunctions && r.mbtiFunctions.dominant && (
                    <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
                      <div className="bg-purple-500/10 p-3 rounded-lg text-purple-400">
                        <BrainCircuit className="w-6 h-6" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dominant Process</div>
                        <div className="text-sm font-bold text-slate-200 truncate">{r.mbtiFunctions.dominant.function}</div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
