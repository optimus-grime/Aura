import { auth } from '../firebase';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, Plus, BarChart3, Clock, RotateCcw, Check, Sparkles, CheckCircle2 } from 'lucide-react';
import { ReportData } from '../types';

interface DailyChatViewProps {
  latestReport: ReportData | null;
  onAnalyzeChat: (text: string, onSuccess: () => void) => void;
  isAnalyzing: boolean;
}

const TIER1_MOODS = [
  { 
    id: 'happy', 
    label: 'Happy', 
    gradient: 'radial-gradient(circle at 30% 30%, #34d399 0%, #10b981 50%, #064e3b 100%)', 
    selectedClass: 'shadow-[0_0_25px_rgba(16,185,129,0.55)] border-emerald-500/50 bg-white/90 scale-105 ring-2 ring-emerald-500/20' 
  },
  { 
    id: 'relaxed', 
    label: 'Relaxed', 
    gradient: 'radial-gradient(circle at 30% 30%, #22d3ee 0%, #06b6d4 50%, #164e63 100%)', 
    selectedClass: 'shadow-[0_0_25px_rgba(6,182,212,0.55)] border-cyan-500/50 bg-white/90 scale-105 ring-2 ring-cyan-500/20' 
  },
  { 
    id: 'sad', 
    label: 'Sad / Low Energy', 
    gradient: 'radial-gradient(circle at 30% 30%, #60a5fa 0%, #2563eb 50%, #1e3a8a 100%)', 
    selectedClass: 'shadow-[0_0_25px_rgba(37,99,235,0.55)] border-blue-500/50 bg-white/90 scale-105 ring-2 ring-blue-500/20' 
  },
  { 
    id: 'anxious', 
    label: 'Anxious', 
    gradient: 'radial-gradient(circle at 30% 30%, #fbbf24 0%, #f59e0b 50%, #78350f 100%)', 
    selectedClass: 'shadow-[0_0_25px_rgba(245,158,11,0.55)] border-amber-500/50 bg-white/90 scale-105 ring-2 ring-amber-500/20' 
  },
  { 
    id: 'angry', 
    label: 'Angry / Frustrated', 
    gradient: 'radial-gradient(circle at 30% 30%, #fb7185 0%, #e11d48 50%, #4c0519 100%)', 
    selectedClass: 'shadow-[0_0_25px_rgba(225,29,72,0.55)] border-rose-500/50 bg-white/90 scale-105 ring-2 ring-rose-500/20' 
  }
];

const TIER2_OPTIONS: Record<string, string[]> = {
  happy: ["In the zone", "On top of things", "Clear & focused"],
  relaxed: ["Cruising along", "Steady & calm", "Just chilling"],
  sad: ["Running on empty", "Foggy & slow", "Need a break"],
  anxious: ["On edge", "Restless", "Racing thoughts"],
  angry: ["Overwhelmed", "Irritated", "Tense"]
};

const TIER3_VOCABULARY: Record<string, string[]> = {
  "In the zone": ["Focused", "Inspired", "Energized", "Motivated", "Ambitious", "Accomplished"],
  "On top of things": ["Confident", "Empowered", "Pleased", "Optimistic", "Satisfied", "Proud"],
  "Clear & focused": ["Calm", "Peaceful", "Zen", "Mindful", "Contemplative", "Thoughtful"],
  "Cruising along": ["Carefree", "Mellow", "Content", "Chill", "Lighthearted", "Bright"],
  "Steady & calm": ["Composed", "Serene", "Settled", "Tranquil", "Comforted", "Safe"],
  "Just chilling": ["Chilled", "Relaxed", "Apathetic", "Quiet", "Unbothered", "Lazy"],
  "Running on empty": ["Depleted", "Drained", "Exhausted", "Weary", "Lethargic", "Downcast"],
  "Foggy & slow": ["Listless", "Groggy", "Confused", "Apathetic", "Slow", "Lost"],
  "Need a break": ["Overwhelmed", "Stressed", "Tired", "Deflated", "Blue", "Glum"],
  "On edge": ["Antsy", "Uneasy", "Tense", "Edgy", "Jittery", "Nervous"],
  "Restless": ["Restless", "Aflutter", "Jumpy", "Agitated", "Fretful", "Unsettled"],
  "Racing thoughts": ["Apprehensive", "Panicked", "Overwhelmed", "Worried", "Fearful", "Bewildered"],
  "Overwhelmed": ["Stressed", "Frustrated", "Tense", "Irritated", "Distressed", "Agitated"],
  "Irritated": ["Annoyed", "Cranky", "Bothered", "Aggravated", "Grumpy", "Touchy"],
  "Tense": ["Uptight", "Irritated", "Hostile", "Restless", "Oppressed", "Tense"]
};

