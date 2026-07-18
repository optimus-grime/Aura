import { auth } from '../firebase';
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Send, Plus, BarChart3, Clock, RotateCcw } from 'lucide-react';
import { ReportData } from '../types';
import { RobotFace } from './RobotFace';

interface DailyChatViewProps {
  latestReport: ReportData | null;
    onAnalyzeChat: (text: string, onSuccess: () => void) => void;
  isAnalyzing: boolean;
}

const MOODS = [
  { emoji: '😄', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '🥱', label: 'Tired' },
  { emoji: '😥', label: 'Anxious' },
  { emoji: '😠', label: 'Frustrated' },
  { emoji: '😔', label: 'Sad' },
];

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

  const [selectedMood, setSelectedMood] = useState<string | null>(() => {
    const lastCheckinDate = localStorage.getItem('last_checkin_date');
    const today = new Date().toLocaleDateString();
    if (lastCheckinDate && lastCheckinDate !== today) return null;
    return localStorage.getItem('daily_chat_mood') || null;
  });

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

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    // Set last checkin date when they actually start chatting for the day
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
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 'Content-Type': 'application/json' },
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
       localStorage.setItem('last_checkin_date', new Date().toLocaleDateString());
       setConfirmReset(false);
  };

  const handleAnalyze = () => {
    // Combine all user text to send for analysis
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
      <div className="w-full max-w-3xl flex flex-col space-y-6">
        
        {/* Face */}
        <div className="flex justify-center -mt-4 mb-2 scale-90">
          <RobotFace 
            isAiSpeaking={isChatLoading}
            isUserSpeaking={chatInput.trim().length > 0}
            isConnected={true}
            exaggerated={true}
          />
        </div>

        {/* Header Section */}
        <div className="flex items-center justify-between bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 p-6 shadow-xl">
            <div>
              <h2 className="text-2xl font-medium text-slate-200 flex items-center gap-3">
                 <MessageCircle className="w-6 h-6 text-cyan-400" />
                 Daily Check-In
              </h2>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-lg">
                Log your significant moments and feelings throughout the day. When you're ready, analyze the conversation to update your personality and emotional readiness profile in the Trends tab.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => {
                    if (confirmReset) {
                      startNewDay(true);
                    } else {
                      setConfirmReset(true);
                      setTimeout(() => setConfirmReset(false), 3000);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl transition-colors border flex items-center justify-center space-x-2 text-sm font-medium ${
                    confirmReset 
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' 
                      : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-transparent hover:border-rose-500/20'
                  }`}
                >
                  <RotateCcw className={`w-4 h-4 ${confirmReset ? 'animate-spin-once' : ''}`} />
                  <span>{confirmReset ? 'Sure?' : 'Reset Chat'}</span>
                </button>
                <button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || chatHistory.filter(h => h.role === 'user').length === 0}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium transition-colors shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Day'}</span>
                </button>
            </div>
        </div>

        {/* Mood Selector */}
        <div className="flex items-center gap-3 bg-gray-900/40 border border-gray-800 p-4 rounded-2xl overflow-x-auto custom-scrollbar shadow-sm">
           <span className="text-sm font-medium text-slate-400 shrink-0 ml-2 mr-1">Today I'm feeling:</span>
           <div className="flex items-center gap-2">
             {MOODS.map(mood => (
                <button
                   key={mood.label}
                   onClick={() => setSelectedMood(mood.label === selectedMood ? null : mood.label)}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all border ${
                     selectedMood === mood.label 
                       ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                       : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-700 hover:border-slate-600'
                   }`}
                >
                   <span className="text-base">{mood.emoji}</span>
                   <span className="hidden sm:inline">{mood.label}</span>
                </button>
             ))}
           </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-gray-900/40 border border-gray-800 backdrop-blur-md rounded-3xl p-6 shadow-xl flex flex-col h-[500px]">
           
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar pb-6">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl p-4 shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-cyan-600 text-white rounded-br-none' 
                          : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                      }`}>
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-medium bg-slate-900/50 px-2 py-0.5 rounded-full border border-slate-800/50">
                          <Clock className="w-3 h-3" />
                          {msg.timestamp || 'Now'}
                      </span>
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 rounded-2xl p-4 rounded-bl-none border border-slate-700">
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
                className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl pl-5 pr-14 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none h-[64px] shadow-xl text-sm"
                rows={1}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isChatLoading}
                className="absolute right-2 bottom-2 p-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl transition-colors shadow-lg"
              >
                <Send className="w-4 h-4 text-slate-950" />
              </button>
            </div>
            
        </div>
      </div>
    </motion.div>
  );
}
