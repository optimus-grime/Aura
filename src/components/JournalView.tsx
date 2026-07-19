import { auth } from '../firebase';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, PenTool, Sparkles, RefreshCw, MessageSquare, ArrowLeft, Send } from 'lucide-react';
import { ReportData, JournalPrompt } from '../types';

interface JournalViewProps {
  latestReport: ReportData | null;
}

export function JournalView({ latestReport }: JournalViewProps) {
  const [prompts, setPrompts] = useState<JournalPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedPrompt, setSelectedPrompt] = useState<JournalPrompt | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatLoading]);

  const generatePrompts = async () => {
    if (!latestReport) return;
    setIsLoading(true);
    setError(null);
    setSelectedPrompt(null);
    try {
      const response = await fetch('/api/journal-prompts', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: latestReport }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate prompts');
      }
      const data = await response.json();
      if (data.prompts) {
        setPrompts(data.prompts);
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (p: JournalPrompt) => {
    setSelectedPrompt(p);
    
    const draft = localStorage.getItem(`journal_draft_${p.title}`);
    if (draft) {
      setChatInput(draft);
    } else {
      setChatInput('');
    }

    setChatHistory([{
      role: 'model',
      text: `Let's reflect on this together. Whenever you're ready, share your initial thoughts on the prompt: "${p.prompt}"`
    }]);
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setChatInput(val);
    if (selectedPrompt) {
      localStorage.setItem(`journal_draft_${selectedPrompt.title}`, val);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !latestReport || !selectedPrompt) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    localStorage.removeItem(`journal_draft_${selectedPrompt.title}`);
    
    const newHistory = [...chatHistory, { role: 'user' as const, text: userMsg }];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/journal-chat', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: latestReport,
          prompt: selectedPrompt,
          history: chatHistory, // Send previous history before the new message
          message: userMsg
        }),
      });
      
      if (!response.ok) throw new Error('Reply failed');
      const data = await response.json();
      
      setChatHistory([...newHistory, { role: 'model', text: data.reply }]);
    } catch (e: any) {
      console.error(e);
      setChatHistory([...newHistory, { role: 'model', text: 'Sorry, I lost my train of thought. Can you try saying that again?' }]);
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

  if (!latestReport) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-center space-y-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-medium text-slate-800">No Profile Found</h3>
        <p className="text-slate-600 max-w-md leading-relaxed">
          Complete a voice or text analysis first so we can generate personalized journal prompts for your specific traits.
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
      <div className="w-full max-w-3xl flex flex-col space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between bg-white backdrop-blur-md rounded-2xl border border-slate-200 p-8 shadow-xl">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Tailored Journaling</h2>
              <p className="text-slate-600 mt-2">
                Deepen your self-understanding based on your {latestReport.mbti ? `${latestReport.mbti} ` : ''}personality profile.
              </p>
            </div>
            
            {!selectedPrompt && (
              <button 
                onClick={generatePrompts}
                disabled={isLoading}
                className="px-6 py-3 rounded-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 font-medium transition-colors border border-blue-600/30 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isLoading ? (
                    <>
                       <RefreshCw className="w-4 h-4 animate-spin" />
                       <span>Formulating...</span>
                    </>
                 ) : (
                    <>
                       <Sparkles className="w-4 h-4" />
                       <span>{prompts.length > 0 ? "Refresh Prompts" : "Generate Prompts"}</span>
                    </>
                 )}
              </button>
            )}
            
            {selectedPrompt && (
              <button 
                onClick={() => setSelectedPrompt(null)}
                className="px-6 py-2 rounded-full hover:bg-slate-100 text-slate-800 font-medium transition-colors border border-slate-200 flex items-center space-x-3"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Prompts</span>
              </button>
            )}
        </div>

        {error && (
            <div className="p-8 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
               Error: {error}
            </div>
        )}

        {/* View Mode: Interactive Chat */}
        {selectedPrompt ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col space-y-8"
          >
            {/* The Prompt Context */}
            <div className="bg-cyan-950/20 border border-blue-200/50 rounded-2xl p-8 shadow-md mb-2">
               <h3 className="text-lg font-medium text-cyan-300 mb-2">{selectedPrompt.title}</h3>
               <p className="text-slate-800 font-serif text-lg italic leading-relaxed">"{selectedPrompt.prompt}"</p>
            </div>

            {/* Chat History */}
            <div className="space-y-8 mb-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-8 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
                  }`}>
                    <p className="whitespace-pre-wrap text-base leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl rounded-bl-none border border-slate-200 p-8">
                    <div className="flex space-x-1 items-center h-5">
                      <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="relative group">
              <textarea
                value={chatInput}
                onChange={handleChatInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Share your thoughts... (Shift+Enter for new line)"
                className="w-full bg-white border border-slate-200 rounded-2xl pl-4 pr-14 py-6 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none min-h-[60px] max-h-48 shadow-xl"
                rows={1}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isChatLoading}
                className="absolute right-3 bottom-3 p-2 bg-blue-600 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl transition-colors shadow-lg"
              >
                <Send className="w-4 h-4 text-slate-950" />
              </button>
            </div>
            
          </motion.div>
        ) : (
          /* View Mode: Prompt List */
          <div className="space-y-8">
             <AnimatePresence>
               {prompts.map((p, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 border border-slate-200 backdrop-blur-md rounded-2xl p-8 shadow-xl relative overflow-hidden group hover:border-cyan-800/50 transition-colors"
                  >
                     <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="flex justify-between items-start mb-3 gap-4">
                       <h3 className="text-lg font-medium text-slate-900">{p.title}</h3>
                       <button
                         onClick={() => handleSelectPrompt(p)}
                         className="flex items-center space-x-3 px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-blue-600 text-base font-medium transition-colors border border-slate-200 shrink-0"
                       >
                         <MessageSquare className="w-4 h-4" />
                         <span>Reflect</span>
                       </button>
                     </div>
                     
                     <div className="p-8 bg-black/30 rounded-xl mb-4 border border-slate-200 cursor-pointer" onClick={() => handleSelectPrompt(p)}>
                       <p className="text-slate-800 font-serif text-lg italic leading-relaxed">"{p.prompt}"</p>
                     </div>
                     <div className="flex items-start gap-3 mt-4 pt-4 border-t border-slate-200">
                         <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                         <p className="text-base text-slate-600 leading-relaxed"><span className="text-slate-800 font-medium">Why it matters:</span> {p.why}</p>
                     </div>
                  </motion.div>
               ))}
             </AnimatePresence>
             
             {prompts.length === 0 && !isLoading && !error && (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                   <BookOpen className="w-8 h-8 mb-4 opacity-50" />
                   <p>Click "Generate Prompts" to craft personalized questions based on your unique cognitive patterns.</p>
                </div>
            )}
          </div>
        )}

      </div>
    </motion.div>
  );
}