const CONTAINER_AMBIENT_STYLES: Record<string, { bg: string; border: string; shadow: string }> = {
  happy: {
    bg: 'bg-emerald-50/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/10 via-white/80 to-emerald-50/5',
    border: 'border-emerald-500/20',
    shadow: 'shadow-[0_20px_45px_rgba(16,185,129,0.08)]'
  },
  relaxed: {
    bg: 'bg-cyan-50/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-100/10 via-white/80 to-cyan-50/5',
    border: 'border-cyan-500/20',
    shadow: 'shadow-[0_20px_45px_rgba(6,182,212,0.08)]'
  },
  sad: {
    bg: 'bg-blue-50/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/10 via-white/80 to-blue-50/5',
    border: 'border-blue-500/20',
    shadow: 'shadow-[0_20px_45px_rgba(37,99,235,0.08)]'
  },
  anxious: {
    bg: 'bg-amber-50/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/10 via-white/80 to-amber-50/5',
    border: 'border-amber-500/20',
    shadow: 'shadow-[0_20px_45px_rgba(245,158,11,0.08)]'
  },
  angry: {
    bg: 'bg-rose-50/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100/10 via-white/80 to-rose-50/5',
    border: 'border-rose-500/20',
    shadow: 'shadow-[0_20px_45px_rgba(225,29,72,0.08)]'
  }
};

