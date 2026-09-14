import { auth } from '../firebase';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, Plus, BarChart3, Clock, RotateCcw, Check, Sparkles, CheckCircle2, TrendingUp, Target, BrainCircuit, Sliders } from 'lucide-react';
import { ReportData } from '../types';
import { analyzeUserCommunication } from '../lib/adaptiveQuestioning';
import { AdaptiveQuestioningModal } from './AdaptiveQuestioningModal';

interface DailyChatViewProps {
  latestReport: ReportData | null;
  onAnalyzeChat: (text: string, onSuccess: () => void) => void;
  isAnalyzing: boolean;
  onSaveReport?: (reportData: ReportData, customDate?: string, logDate?: string) => void;
}

function toLocalDateKey(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayKey = toLocalDateKey(new Date());
const yesterdayKey = toLocalDateKey(new Date(Date.now() - 86400000));
const twoDaysAgoKey = toLocalDateKey(new Date(Date.now() - 2 * 86400000));
const threeDaysAgoKey = toLocalDateKey(new Date(Date.now() - 3 * 86400000));

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
  happy: ["In the zone", "On top of things", "Feeling good"],
  relaxed: ["Cruising along", "At ease", "Just chilling"],
  sad: ["Feeling down", "Drained", "Swamped", "Need a break"],
  anxious: ["Stressed", "Overthinking", "Restless", "Feeling unprepared"],
  angry: ["Frustrated", "Heated", "Pushed too far"]
};

