import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, BrainCircuit, MessageSquare, 
  ArrowRight, ShieldCheck, CheckCircle2, 
  Sliders, Gauge, Zap, HeartHandshake, FileText, ChevronRight
} from 'lucide-react';
import { AdaptiveMetrics } from '../types';
import { ADAPTIVE_QUESTIONING_EXAMPLES } from '../lib/adaptiveQuestioning';

interface AdaptiveQuestioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: AdaptiveMetrics;
  manualPreference?: string | null;
  onSelectManualPreference?: (pref: string | null) => void;
}

export function AdaptiveQuestioningModal({
  isOpen,
  onClose,
  metrics,
  manualPreference,
  onSelectManualPreference
}: AdaptiveQuestioningModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'examples' | 'science'>('examples');
  const [selectedExampleId, setSelectedExampleId] = useState<string>('concise-direct');

  if (!isOpen) return null;

  const currentExample = ADAPTIVE_QUESTIONING_EXAMPLES.find(e => e.id === selectedExampleId) || ADAPTIVE_QUESTIONING_EXAMPLES[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Adaptive Questioning System
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Live Engine
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Calibrates follow-up questions to your response length, vocabulary, and directness.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Bar */}
          <div className="flex border-b border-slate-100 px-6 bg-slate-50/50 gap-2">
            {[
              { id: 'examples', label: 'Concrete Examples & Comparisons', icon: MessageSquare },
              { id: 'profile', label: 'Live Detected Style', icon: Gauge },
              { id: 'science', label: 'Why Adaptation Improves Accuracy', icon: ShieldCheck },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-white shadow-sm -mb-px rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">

            {/* TAB 1: EXAMPLES & COMPARISONS */}
            {activeTab === 'examples' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs md:text-sm text-indigo-900 leading-relaxed flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">How Aura adapts to you:</span> Standard personality bots ask rigid, one-size-fits-all questions that feel unnatural or irritating. Aura listens to your natural length, vocabulary, and directness, then matches your preferred communication tempo to preserve natural flow and unearth deep psychometric traits.
                  </div>
                </div>

                {/* Example Selector Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ADAPTIVE_QUESTIONING_EXAMPLES.map(ex => {
                    const isSelected = ex.id === selectedExampleId;
                    return (
                      <button
                        key={ex.id}
                        onClick={() => setSelectedExampleId(ex.id)}
                        className={`p-3 rounded-2xl text-left border transition-all text-xs flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.02]'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{ex.title}</span>
                        <span className={`text-[10px] mt-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{ex.category}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Example Deep Dive Card */}
                <div className="p-6 rounded-3xl bg-slate-50/80 border border-slate-200 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{currentExample.title}</h3>
                      <p className="text-xs text-slate-500 font-sans">Archetype: {currentExample.userArchetype}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentExample.cognitiveFunctionsTargeted.map((fn, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {fn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* User Raw Input */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      1. User's Natural Communication Input
                    </span>
                    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm font-sans italic shadow-sm">
                      {currentExample.userSampleResponse}
                    </div>
                  </div>

                  {/* Comparison Side-by-Side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Rigid Standard Question */}
                    <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/90 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Rigid / Non-Adaptive Bot
                          </span>
                          <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-100/80 px-2 py-0.5 rounded">High Friction</span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-800 italic">
                          {currentExample.rigidQuestion.question}
                        </p>
                      </div>
                      <div className="text-[11px] text-rose-700 bg-white/70 p-2.5 rounded-xl border border-rose-100">
                        <span className="font-bold">The Flaw: </span>
                        {currentExample.rigidQuestion.flaw}
                      </div>
                    </div>

                    {/* Aura's Adapted Question */}
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 flex flex-col justify-between space-y-3 shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Aura's Adapted Follow-Up
                          </span>
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">Natural Flow</span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-900 italic">
                          {currentExample.adaptedQuestion.question}
                        </p>
                      </div>
                      <div className="text-[11px] text-emerald-800 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="font-bold">Why it works: </span>
                        {currentExample.adaptedQuestion.advantage}
                      </div>
                    </div>
                  </div>

                  {/* Impact Evaluation Rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-1">Conversational Flow Improvement</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{currentExample.flowImpact}</p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-sm flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 mb-1">Personality Analysis Accuracy</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{currentExample.analysisAccuracyImpact}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE DETECTED STYLE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Active Questioning Calibration
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl">
                      {metrics.strategySummary}
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white text-blue-700 border border-blue-200 shadow-sm shrink-0">
                    Avg Words: {metrics.avgWordCount} w/turn
                  </div>
                </div>

                {/* 4 Dimension Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Metric 1: Response Length */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Response Length</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        metrics.detectedLength === 'concise' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        metrics.detectedLength === 'elaborate' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {metrics.detectedLength}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {metrics.detectedLength === 'concise' && "You prefer brief, compact responses. Aura keeps its inquiries tight and punchy without winding essays."}
                      {metrics.detectedLength === 'elaborate' && "You share expansive, detailed narratives. Aura gives you room to explore and asks layered follow-ups."}
                      {metrics.detectedLength === 'balanced' && "Your responses sit at a comfortable conversational length with balanced back-and-forth cadence."}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>≤18 words (Concise)</span>
                      <span>19-54w (Balanced)</span>
                      <span>≥55w (Elaborate)</span>
                    </div>
                  </div>

                  {/* Metric 2: Vocabulary & Complexity */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Vocabulary Grade</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        metrics.detectedVocabulary === 'sophisticated' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        metrics.detectedVocabulary === 'casual' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {metrics.detectedVocabulary} ({metrics.lexicalComplexityScore}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {metrics.detectedVocabulary === 'sophisticated' && "You use articulate, nuanced, or conceptual terms. Aura mirrors this intellectual curiosity without sounding robotic."}
                      {metrics.detectedVocabulary === 'casual' && "You prefer natural, everyday conversational language. Aura speaks to you like an approachable peer."}
                      {metrics.detectedVocabulary === 'standard' && "Clear, accessible, standard phrasing that allows smooth, straightforward dialogue."}
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${metrics.lexicalComplexityScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Metric 3: Directness */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">3. Directness Ratio</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        metrics.detectedDirectness === 'direct' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        metrics.detectedDirectness === 'nuanced' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {metrics.detectedDirectness}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {metrics.detectedDirectness === 'direct' && "You state decisions and facts clearly and decisively. Aura cuts straight to the core without unnecessary hedging."}
                      {metrics.detectedDirectness === 'nuanced' && "You explore possibilities, qualifiers, and diplomatic angles. Aura uses gentle, open inquiries."}
                      {metrics.detectedDirectness === 'balanced' && "A mix of assertive statements and open-ended curiosity."}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Exploratory / Diplomatic</span>
                      <span>Decisive / Declarative</span>
                    </div>
                  </div>

                  {/* Metric 4: Cognitive Focus */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">4. Cognitive Orientation</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                        metrics.detectedFocus === 'analytical' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        metrics.detectedFocus === 'relational' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {metrics.detectedFocus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {metrics.detectedFocus === 'analytical' && "Focuses on mechanics, logic, structure, and trade-offs. Aura frames questions around problem-solving criteria."}
                      {metrics.detectedFocus === 'relational' && "Focuses on interpersonal dynamics, feelings, and social impact. Aura emphasizes empathy and interpersonal care."}
                      {metrics.detectedFocus === 'balanced' && "Harmonious balance between task analysis and human sentiment."}
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                      <div 
                        className="bg-blue-500 h-full transition-all duration-500" 
                        style={{ width: `${metrics.analyticalRatio}%` }}
                        title="Analytical weight"
                      />
                      <div 
                        className="bg-rose-400 h-full transition-all duration-500" 
                        style={{ width: `${100 - metrics.analyticalRatio}%` }}
                        title="Relational/emotional weight"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Override */}
                {onSelectManualPreference && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-800 block">Manual Style Lock (Optional)</span>
                      <span className="text-slate-500">By default, Aura dynamically detects your tone. You can optionally pin a preferred mode:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[
                        { id: null, label: 'Auto (Dynamic)' },
                        { id: 'concise', label: 'Concise' },
                        { id: 'deep', label: 'Deep / Layered' },
                        { id: 'analytical', label: 'Analytical' },
                      ].map(opt => (
                        <button
                          key={String(opt.id)}
                          onClick={() => onSelectManualPreference(opt.id)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                            manualPreference === opt.id
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: THE SCIENCE & ACCURACY */}
            {activeTab === 'science' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-3">
                    <div className="p-2.5 rounded-2xl bg-blue-600 text-white w-fit shadow-md shadow-blue-500/20">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">1. Elimination of Conversational Fatigue</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        When users receive questions that demand excessive emotional performance or verbose parsing, they experience cognitive friction. Adapting to concise or analytical preferences eliminates drop-off.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700">Higher completion rate</span>
                  </div>

                  <div className="p-5 rounded-3xl bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between space-y-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-600 text-white w-fit shadow-md shadow-indigo-500/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">2. Removal of Response Bias</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Rigid psychometric forms force users into "test-taker mode." Adaptive dialogue keeps the user in their authentic voice, revealing genuine behavioral choices rather than idealized self-descriptions.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-700">Pure behavioral data</span>
                  </div>

                  <div className="p-5 rounded-3xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between space-y-3">
                    <div className="p-2.5 rounded-2xl bg-purple-600 text-white w-fit shadow-md shadow-purple-500/20">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">3. Cognitive Function Isolation</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        By probing along the user's natural decision axes (e.g. asking a thinker about criteria rather than feelings), the AI accurately isolates dominant vs. auxiliary functions (Ti/Te vs Fi/Fe) without false misclassifications.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-purple-700">Granular MBTI accuracy</span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    Adaptive Questioning in Summary
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Rather than treating conversation as an interrogation, Aura continuously reads the rhythm of your words. When you are brief, it respects your energy. When you are philosophical, it opens the aperture. This reciprocal adaptation mirrors the subtle social calibrations of the world's most perceptive interviewers, ensuring the resulting personality report reflects who you actually are.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-sans">
              Currently applying to: <span className="font-semibold text-slate-800">Daily Chat, Voice Assessment, & Journaling</span>
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              Close Guide
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
