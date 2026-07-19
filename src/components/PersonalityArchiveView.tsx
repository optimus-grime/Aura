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
      <div className="w-full max-w-4xl mx-auto p-8 sm:p-8 md:p-8 flex flex-col items-center justify-center text-center h-[50vh]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">No Archives Yet</h2>
        <p className="text-slate-500 mt-2">Check back after you complete some personality assessments.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-8 sm:p-8 md:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Aura Evolution
          </h2>
        <p className="text-slate-600">Track how your personality traits, mindset, and readiness shift over time.</p>
      </div>

      <div className="relative border-l border-slate-200 ml-4 md:ml-6 space-y-12 pb-12">
        {sortedReports.map((reportEntry, idx) => {
          const r = reportEntry.report;
          const dateObj = new Date(reportEntry.date);
          const isLatest = idx === 0;

          return (
            <div key={reportEntry.id} className="relative pl-8 md:pl-12">
              <div className={`absolute -left-3 md:-left-3.5 top-0 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center border-4 border-slate-950 ${isLatest ? 'bg-blue-600 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-slate-600'}`}>
                {isLatest && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>

              <div className="bg-white/80 border border-slate-200 rounded-2xl p-5 md:p-8 shadow-xl hover:border-slate-200 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                   <div className="flex items-center gap-2 text-blue-600">
                     <Calendar className="w-4 h-4" />
                     <span className="font-mono text-base uppercase tracking-wider">{dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                   </div>
                   <div className="flex gap-2 text-sm font-semibold uppercase tracking-widest text-slate-600">
                     {r.mbti && <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">{r.mbti}</span>}
                     {r.enneagram && <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full border border-emerald-500/20">{r.enneagram}</span>}
                   </div>
                </div>

                {r.summary && (
                  <p className="text-slate-800 text-base md:text-base leading-relaxed mb-6">
                    {r.summary}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {r.readiness && (
                    <div className="bg-slate-100 border border-slate-200 p-8 rounded-xl flex items-center gap-4">
                      <div className="bg-rose-50 p-3 rounded-lg text-rose-600">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-600 uppercase tracking-wider">Readiness</div>
                        <div className="text-lg font-bold text-slate-900">{r.readiness.score}/100</div>
                      </div>
                    </div>
                  )}

                  {r.mbtiFunctions && r.mbtiFunctions.dominant && (
                    <div className="bg-slate-100 border border-slate-200 p-8 rounded-xl flex items-center gap-4">
                      <div className="bg-purple-500/10 p-3 rounded-lg text-purple-400">
                        <BrainCircuit className="w-6 h-6" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-medium text-slate-600 uppercase tracking-wider">Dominant Process</div>
                        <div className="text-base font-bold text-slate-900 truncate">{r.mbtiFunctions.dominant.function}</div>
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