const TIER3_VOCABULARY: Record<string, string[]> = {
  "In the zone": ["Focused", "Inspired", "Energized", "Motivated", "Productive", "Accomplished"],
  "On top of things": ["Confident", "Organized", "Pleased", "Optimistic", "Satisfied", "Proud"],
  "Feeling good": ["Upbeat", "Cheerful", "Excited", "Grateful", "Thriving", "Radiant"],
  "Feeling unstoppable": ["Upbeat", "Cheerful", "Excited", "Grateful", "Thriving", "Radiant"],
  "Cruising along": ["Carefree", "Mellow", "Content", "Steady", "Peaceful", "Balanced"],
  "At ease": ["Composed", "Settled", "Calm", "Comfortable", "Unhurried", "Restful"],
  "Just chilling": ["Unbothered", "Relaxed", "Untroubled", "Casual", "Easygoing", "Quiet"],
  "Feeling down": ["Down", "Blue", "Discouraged", "Gloomy", "Low", "Heavy"],
  "Drained": ["Drained", "Exhausted", "Depleted", "Weary", "Spent", "Burdened"],
  "Swamped": ["Swamped", "Overwhelmed", "Stuck", "Overloaded", "Stretched thin", "Bogged down"],
  "Need a break": ["Deflated", "Burned out", "Unmotivated", "Faded", "Sluggish", "Off-track"],
  "Running on empty": ["Drained", "Exhausted", "Depleted", "Weary", "Spent", "Burdened"],
  "Feeling weighed down": ["Down", "Blue", "Discouraged", "Heavy", "Swamped", "Burdened"],
  "Stressed": ["Stressed", "Pressured", "Tense", "Frazzled", "Strained", "Overburdened"],
  "Overthinking": ["Overthinking", "Worried", "Second-guessing", "Distracted", "Uneasy", "Unsettled"],
  "Restless": ["Restless", "On edge", "Jittery", "Nervous", "Antsy", "Impatient"],
  "On edge": ["Restless", "On edge", "Jittery", "Nervous", "Antsy", "Impatient"],
  "Racing thoughts": ["Overthinking", "Worried", "Distracted", "Uneasy", "Unsettled", "Frazzled"],
  "Feeling unprepared": ["Uncertain", "Hesitant", "Doubtful", "Hesitating", "Flustered", "Unready"],
  "Frustrated": ["Frustrated", "Annoyed", "Irritated", "Agitated", "Exasperated", "Bothered"],
  "Heated": ["Upset", "Ticked off", "Testy", "Grumpy", "Short-tempered", "Cross"],
  "Pushed too far": ["Fed up", "Over it", "Done", "Resentful", "Snappy", "Impatient"],
  "Feeling attacked": ["Defensive", "Resentful", "Bothered", "Heated", "Snappy", "Cross"],
  "At boiling point": ["Heated", "Fed up", "Ticked off", "Over it", "Upset", "Short-tempered"]
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

export function DailyChatView({ latestReport, onAnalyzeChat, isAnalyzing, onSaveReport }: DailyChatViewProps) {
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

  const [targetDateKey, setTargetDateKey] = useState<string>(todayKey);
  const [checkinsByDate, setCheckinsByDate] = useState<Record<string, { moodStr: string; tier1: string; tier2: string; tier3: string; timestamp: string }>>(() => {
    try {
      const saved = localStorage.getItem('aura_mood_checkins_by_date');
      if (saved) return JSON.parse(saved);
      const oldMood = localStorage.getItem('daily_chat_mood');
      if (oldMood) {
        return { [todayKey]: { moodStr: oldMood, tier1: 'happy', tier2: '', tier3: '', timestamp: new Date().toISOString() } };
      }
    } catch (e) {}
    return {};
  });

  useEffect(() => {
    localStorage.setItem('aura_mood_checkins_by_date', JSON.stringify(checkinsByDate));
  }, [checkinsByDate]);

  const currentDayCheckin = checkinsByDate[targetDateKey] || null;

  // Mood selector dynamic state
  const [tier1, setTier1] = useState<string | null>(null);
  const [tier2, setTier2] = useState<string | null>(null);
  const [tier3, setTier3] = useState<string | null>(null);
  const [chatWarning, setChatWarning] = useState<string | null>(null);

  // Custom Tier 2 & Tier 3 words stored in localStorage
  const [customTier2Map, setCustomTier2Map] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('aura_custom_tier2_words');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [customTier3Map, setCustomTier3Map] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('aura_custom_tier3_words');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Dynamic user input state
  const [isAddingCustomTier2, setIsAddingCustomTier2] = useState(false);
  const [customTier2Input, setCustomTier2Input] = useState('');
  const [isAddingCustomTier3, setIsAddingCustomTier3] = useState(false);
  const [customTier3Input, setCustomTier3Input] = useState('');

  const activeTier2Options = useMemo(() => {
    if (!tier1) return [];
    const defaults = TIER2_OPTIONS[tier1] || [];
    const customs = customTier2Map[tier1] || [];
    return Array.from(new Set([...defaults, ...customs]));
  }, [tier1, customTier2Map]);

  const activeTier3Options = useMemo(() => {
    if (!tier2) return [];
    const defaults = TIER3_VOCABULARY[tier2] || [];
    const customs = customTier3Map[tier2] || [];
    return Array.from(new Set([...defaults, ...customs]));
  }, [tier2, customTier3Map]);

  const handleAddCustomTier2 = () => {
    const trimmed = customTier2Input.trim();
    if (!trimmed || !tier1) return;
    const existing = customTier2Map[tier1] || [];
    if (!existing.includes(trimmed)) {
      const updated = { ...customTier2Map, [tier1]: [...existing, trimmed] };
      setCustomTier2Map(updated);
      localStorage.setItem('aura_custom_tier2_words', JSON.stringify(updated));
    }
    setTier2(trimmed);
    setTier3(null);
    setCustomTier2Input('');
    setIsAddingCustomTier2(false);
  };

  const handleAddCustomTier3 = () => {
    const trimmed = customTier3Input.trim();
    if (!trimmed || !tier2) return;
    const existing = customTier3Map[tier2] || [];
    if (!existing.includes(trimmed)) {
      const updated = { ...customTier3Map, [tier2]: [...existing, trimmed] };
      setCustomTier3Map(updated);
      localStorage.setItem('aura_custom_tier3_words', JSON.stringify(updated));
    }
    setTier3(trimmed);
    setCustomTier3Input('');
    setIsAddingCustomTier3(false);
  };

  // Adaptive Questioning System State
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);
  const [manualPreference, setManualPreference] = useState<string | null>(() => {
    try {
      return localStorage.getItem('aura_manual_question_style');
    } catch {
      return null;
    }
  });

  const handleSelectManualPreference = (pref: string | null) => {
    setManualPreference(pref);
    try {
      if (pref) {
        localStorage.setItem('aura_manual_question_style', pref);
      } else {
        localStorage.removeItem('aura_manual_question_style');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const adaptiveMetrics = useMemo(() => {
    return analyzeUserCommunication(chatHistory);
  }, [chatHistory]);

  // Reset handler: Auto-reset Tier 2 and Tier 3 whenever Tier 1 changes
  const handleSelectTier1 = (moodId: string) => {
    setTier1(moodId);
    setTier2(null);
    setTier3(null);
    setIsAddingCustomTier2(false);
    setIsAddingCustomTier3(false);
    setCustomTier2Input('');
    setCustomTier3Input('');
  };

  useEffect(() => {
    setTier2(null);
    setTier3(null);
    setIsAddingCustomTier2(false);
    setIsAddingCustomTier3(false);
    setCustomTier2Input('');
    setCustomTier3Input('');
  }, [tier1]);

  useEffect(() => {
    setTier3(null);
    setIsAddingCustomTier3(false);
    setCustomTier3Input('');
  }, [tier2]);

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

  useEffect(() => {
    const handleOnlineSync = async () => {
      try {
        const queued = JSON.parse(localStorage.getItem('offline_checkins') || '[]');
        if (queued.length > 0) {
          for (const checkin of queued) {
            try {
              await fetch('/api/daily-chat', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  profile: latestReport,
                  history: [],
                  message: `Synced offline mood check-in: ${checkin.moodStr}`,
                  mood: checkin.moodStr
                }),
              });
            } catch (err) {}
          }
          localStorage.removeItem('offline_checkins');
          setChatWarning("You are back online! Offline check-ins have been synced successfully.");
        }
      } catch (e) {}
    };

    window.addEventListener('online', handleOnlineSync);
    return () => window.removeEventListener('online', handleOnlineSync);
  }, [latestReport]);

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
          mood: selectedMood,
          manualPreference
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
    
    const targetDateObj = new Date(targetDateKey + 'T12:00:00');
    const timestampStr = targetDateObj.toISOString();

    const updatedCheckins = {
      ...checkinsByDate,
      [targetDateKey]: {
        moodStr,
        tier1: t1,
        tier2: t2,
        tier3: t3,
        timestamp: timestampStr
      }
    };
    setCheckinsByDate(updatedCheckins);

    if (targetDateKey === todayKey) {
      setSelectedMood(moodStr);
      localStorage.setItem('last_checkin_date', new Date().toLocaleDateString());
    }

    if (onSaveReport) {
      const moodReport: ReportData = {
        casualSummary: moodStr,
        summary: `Mood check-in for ${targetDateKey}: ${moodStr}`,
        readiness: {
          score: t1 === 'happy' ? 85 : t1 === 'relaxed' ? 70 : t1 === 'anxious' ? 45 : t1 === 'sad' ? 35 : 25,
          explanation: `Core emotion: ${coreLabel}, Refinement: ${t2}, Descriptor: ${t3}`,
          correlation: 'Mood logged via Interactive Mood Mapping'
        },
        sentimentAnalysis: {
          overallSentiment: coreLabel,
          shifts: [t2, t3],
          summary: `Check-in logged for ${targetDateKey}: ${moodStr}`
        }
      };
      onSaveReport(moodReport, timestampStr, targetDateKey);
    }

    const dateDisplayName = targetDateKey === todayKey ? 'today' : targetDateKey === yesterdayKey ? 'yesterday' : targetDateKey;
    const systemText = `I have logged my mood for ${dateDisplayName}:\n• Core Emotion: ${coreLabel}\n• Refinement: ${t2}\n• Descriptor: ${t3}`;
    const timestamp = targetDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory: { role: 'user' | 'model'; text: string; timestamp?: string }[] = [
      ...chatHistory, 
      { role: 'user' as const, text: systemText, timestamp }
    ];
    setChatHistory(newHistory);

    if (!navigator.onLine) {
      const offlineCheckin = {
        timestamp: new Date().toISOString(),
        tier1: t1,
        tier2: t2,
        tier3: t3,
        moodStr
      };
      try {
        const existing = JSON.parse(localStorage.getItem('offline_checkins') || '[]');
        existing.push(offlineCheckin);
        localStorage.setItem('offline_checkins', JSON.stringify(existing));
      } catch (e) {}

      setChatWarning("Log saved locally. AI analysis will run when you reconnect.");
      setChatHistory([
        ...newHistory,
        {
          role: 'model',
          text: `Log saved locally. AI analysis will run when you reconnect. (Recorded: "${moodStr}")`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      return;
    }

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
      const isNegativeMood = ['sad', 'anxious', 'angry'].includes(t1);
      const fallbackAck = isNegativeMood
        ? `I have recorded your mood as "${moodStr}". Thank you for sharing that with me—I'm here if you'd like to talk through what's on your mind.`
        : `I have recorded your mood as "${moodStr}" and added it to your timeline history.`;

      setChatHistory([
        ...newHistory, 
        { 
          role: 'model', 
          text: fallbackAck,
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
    setIsAddingCustomTier2(false);
    setIsAddingCustomTier3(false);
    setCustomTier2Input('');
    setCustomTier3Input('');
    localStorage.setItem('last_checkin_date', new Date().toLocaleDateString());
    setConfirmReset(false);
  };

  const handleAnalyze = () => {
    setChatWarning(null);
    const allUserText = chatHistory
       .filter(h => h.role === 'user')
       .map(h => h.text)
       .join('\n\n');
       
    if (allUserText.trim().length < 20) {
      setChatWarning("You might want to chat a bit more first so we have enough context to analyze your traits!");
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

        {/* Progress Takeaway Summary Card */}
        {latestReport ? (() => {
          const readinessScore = latestReport.readiness?.score;
          const mainSummary = latestReport.casualSummary || latestReport.summary || latestReport.sentimentAnalysis?.summary || latestReport.readiness?.explanation;
          const archetype = [latestReport.mbti, latestReport.enneagram ? `Type ${latestReport.enneagram}` : null].filter(Boolean).join(' • ');
          const sentiment = latestReport.sentimentAnalysis?.overallSentiment;
          const topInsight = latestReport.actionableInsights && latestReport.actionableInsights.length > 0 ? latestReport.actionableInsights[0] : null;

          let readinessBadge = null;
          if (typeof readinessScore === 'number') {
            if (readinessScore >= 75) {
              readinessBadge = { label: `${readinessScore}% High Readiness`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            } else if (readinessScore >= 45) {
              readinessBadge = { label: `${readinessScore}% Balanced Readiness`, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
            } else {
              readinessBadge = { label: `${readinessScore}% Rest Needed`, color: 'bg-amber-50 text-amber-700 border-amber-200' };
            }
          }

          return (
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white border border-blue-200/80 shadow-xl flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      Latest Progress Takeaway
                    </h3>
                    <p className="text-xs text-slate-500 font-sans">
                      High-level takeaway from your most recent saved analysis
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {readinessBadge && (
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${readinessBadge.color}`}>
                      {readinessBadge.label}
                    </span>
                  )}
                  {archetype && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {archetype}
                    </span>
                  )}
                  {sentiment && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                      {sentiment}
                    </span>
                  )}
                </div>
              </div>

              {mainSummary && (
                <p className="text-slate-700 text-sm md:text-base leading-relaxed font-sans">
                  {mainSummary}
                </p>
              )}

              {topInsight && (
                <div className="p-4 rounded-2xl bg-white/80 border border-blue-100/80 flex items-start gap-3 text-xs md:text-sm shadow-sm">
                  <Target className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-900">{topInsight.title}: </span>
                    <span className="text-slate-600">{topInsight.insight}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })() : (
          <div className="p-6 rounded-3xl bg-white/80 border border-slate-200/80 shadow-md flex items-center gap-4 text-slate-600 text-sm">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-base">No Progress Report Yet</p>
              <p className="text-xs text-slate-500">
                Chat with Aura or run "Analyze Day" to unlock high-level takeaways and progress insights here!
              </p>
            </div>
          </div>
        )}

        {chatWarning && (
          <div className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl flex items-center justify-between text-sm shadow-sm">
            <span>{chatWarning}</span>
            <button onClick={() => setChatWarning(null)} className="text-amber-600 font-semibold text-xs uppercase hover:underline ml-4">Dismiss</button>
          </div>
        )}

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

          {/* Missed Day Indicator Banner */}
          {!checkinsByDate[yesterdayKey] && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between text-xs md:text-sm shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-amber-900">Missed yesterday's reflection?</span>
                  <p className="text-amber-700">Quickly catch up and log yesterday's mood to keep your trends complete.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTargetDateKey(yesterdayKey);
                  setTier1(null);
                  setTier2(null);
                  setTier3(null);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0"
              >
                Log Yesterday
              </button>
            </div>
          )}

          {/* Target Date Selector */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Target Date</span>
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
              {[
                { key: todayKey, label: 'Today' },
                { key: yesterdayKey, label: 'Yesterday' },
                { key: twoDaysAgoKey, label: '2 Days Ago' },
                { key: threeDaysAgoKey, label: '3 Days Ago' }
              ].map(d => {
                const isSelected = targetDateKey === d.key;
                const hasLogged = !!checkinsByDate[d.key];
                return (
                  <button
                    key={d.key}
                    onClick={() => {
                      setTargetDateKey(d.key);
                      setTier1(null);
                      setTier2(null);
                      setTier3(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <span>{d.label}</span>
                    {hasLogged && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          {currentDayCheckin ? (
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
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider font-mono">
                    {targetDateKey === todayKey ? "Today's" : targetDateKey === yesterdayKey ? "Yesterday's" : targetDateKey} Mood Logged
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{currentDayCheckin.moodStr}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const copy = { ...checkinsByDate };
                  delete copy[targetDateKey];
                  setCheckinsByDate(copy);
                  if (targetDateKey === todayKey) setSelectedMood(null);
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
                        onClick={() => handleSelectTier1(mood.id)}
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
                {tier1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden border-t border-slate-100 pt-5 space-y-3"
                  >
                    <span className="text-sm font-bold text-slate-700 block uppercase tracking-wider font-mono">Tier 2: Refine the Feeling</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTier2Options.map(option => {
                        const isSelected = tier2 === option;
                        return (
                          <button
                            key={option}
                            id={`mood-tier2-${option.replace(/\s+/g, '-').toLowerCase()}`}
                            onClick={() => {
                              setTier2(option);
                              setIsAddingCustomTier2(false);
                            }}
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

                      {/* Add Custom Tier 2 Option */}
                      {isAddingCustomTier2 ? (
                        <div className="flex items-center gap-1.5 bg-white border border-blue-400 rounded-xl px-2.5 py-1 shadow-sm">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Custom feeling..."
                            value={customTier2Input}
                            onChange={(e) => setCustomTier2Input(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomTier2();
                              } else if (e.key === 'Escape') {
                                setIsAddingCustomTier2(false);
                                setCustomTier2Input('');
                              }
                            }}
                            className="text-sm font-medium text-slate-800 outline-none w-36 sm:w-44 bg-transparent placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomTier2}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCustomTier2(false);
                              setCustomTier2Input('');
                            }}
                            className="text-slate-400 hover:text-slate-600 text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id="add-custom-tier2-btn"
                          onClick={() => setIsAddingCustomTier2(true)}
                          className="px-3.5 py-2 rounded-xl text-sm font-medium border border-dashed border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-600 hover:text-blue-600 transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Add Custom</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tier 3 (Dynamic Vocabulary Choices & Save Log) */}
              <AnimatePresence>
                {tier2 && (
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

                    <div className="flex flex-wrap items-center gap-2">
                      {activeTier3Options.map(word => {
                        const isSelected = tier3 === word;
                        return (
                          <button
                            key={word}
                            id={`mood-tier3-${word.toLowerCase()}`}
                            onClick={() => {
                              setTier3(word);
                              setIsAddingCustomTier3(false);
                            }}
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

                      {/* Add Custom Tier 3 Option */}
                      {isAddingCustomTier3 ? (
                        <div className="flex items-center gap-1.5 bg-white border border-indigo-400 rounded-xl px-2.5 py-1 shadow-sm">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Custom descriptor..."
                            value={customTier3Input}
                            onChange={(e) => setCustomTier3Input(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCustomTier3();
                              } else if (e.key === 'Escape') {
                                setIsAddingCustomTier3(false);
                                setCustomTier3Input('');
                              }
                            }}
                            className="text-sm font-medium text-slate-800 outline-none w-36 sm:w-44 bg-transparent placeholder:text-slate-400"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomTier3}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCustomTier3(false);
                              setCustomTier3Input('');
                            }}
                            className="text-slate-400 hover:text-slate-600 text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          id="add-custom-tier3-btn"
                          onClick={() => setIsAddingCustomTier3(true)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium border border-dashed border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/50 text-slate-600 hover:text-indigo-600 transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Custom</span>
                        </button>
                      )}
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
        <div className="bg-white/40 border border-slate-200 backdrop-blur-md rounded-3xl p-8 shadow-xl flex flex-col h-[540px]">
           
            {/* Adaptive Questioning Status Bar */}
            <div className="flex flex-wrap items-center justify-between pb-4 mb-3 border-b border-slate-200/80 gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/40" />
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 font-sans">
                  <span>Adaptive Flow:</span>
                  <span className="text-blue-600 font-bold capitalize">
                    {manualPreference 
                      ? `Locked (${manualPreference})` 
                      : `${adaptiveMetrics.detectedLength} • ${adaptiveMetrics.detectedFocus}`}
                  </span>
                </div>
                <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
                  ({adaptiveMetrics.avgWordCount} avg words/turn)
                </span>
              </div>

              <button
                id="view-adaptive-system-btn"
                onClick={() => setIsAdaptiveModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
                title="Explore adaptive questioning examples and accuracy impacts"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
                <span>Adaptive Engine & Examples</span>
              </button>
            </div>

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

        {/* Adaptive Questioning System Modal */}
        <AdaptiveQuestioningModal
          isOpen={isAdaptiveModalOpen}
          onClose={() => setIsAdaptiveModalOpen(false)}
          metrics={adaptiveMetrics}
          manualPreference={manualPreference}
          onSelectManualPreference={handleSelectManualPreference}
        />
      </div>
    </motion.div>
  );
}
