/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useLiveAudio } from './hooks/useLiveAudio';
import { RobotFace } from './components/RobotFace';
import { AnalysisReport } from './components/AnalysisReport';
import { TrendsView } from './components/TrendsView';
import { JournalView } from './components/JournalView';
import { StrategiesView } from './components/StrategiesView';
import { DailyChatView } from './components/DailyChatView';
import { CSVImporter } from './components/CSVImporter';
import { Mic, MicOff, AlertCircle, MessageSquare, TrendingUp, BookOpen, LogOut, Compass, MessageCircle, Menu, X, Settings, Bell, BellOff, Layers, UploadCloud, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { SavedReport, ReportData } from './types';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth';
import { useFirebaseReports } from './hooks/useFirebaseReports';

// Add to imports in App.tsx
import { LayeredInsightsView } from './components/LayeredInsightsView';
import { PersonalityArchiveView } from './components/PersonalityArchiveView';

export default function App() {
  const { isConnected, isError, isSpeaking, userIsSpeaking, report, connect, disconnect } = useLiveAudio();
  const [showReport, setShowReport] = useState(false);
  const [appReport, setAppReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'voice' | 'text' | 'daily' | 'trends' | 'history' | 'journal' | 'strategies' | 'layered' | 'import' | 'archive'>('voice');

  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzePartner, setAnalyzePartner] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(() => {
    return localStorage.getItem('daily_reminder_enabled') === 'true';
  });

  const { savedReports, saveReport, deleteReport } = useFirebaseReports();

  useEffect(() => {
    localStorage.setItem('daily_reminder_enabled', String(dailyReminderEnabled));
    if (dailyReminderEnabled && Notification.permission !== 'granted') {
       Notification.requestPermission().then(perm => {
         if (perm !== 'granted') setDailyReminderEnabled(false);
       });
    }
  }, [dailyReminderEnabled]);

  useEffect(() => {
    if (!dailyReminderEnabled || Notification.permission !== 'granted') return;
    
    // Check every hour if we need to remind the user (if it's a new day and haven't checked in)
    const checkReminder = () => {
      const lastCheckIn = localStorage.getItem('last_checkin_date');
      const today = new Date().toLocaleDateString();
      if (lastCheckIn !== today) {
        new Notification("Aura Daily Check-in", {
          body: "Don't forget your daily chat and mood check-in! Let's reflect on your day.",
          icon: "/vite.svg"
        });
        // We'll set a temporary block so it doesn't spam every hour once they dismiss it, but actually, 
        // to simplify, we just show it if they haven't logged at all today. 
        // Let's set the last_checkin_date to today in the app when they send a daily message.
      }
    };
    
    const interval = setInterval(checkReminder, 60 * 60 * 1000); // Check every hour
    // Also check on mount with a slight delay
    const timeoutId = setTimeout(checkReminder, 5000); 
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [dailyReminderEnabled]);

  useEffect(() => {
    getRedirectResult(auth).catch(e => console.error('Redirect result error:', e));
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    try {
      console.log("Starting login...");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
    } catch (e: any) {
      console.error("Login error:", e);
      alert('Login failed: ' + e.message + ' (Code: ' + e.code + ')');
    }
  };

  const logout = async () => {
    await signOut(auth);
  };


  useEffect(() => {
    if (report) {
      setAppReport(report);
      saveReport(report);
      setShowReport(true);
      disconnect(); // Automatically close session when report is ready
    }
  }, [report, disconnect]);

  const handleAnalyzeText = async () => {
    if (!textInput.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textInput, analyzePartner }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analysis failed');
      }
      const data = await response.json();
      setAppReport(data);
      saveReport(data);
      setShowReport(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to analyze text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center p-6 selection:bg-cyan-900 overflow-hidden relative">
      {/* Menu Button */}
      <div className="absolute top-4 left-6 z-40">
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl hover:bg-slate-800 backdrop-blur-md transition group shadow-lg"
        >
          <Menu className="w-5 h-5 text-slate-300 group-hover:text-cyan-400" />
        </button>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsDrawerOpen(false)}
               className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50"
            />
            <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: 0 }}
               exit={{ x: '-100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-50 p-6 flex flex-col shadow-2xl"
            >
               <div className="flex items-center justify-between mb-10">
                 <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Aura Menu</h2>
                 <button onClick={() => setIsDrawerOpen(false)} className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 text-slate-300 transition">
                    <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="flex flex-col space-y-2 flex-1">
                 {[
                   { id: 'voice', icon: Mic, label: 'Voice Analysis' },
                   { id: 'text', icon: MessageSquare, label: 'Text History' },
                   { id: 'daily', icon: MessageCircle, label: 'Daily Chat' },
                   { id: 'trends', icon: TrendingUp, label: 'Trends & Insights History' },
                   { id: 'layered', icon: Layers, label: 'Layered Insights' },
                   { id: 'archive', icon: Archive, label: 'Aura Archive' },
                   { id: 'journal', icon: BookOpen, label: 'Journaling' },
                   { id: 'strategies', icon: Compass, label: 'Action Strategies' },
                   { id: 'import', icon: UploadCloud, label: 'Import CSV Data' }
                 ].map(item => (
                   <button 
                     key={item.id}
                     onClick={() => { setActiveTab(item.id as any); setIsDrawerOpen(false); }}
                     className={`flex items-center space-x-4 w-full p-3.5 rounded-xl transition-colors text-sm font-medium ${
                        activeTab === item.id 
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                     }`}
                   >
                     <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-cyan-400' : 'opacity-70'}`} />
                     <span>{item.label}</span>
                   </button>
                 ))}
               </div>

               <div className="mt-auto pt-6 border-t border-slate-800">
                 <button 
                   onClick={() => { setShowSettings(true); setIsDrawerOpen(false); }}
                   className="flex items-center space-x-4 w-full p-3.5 rounded-xl transition-colors text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                 >
                   <Settings className="w-5 h-5 opacity-70" />
                   <span>Settings</span>
                 </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowSettings(false)}
               className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl"
             >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-cyan-400" />
                    Settings
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Daily Reminder Toggle */}
                  <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/30">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${dailyReminderEnabled ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                         {dailyReminderEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-slate-200 font-medium text-sm">Daily Reminders</p>
                        <p className="text-slate-400 text-xs mt-0.5">Nudge me to complete my daily chat</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setDailyReminderEnabled(!dailyReminderEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dailyReminderEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dailyReminderEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  {Notification.permission === 'denied' && (
                    <p className="text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                       You have blocked notifications in your browser. Please enable them in your browser settings to use this feature.
                    </p>
                  )}
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Top right auth */}
      <div className="absolute top-4 right-6 z-40">
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-slate-400 text-sm hidden md:inline">{user.email}</span>
            <button
              onClick={logout}
              className="flex items-center space-x-2 text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="text-sm font-medium text-slate-900 bg-cyan-500 hover:bg-cyan-400 px-4 py-1.5 rounded-full transition shadow-lg shadow-cyan-500/20"
          >
            Sign in
          </button>
        )}
      </div>

      {/* Header and Tabs */}
      <div className="w-full max-w-2xl text-center space-y-6 z-20 mt-4 mb-4">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-mono tracking-tighter font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Aura
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto font-sans">
            Conversational Personality Analyzer. She listens, adapts, and learns about who you truly are through casual dialogue.
          </p>
        </div>


      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 max-w-2xl px-4">
        {!user ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-slate-900/50 backdrop-blur-md rounded-3xl p-10 border border-slate-800 shadow-2xl flex flex-col items-center justify-center space-y-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-2">
              <LogOut className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-200">Sign in to continue</h2>
            <p className="text-slate-400 max-w-sm">
              Aura requires authentication to securely store your personality reports and historical insights.
            </p>
            <button
              onClick={login}
              className="mt-4 px-8 py-3 rounded-full bg-cyan-500 text-slate-950 font-medium hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
            >
              Sign in with Google
            </button>
          </motion.div>
        ) : (
          <>
        {activeTab === 'voice' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full flex flex-col items-center space-y-12"
          >
            {/* Robot Head Visualization */}
            <RobotFace 
              isAiSpeaking={isSpeaking} 
              isUserSpeaking={userIsSpeaking} 
              isConnected={isConnected} 
            />

            {/* Status & Controls */}
            <div className="flex flex-col items-center space-y-6">
              <AnimatePresence mode="wait">
                {isError ? (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="flex items-center space-x-2 text-rose-400 bg-rose-400/10 px-4 py-2 rounded-full text-sm font-medium"
                   >
                     <AlertCircle className="w-4 h-4" />
                     <span>Connection failed. Make sure your microphone is enabled and try again.</span>
                   </motion.div>
                ) : isConnected ? (
                   <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="flex items-center space-x-2 text-emerald-400 text-sm font-medium"
                   >
                     <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                     <span>
                        {isSpeaking ? 'Aura is speaking...' : userIsSpeaking ? 'Aura is listening...' : 'Aura is connected'}
                     </span>
                   </motion.div>
                ) : (
                    <motion.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="text-slate-500 text-sm font-medium"
                   >
                     Ready to begin your analysis.
                   </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={isConnected ? disconnect : connect}
                className={`group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 shadow-xl ${
                  isConnected 
                    ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20' 
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:scale-105 border border-cyan-400/50'
                }`}
              >
                {isConnected ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
                
                {/* Soft pulsing ring if disconnected */}
                {!isConnected && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400 opacity-20 group-hover:opacity-40" />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'text' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full flex flex-col mt-8"
          >
            <div className="bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 p-6 shadow-xl flex flex-col space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-slate-200">History Analyzer</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Paste a chat log, an email thread, or any text you've written. Aura will analyze your linguistic markers to build a personality report.
                </p>
              </div>
              
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your text history here..."
                className="w-full h-48 bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none font-sans text-sm"
              />

              <div className="flex items-center justify-between mt-4">
                <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyzePartner}
                    onChange={(e) => setAnalyzePartner(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/50"
                  />
                  <span>Analyze the other person's personality</span>
                </label>

                <button 
                  onClick={handleAnalyzeText}
                  disabled={!textInput.trim() || isAnalyzing}
                  className="px-6 py-3 rounded-full bg-cyan-500 text-slate-950 font-medium hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/50 shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Text Vibe'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'layered' && (
          <LayeredInsightsView reports={savedReports} saveReport={saveReport} />
        )}

        {activeTab === 'archive' && (
          <PersonalityArchiveView reports={savedReports} />
        )}

        {activeTab === 'trends' && (
          <TrendsView 
            reports={savedReports} 
            onViewReport={(rp) => {
              setAppReport(rp.report);
              setShowReport(true);
            }} 
            onDeleteReport={deleteReport}
          />
        )}

        {activeTab === 'journal' && (
          <JournalView latestReport={savedReports.length > 0 ? savedReports[0].report : null} />
        )}

        {activeTab === 'strategies' && (
          <StrategiesView latestReport={savedReports.length > 0 ? savedReports[0].report : null} />
        )}

        {activeTab === 'daily' && (
          <DailyChatView 
            latestReport={savedReports.length > 0 ? savedReports[0].report : null}
            onAnalyzeChat={async (text, resetChat) => {
              setIsAnalyzing(true);
              try {
                const response = await fetch('/api/analyze-text', {
                  method: 'POST',
                  headers: {
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text }),
                });
                const data = await response.json();
                if (data.mbti) {
                  await saveReport(data);
                  setAppReport(data);
                  setShowReport(true);
                  resetChat();
                } else if (data.error) {
                  alert("Error: " + data.error);
                }
              } catch(e) {
                console.error(e);
                alert("Failed analysis");
              } finally {
                setIsAnalyzing(false);
              }
            }}
            isAnalyzing={isAnalyzing}
          />
        )}

        {activeTab === 'import' && (
          <CSVImporter onImportComplete={() => setActiveTab('trends')} />
        )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showReport && appReport && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
           >
              <AnalysisReport report={appReport} onClose={() => setShowReport(false)} />
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