export function DailyChatView({ latestReport, onAnalyzeChat, isAnalyzing }: DailyChatViewProps) {
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string; timestamp?: string }[]>(() => {
    const saved = localStorage.getItem('daily_chat_history');
    const lastCheckinDate = localStorage.getItem('last_checkin_date');
    const today = new Date().toLocaleDateString();
    
    if (saved && lastCheckinDate && lastCheckinDate !== today) {
      return [{ 
        role: 'model', 
        text: "Another day! How has it been going so far? Anything on your mind?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
    }
    
    return saved ? JSON.parse(saved) : [{ 
      role: 'model', 
      text: "Hello! Let's do a daily check-in. How was your day today? Did anything significant or interesting happen?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
  });

  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Core selected mood state (persistent)
  const [selectedMood, setSelectedMood] = useState<string | null>(() => {
    const lastCheckinDate = localStorage.getItem('last_checkin_date');
    const today = new Date().toLocaleDateString();
    if (lastCheckinDate && lastCheckinDate !== today) return null;
    return localStorage.getItem('daily_chat_mood') || null;
  });

  // Mood selector dynamic state
  const [tier1, setTier1] = useState<string | null>(null);
  const [tier2, setTier2] = useState<string | null>(null);
  const [tier3, setTier3] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('daily_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    if (selectedMood) {
      localStorage.setItem('daily_chat_mood', selectedMood);
    } else {
      localStorage.removeItem('daily_chat_mood');
    }
  }, [selectedMood]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatLoading]);

  // When tier2 changes, pre-select the first word of tier3 automatically to keep UX slick
  useEffect(() => {
    if (tier2 && TIER3_VOCABULARY[tier2]) {
      setTier3(TIER3_VOCABULARY[tier2][0]);
    } else {
      setTier3(null);
    }
  }, [tier2]);

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    localStorage.setItem('last_checkin_date', new Date().toLocaleDateString());
    
    const userMsg = chatInput.trim();
    setChatInput('');
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory: { role: 'user' | 'model'; text: string; timestamp?: string }[] = [
      ...chatHistory, 
      { role: 'user' as const, text: userMsg, timestamp }
    ];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/daily-chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          profile: latestReport,
          history: chatHistory.map(h => ({ role: h.role, text: h.text })),
          message: userMsg,
          mood: selectedMood
        }),
      });
      
      if (!response.ok) throw new Error('Reply failed');
      const data = await response.json();
      
      setChatHistory([
        ...newHistory, 
        { 
          role: 'model', 
          text: data.reply, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } catch (e: any) {
      console.error(e);
      setChatHistory([
        ...newHistory, 
        { 
          role: 'model', 
          text: "I'm having a little trouble connecting right now, but please continue sharing. How did that make you feel?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const submitLoggedMood = async (t1: string, t2: string, t3: string) => {
    const coreLabel = TIER1_MOODS.find(m => m.id === t1)?.label || t1;
    const moodStr = `${coreLabel} - ${t2} (${t3})`;
    
    setSelectedMood(moodStr);
    localStorage.setItem('last_checkin_date', new Date().toLocaleDateString());

    const systemText = `I have logged my mood for today:\n• Core Emotion: ${coreLabel}\n• Refinement: ${t2}\n• Descriptor: ${t3}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory: { role: 'user' | 'model'; text: string; timestamp?: string }[] = [
      ...chatHistory, 
      { role: 'user' as const, text: systemText, timestamp }
    ];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/daily-chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: latestReport,
          history: chatHistory.map(h => ({ role: h.role, text: h.text })),
          message: systemText,
          mood: moodStr
        }),
      });
      
      if (!response.ok) throw new Error('Reply failed');
      const data = await response.json();
      
      setChatHistory([
        ...newHistory, 
        { 
          role: 'model', 
          text: data.reply, 
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
    } catch (e: any) {
      console.error(e);
      setChatHistory([
        ...newHistory, 
        { 
          role: 'model', 
          text: `Great choice! I have recorded your mood as "${moodStr}" and added it to your timeline history.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const [confirmReset, setConfirmReset] = useState(false);

  const startNewDay = (force = true) => {
    setChatHistory([{
      role: 'model',
      text: "Another day! How has it been going so far? Anything on your mind?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setSelectedMood(null);
    setTier1(null);
    setTier2(null);
    setTier3(null);
    localStorage.setItem('last_checkin_date', new Date().toLocaleDateString());
    setConfirmReset(false);
  };

  const handleAnalyze = () => {
    const allUserText = chatHistory
       .filter(h => h.role === 'user')
       .map(h => h.text)
       .join('\n\n');
       
    if (allUserText.trim().length < 20) {
      alert("You might want to chat a bit more first so we have enough context to analyze your traits!");
      return;
    }
    
    let textToSend = allUserText;
    if (selectedMood) {
      textToSend = `[User recorded their overall mood today as: ${selectedMood}]\n\n${allUserText}`;
    }
    
    onAnalyzeChat(textToSend, () => {
      startNewDay(true);
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full flex items-start justify-center mt-8 pb-20"
    >
      <div className="w-full max-w-3xl flex flex-col space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white backdrop-blur-md rounded-2xl border border-slate-200 p-8 shadow-xl gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Daily Check-In</h2>
              <p className="text-slate-600 mt-2 text-base leading-relaxed max-w-lg">
                Log your significant moments and feelings throughout the day. When you're ready, analyze the conversation to update your personality and emotional readiness profile in the Trends tab.
              </p>
            </div>
            
            <div className="flex flex-row gap-3 w-full md:w-auto">
                <button 
                  onClick={() => {
                    if (confirmReset) {
                      startNewDay(true);
                    } else {
                      setConfirmReset(true);
                      setTimeout(() => setConfirmReset(false), 3000);
                    }
                  }}
                  className={`flex-1 md:flex-initial px-6 py-2 rounded-xl transition-colors border flex items-center justify-center space-x-3 text-base font-medium ${
                    confirmReset 
                      ? 'bg-rose-500/20 text-rose-600 border-rose-500/50' 
                      : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-transparent hover:border-rose-200'
                  }`}
                >
                  <RotateCcw className={`w-4 h-4 ${confirmReset ? 'animate-spin-once' : ''}`} />
                  <span>{confirmReset ? 'Sure?' : 'Reset Chat'}</span>
                </button>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || chatHistory.filter(h => h.role === 'user').length === 0}
                  className="flex-1 md:flex-initial px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Day'}</span>
                </button>
            </div>
        </div>

        {/* Tap-to-Refine 3-Tier Mood Selector */}
        <div className={`p-8 rounded-3xl flex flex-col space-y-6 border transition-all duration-500 ease-in-out ${
          tier1 && CONTAINER_AMBIENT_STYLES[tier1]
            ? `${CONTAINER_AMBIENT_STYLES[tier1].bg} ${CONTAINER_AMBIENT_STYLES[tier1].border} ${CONTAINER_AMBIENT_STYLES[tier1].shadow}`
            : 'bg-white/80 border-slate-200 shadow-xl'
        }`}>
          <div className="flex flex-col space-y-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Interactive Mood Mapping
            </h3>
            <p className="text-sm text-slate-500 font-sans">
              Choose your primary emotion, refine the mindset, and select a precise descriptor word.
            </p>
          </div>

          {selectedMood ? (
            /* Logged State Summary Card */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider font-mono">Today's Mood Logged</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{selectedMood}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMood(null);
                  setTier1(null);
                  setTier2(null);
                  setTier3(null);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                Change Mood Log
              </button>
            </motion.div>
          ) : (
            /* Interactive 3-Tier Form */
            <div className="flex flex-col space-y-6">
              
              {/* Tier 1 Matrix Grid (Core Emotions) */}
              <div className="space-y-3">
                <span className="text-sm font-bold text-slate-700 block uppercase tracking-wider font-mono">Tier 1: Select Core Emotion</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {TIER1_MOODS.map(mood => {
                    const isSelected = tier1 === mood.id;
                    return (
                      <button
                        key={mood.id}
                        id={`mood-tier1-${mood.id}`}
                        onClick={() => {
                          setTier1(mood.id);
                          setTier2(null);
                        }}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                          isSelected 
                            ? mood.selectedClass 
                            : 'bg-white/40 backdrop-blur-md border-slate-200/60 hover:border-slate-300 hover:bg-white/70 hover:scale-[1.02]'
                        }`}
                      >
                        {/* Glowing 3D Glass Sphere background containing ONLY the eyes drawn via clean inline SVGs */}
                        <div 
                          style={{ background: mood.gradient }}
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-inner ${isSelected ? 'scale-110' : 'group-hover:scale-105 opacity-95'}`}
                        >
                          {/* 3D Glass reflection overlay */}
                          <div 
                            className="absolute inset-0 rounded-full opacity-60" 
                            style={{ 
                              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.3) 100%)' 
                            }} 
                          />
                          
                          {/* Mascot eyes only (no mouth) with light glow */}
                          <div className="relative z-10 flex items-center justify-center">
                            {mood.id === 'happy' && (
                              <svg className="w-10 h-5 text-white" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.95))" }} viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round">
                                <path d="M10,18 C13,10 17,10 20,18" />
                                <path d="M28,18 C31,10 35,10 38,18" />
                              </svg>
                            )}
                            {mood.id === 'relaxed' && (
                              <svg className="w-10 h-5 text-white" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.95))" }} viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round">
                                <line x1="10" y1="12" x2="20" y2="12" />
                                <line x1="28" y1="12" x2="38" y2="12" />
                              </svg>
                            )}
                            {mood.id === 'sad' && (
                              <svg className="w-10 h-5 text-white" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.95))" }} viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round">
                                <line x1="11" y1="19" x2="16" y2="14" />
                                <line x1="37" y1="19" x2="32" y2="14" />
                              </svg>
                            )}
                            {mood.id === 'anxious' && (
                              <svg className="w-10 h-5 text-white" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.95))" }} viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                                <line x1="16" y1="7" x2="18" y2="17" />
                                <line x1="32" y1="7" x2="30" y2="17" />
                              </svg>
                            )}
                            {mood.id === 'angry' && (
                              <svg className="w-10 h-5 text-white" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.95))" }} viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round">
                                <path d="M10,10 L18,16" />
                                <path d="M38,10 L30,16" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-800 mt-3 text-center tracking-wide">{mood.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tier 2 (Dynamic Refinements) */}
              <AnimatePresence>
                {tier1 && TIER2_OPTIONS[tier1] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-slate-100 pt-5 space-y-3"
                  >
                    <span className="text-sm font-bold text-slate-700 block uppercase tracking-wider font-mono">Tier 2: Refine the Feeling</span>
                    <div className="flex flex-wrap gap-2">
                      {TIER2_OPTIONS[tier1].map(option => {
                        const isSelected = tier2 === option;
                        return (
                          <button
                            key={option}
                            id={`mood-tier2-${option.replace(/\s+/g, '-').toLowerCase()}`}
                            onClick={() => setTier2(option)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 flex items-center gap-2 ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/15'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tier 3 (Dynamic Vocabulary Choices & Save Log) */}
              <AnimatePresence>
                {tier2 && TIER3_VOCABULARY[tier2] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-slate-100 pt-5 space-y-4"
                  >
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-bold text-slate-700 block uppercase tracking-wider font-mono">Tier 3: Precise Descriptor</span>
                      <p className="text-xs text-slate-400 font-sans">Tap the word that matches your state closest:</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {TIER3_VOCABULARY[tier2].map(word => {
                        const isSelected = tier3 === word;
                        return (
                          <button
                            key={word}
                            id={`mood-tier3-${word.toLowerCase()}`}
                            onClick={() => setTier3(word)}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold ring-2 ring-indigo-500/20'
                                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>

                    {/* Submit Section */}
                    <div className="flex items-center justify-end pt-2">
                      <button
                        id="save-mood-log-btn"
                        onClick={() => {
                          if (tier1 && tier2 && tier3) {
                            submitLoggedMood(tier1, tier2, tier3);
                          }
                        }}
                        disabled={!tier1 || !tier2 || !tier3}
                        className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-600/10 transition-all duration-200 active:scale-95 text-base"
                      >
                        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                        <span>Save Log</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="bg-white/40 border border-slate-200 backdrop-blur-md rounded-3xl p-8 shadow-xl flex flex-col h-[500px]">
           
            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar pb-6">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl p-6 md:p-8 shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none font-sans' 
                          : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200 font-sans'
                      }`}>
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/50">
                          <Clock className="w-3 h-3" />
                          {msg.timestamp || 'Now'}
                      </span>
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl p-6 md:p-8 rounded-bl-none border border-slate-200">
                    <div className="flex space-x-1.5 items-center h-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="relative group mt-4 shrink-0">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message your journal... (Shift+Enter for new line)"
                className="w-full bg-white border border-slate-200 rounded-2xl pl-5 pr-14 py-5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none h-[64px] shadow-xl text-base"
                rows={1}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isChatLoading}
                className="absolute right-2 bottom-2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-colors shadow-md"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            
        </div>
      </div>
    </motion.div>
  );
}
