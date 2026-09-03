import { auth } from '../firebase';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { BrainCircuit, Star, Zap, AlignJustify, MessageCircle, Send, Download, FileText } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ReportData } from '../types';
import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface ReportProps {
  report: ReportData;
  onClose: () => void;
  autoDownload?: boolean;
  onDownloadComplete?: () => void;
}

export function AnalysisReport({ report, onClose, autoDownload, onDownloadComplete }: ReportProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([{
    role: 'model', 
    text: "Got any questions about your report? (For example: 'What sort of people would I be drawn to?' or 'Why do I act like this when I'm stressed?') Ask away!"
  }]);
  const [isSending, setIsSending] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [mounted, setMounted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (autoDownload && !isDownloadingPdf && reportRef.current) {
      handleDownloadPdf().then(() => {
        if (onDownloadComplete) onDownloadComplete();
      });
    }
  }, [autoDownload]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleChat = async () => {
    if (!chatMessage.trim() || isSending) return;
    
    const newHistory = [...chatHistory, { role: 'user', text: chatMessage }];
    setChatHistory(newHistory);
    setChatMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/report-chat', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${(await auth.currentUser?.getIdToken()) || ''}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          history: chatHistory.filter((m: any) => m.role !== 'model' || m.text !== chatHistory[0].text), // Pass only real convo
          message: chatMessage
        })
      });

      const data = await response.json();
      if (data.reply) {
        setChatHistory([...newHistory, { role: 'model', text: data.reply }]);
      }
    } catch (error) {
      console.error("Failed to send chat:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!report) return;
    let text = `PERSONALITY PROFILE REPORT\n`;
    text += `==========================\n\n`;
    
    if (report.mbti) text += `MBTI Type: ${report.mbti}\n`;
    if (report.enneagram) text += `Enneagram: ${report.enneagram}\n`;
    text += `\n`;
    if (report.summary) text += `SUMMARY:\n${report.summary}\n\n`;
    if (report.casualSummary) text += `THE VIBE (CASUAL SUMMARY):\n${report.casualSummary}\n\n`;

    if (report.sentimentAnalysis) {
      text += `SENTIMENT ANALYSIS:\n`;
      text += `Overall Sentiment: ${report.sentimentAnalysis.overallSentiment}\n`;
      if (report.sentimentAnalysis.shifts && report.sentimentAnalysis.shifts.length > 0) {
        text += `Sentiment Shifts:\n`;
        report.sentimentAnalysis.shifts.forEach(shift => text += `- ${shift}\n`);
      }
      if (report.sentimentAnalysis.summary) {
        text += `General Sentiment Summary: ${report.sentimentAnalysis.summary}\n`;
      }
      text += `\n`;
    }

    if (report.readiness) {
      text += `EMOTIONAL READINESS / BANDWIDTH:\n`;
      text += `Score: ${report.readiness.score}/100\n`;
      text += `${report.readiness.explanation}\n`;
      if (report.readiness.correlation) {
          text += `Correlation: ${report.readiness.correlation}\n`;
      }
      text += `\n`;
    }

    if (report.bigFive) {
      text += `BIG FIVE TRAITS:\n`;
      text += `- Openness: ${report.bigFive.openness ?? 0}\n`;
      text += `- Conscientiousness: ${report.bigFive.conscientiousness ?? 0}\n`;
      text += `- Extraversion: ${report.bigFive.extraversion ?? 0}\n`;
      text += `- Agreeableness: ${report.bigFive.agreeableness ?? 0}\n`;
      text += `- Neuroticism: ${report.bigFive.neuroticism ?? 0}\n\n`;
    }

    if (report.mbtiFunctions) {
      text += `COGNITIVE FUNCTIONS:\n`;
      text += `Dominant: ${report.mbtiFunctions.dominant.function}\n  ${report.mbtiFunctions.dominant.explanation}\n`;
      text += `Auxiliary: ${report.mbtiFunctions.auxiliary.function}\n  ${report.mbtiFunctions.auxiliary.explanation}\n`;
      text += `Tertiary: ${report.mbtiFunctions.tertiary.function}\n  ${report.mbtiFunctions.tertiary.explanation}\n\n`;
    }

    if (report.communicationStyle) {
      text += `COMMUNICATION STYLE:\n`;
      if (report.communicationStyle.summary) text += `Summary: ${report.communicationStyle.summary}\n`;
      if (report.communicationStyle.directness) text += `Directness: ${report.communicationStyle.directness}\n`;
      if (report.communicationStyle.formality) text += `Formality: ${report.communicationStyle.formality}\n`;
      if (report.communicationStyle.analyticalVsEmotional) text += `Analytical vs Emotional: ${report.communicationStyle.analyticalVsEmotional}\n`;
      if (report.communicationStyle.humor) text += `Humor: ${report.communicationStyle.humor}\n`;
      if (report.communicationStyle.storytelling) text += `Storytelling: ${report.communicationStyle.storytelling}\n`;
      if (report.communicationStyle.metaphors) text += `Metaphors: ${report.communicationStyle.metaphors}\n`;
      if (report.communicationStyle.abstractLanguage) text += `Abstract Language: ${report.communicationStyle.abstractLanguage}\n`;
      text += `\n`;
    }

    if (report.actionableInsights && report.actionableInsights.length > 0) {
      text += `ACTIONABLE STRATEGIES:\n`;
      report.actionableInsights.forEach(insight => {
          text += `- ${insight.title}: ${insight.insight}\n`;
      });
      text += `\n`;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personality-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || !report) return;
    try {
      setIsDownloadingPdf(true);
      
      const canvas = await toCanvas(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff', // matching tailwind's gray-900 / slate-900
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`personality-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!report) return null;

  const radarData = report.bigFive ? [
    { subject: 'Openness', A: report.bigFive.openness || 0, fullMark: 100 },
    { subject: 'Conscientiousness', A: report.bigFive.conscientiousness || 0, fullMark: 100 },
    { subject: 'Extraversion', A: report.bigFive.extraversion || 0, fullMark: 100 },
    { subject: 'Agreeableness', A: report.bigFive.agreeableness || 0, fullMark: 100 },
    { subject: 'Neuroticism', A: report.bigFive.neuroticism || 0, fullMark: 100 },
  ] : [];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-full max-w-2xl bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 p-8 shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
    >
      <div ref={reportRef} className="pb-4">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-500" />
        
        <div className="flex justify-between items-start mb-8">
           <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                   <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Personality Profile</h2>
                   <p className="text-blue-600 font-mono text-base">ANALYSIS COMPLETE</p>
                </div>
           </div>
           <div className="flex items-center space-x-3">
             {report.mbti && (
                 <div className="px-6 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 shrink-0">
                     <span className="text-xl font-bold tracking-widest text-indigo-500">{report.mbti}</span>
                 </div>
             )}
             {report.enneagram && (
                 <div className="px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                     <span className="text-xl font-bold tracking-widest text-emerald-600">{report.enneagram}</span>
                 </div>
             )}
             <button onClick={handleDownloadPdf} disabled={isDownloadingPdf} className="p-2 bg-slate-100/50 hover:bg-slate-200 rounded-full text-indigo-400 hover:text-indigo-300 transition-colors pointer-events-auto disabled:opacity-50" title="Download PDF">
                <FileText className="w-5 h-5" />
             </button>
             <button onClick={handleDownloadTxt} className="p-2 bg-slate-100/50 hover:bg-slate-200 rounded-full text-blue-600 hover:text-cyan-300 transition-colors pointer-events-auto" title="Download TXT">
                <Download className="w-5 h-5" />
             </button>
             <button onClick={onClose} className="p-2 bg-slate-100/50 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-900 transition-colors pointer-events-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
           </div>
        </div>

      <div className="space-y-8">
        <div className="bg-slate-100/50 rounded-2xl p-5 border border-slate-200/50">
           <h3 className="text-base font-semibold text-slate-500 mb-2 uppercase tracking-wider">Summary</h3>
           <p className="text-slate-700 leading-relaxed text-base md:text-base">{report.summary}</p>
        </div>
        
        {report.casualSummary && (
          <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-2xl p-5 border border-pink-500/20">
              <h3 className="text-base font-semibold text-pink-500 mb-2 uppercase tracking-wider">The Vibe (Casual Summary)</h3>
              <p className="text-slate-700 leading-relaxed text-base md:text-base">{report.casualSummary}</p>
          </div>
        )}

        {report.sentimentAnalysis && (
          <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100">
             <h3 className="text-base font-semibold text-indigo-600 mb-2 uppercase tracking-wider">Sentiment Analysis</h3>
             <div className="space-y-8">
               <div>
                 <span className="text-sm font-semibold text-indigo-500 uppercase tracking-wider block mb-1">Overall Sentiment</span>
                 <p className="text-slate-700 text-base md:text-base capitalize font-medium">{report.sentimentAnalysis.overallSentiment}</p>
               </div>
               {report.sentimentAnalysis.shifts && report.sentimentAnalysis.shifts.length > 0 && (
                 <div>
                   <span className="text-sm font-semibold text-indigo-500 uppercase tracking-wider block mb-1">Sentiment Shifts</span>
                   <ul className="list-disc pl-5 text-slate-700 text-base space-y-1">
                     {report.sentimentAnalysis.shifts.map((shift, i) => (
                       <li key={i}>{shift}</li>
                     ))}
                   </ul>
                 </div>
               )}
               {report.sentimentAnalysis.summary && (
                 <div>
                   <span className="text-sm font-semibold text-indigo-500 uppercase tracking-wider block mb-1">General Sentiment Summary</span>
                   <p className="text-slate-700 text-base md:text-base">{report.sentimentAnalysis.summary}</p>
                 </div>
               )}
             </div>
          </div>
        )}

        {report.readiness && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <Zap className="w-24 h-24 text-blue-600" />
             </div>
             <div className="relative z-10">
               <div className="flex items-end space-x-3 mb-4">
                 <h3 className="text-lg font-semibold text-blue-700">Daily Readiness Score</h3>
                 <span className="text-4xl font-bold tracking-tighter text-blue-600 leading-none">{report.readiness.score}</span>
                 <span className="text-base text-blue-600 font-mono mb-1">/ 100</span>
               </div>
               
               <div className="space-y-8">
                 <div>
                   <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1">What this means</h4>
                   <p className="text-base text-slate-700 leading-relaxed">{report.readiness.explanation}</p>
                 </div>
                 
                 <div>
                   <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-1">Today's Context</h4>
                   <p className="text-base text-slate-700 leading-relaxed">{report.readiness.correlation}</p>
                 </div>
               </div>
             </div>
          </div>
        )}

        {report.bigFive && (
          <div>
            <h3 className="text-base font-semibold text-slate-500 mb-4 uppercase tracking-wider">Big Five (OCEAN) traits</h3>
            
            <div className="h-[250px] sm:h-[300px] w-full mb-6">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 13 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar name="User" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
            </div>

            <div className="space-y-8">
               {(report.traitExplanations || []).map((te, i) => (
                   <div key={i} className="bg-slate-50 rounded-xl p-8 border border-slate-100">
                       <div className="flex justify-between items-center mb-1">
                           <span className="text-base font-medium text-slate-800 capitalize">{te.trait}</span>
                           <span className="text-sm font-mono text-blue-600">{te.score}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                           <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${te.score}%` }}
                               transition={{ duration: 1, delay: 0.2 }}
                               className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full"
                           />
                       </div>
                       <p className="text-base text-slate-700 leading-relaxed">{te.explanation}</p>
                   </div>
               ))}
               
               {(!report.traitExplanations && report.bigFive) && Object.entries(report.bigFive).map(([trait, score]) => (
                   <div key={trait}>
                       <div className="flex justify-between items-center mb-1">
                           <span className="text-base text-slate-800 capitalize">{trait}</span>
                           <span className="text-sm font-mono text-blue-600">{score}%</span>
                       </div>
                       <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                           <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${score}%` }}
                               transition={{ duration: 1, delay: 0.2 }}
                               className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-full"
                           />
                       </div>
                   </div>
               ))}
            </div>
          </div>
        )}

        {report.mbtiFunctions && (
          <div>
            <h3 className="text-base font-semibold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-500" /> Active Cognitive Functions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.mbtiFunctions.dominant && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-8">
                   <div className="text-sm text-indigo-600 font-bold mb-1 uppercase tracking-wider">Dominant</div>
                   <div className="font-semibold text-slate-800 mb-2">{report.mbtiFunctions.dominant.function}</div>
                   <p className="text-base text-slate-700 mb-3">{report.mbtiFunctions.dominant.explanation}</p>
                   <div className="bg-white p-2 rounded text-sm text-slate-600 italic border-l-2 border-indigo-500/50">
                     "{report.mbtiFunctions.dominant.example}"
                   </div>
                </div>
              )}
              {report.mbtiFunctions.auxiliary && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-8">
                   <div className="text-sm text-blue-600 font-bold mb-1 uppercase tracking-wider">Auxiliary</div>
                   <div className="font-semibold text-slate-800 mb-2">{report.mbtiFunctions.auxiliary.function}</div>
                   <p className="text-base text-slate-700 mb-3">{report.mbtiFunctions.auxiliary.explanation}</p>
                   <div className="bg-white p-2 rounded text-sm text-slate-600 italic border-l-2 border-blue-500/50">
                     "{report.mbtiFunctions.auxiliary.example}"
                   </div>
                </div>
              )}
              {report.mbtiFunctions.tertiary && (
                <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-8">
                   <div className="text-sm text-purple-600 font-bold mb-1 uppercase tracking-wider">Tertiary</div>
                   <div className="font-semibold text-slate-800 mb-2">{report.mbtiFunctions.tertiary.function}</div>
                   <p className="text-base text-slate-700 mb-3">{report.mbtiFunctions.tertiary.explanation}</p>
                   <div className="bg-white p-2 rounded text-sm text-slate-600 italic border-l-2 border-purple-500/50">
                     "{report.mbtiFunctions.tertiary.example}"
                   </div>
                </div>
              )}
            </div>
          </div>
        )}

        {report.actionableInsights && report.actionableInsights.length > 0 && (
             <div>
                <h3 className="text-base font-semibold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Actionable Insights
                </h3>
                <div className="space-y-8">
                    {report.actionableInsights.map((insight, i) => (
                        <div key={i} className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-8">
                            <h4 className="text-base font-semibold text-indigo-600 mb-1">{insight.title}</h4>
                            <p className="text-base text-slate-700 leading-relaxed">{insight.insight}</p>
                        </div>
                    ))}
                </div>
             </div>
        )}

        {report.communicationStyle && (
            <div className="mb-8">
               <h3 className="text-base font-semibold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                   <MessageCircle className="w-4 h-4 text-blue-600" /> Communication Style
               </h3>
               <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-8">
                   <p className="text-base text-slate-700 leading-relaxed italic border-b border-slate-200/50 pb-4 mb-4">
                       "{report.communicationStyle.summary}"
                   </p>
                   
                   <div className="grid grid-cols-1 gap-4">
                       <div className="bg-white rounded-lg p-8 border border-slate-100">
                           <span className="block text-sm text-slate-500 mb-1 uppercase tracking-wide">Directness</span>
                           <span className="text-base text-slate-700 font-medium">{report.communicationStyle.directness}</span>
                       </div>
                       <div className="bg-white rounded-lg p-8 border border-slate-100">
                           <span className="block text-sm text-slate-500 mb-1 uppercase tracking-wide">Formality</span>
                           <span className="text-base text-slate-700 font-medium">{report.communicationStyle.formality}</span>
                       </div>
                       <div className="bg-white rounded-lg p-8 border border-slate-100">
                           <span className="block text-sm text-slate-500 mb-1 uppercase tracking-wide">Analytical vs Emotional</span>
                           <span className="text-base text-slate-700 font-medium">{report.communicationStyle.analyticalVsEmotional}</span>
                       </div>
                   </div>

                   {report.communicationStyle.examples && report.communicationStyle.examples.length > 0 && (
                       <div className="mt-5 pt-5 border-t border-slate-200/50">
                           <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Linguistic Evidence</h4>
                           <ul className="space-y-2">
                               {report.communicationStyle.examples.map((ex, i) => (
                                   <li key={i} className="flex items-start opacity-90">
                                       <Star className="w-3.5 h-3.5 text-blue-600 mr-2 mt-0.5 shrink-0" />
                                       <span className="text-base text-slate-700 italic">"{ex}"</span>
                                   </li>
                               ))}
                           </ul>
                       </div>
                   )}
               </div>
            </div>
        )}

        {report.examples && report.examples.length > 0 && !report.communicationStyle && (
            <div>
               <h3 className="text-base font-semibold text-slate-500 mb-3 uppercase tracking-wider">Linguistic Markers</h3>
               <ul className="space-y-2">
                   {report.examples.map((ex, i) => (
                       <li key={i} className="flex items-start opacity-90">
                           <Star className="w-4 h-4 text-amber-500 mr-3 mt-0.5 shrink-0" />
                           <span className="text-base text-slate-700 italic">"{ex}"</span>
                       </li>
                   ))}
               </ul>
            </div>
        )}
      </div>

       <div className="mt-10 border-t border-slate-200 pt-8">
           <h3 className="text-base font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
               <MessageCircle className="w-4 h-4 text-blue-600" /> Ask About Your Report
           </h3>
           
           <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 mb-4 h-64 overflow-y-auto space-y-8">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-base leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 rounded-bl-none border border-slate-100 shadow-sm'
                  }`}>
                     {msg.text}
                  </div>
                </div>
              ))}
              {isSending && (
                 <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-bl-none p-3 bg-white text-slate-500 text-base border border-slate-100 shadow-sm flex space-x-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                 </div>
              )}
              <div ref={chatEndRef} />
           </div>

           <div className="flex gap-2">
              <input
                 type="text"
                 value={chatMessage}
                 onChange={(e) => setChatMessage(e.target.value)}
                 onKeyDown={(e) => {
                    if (e.key === 'Enter') handleChat();
                 }}
                 placeholder="E.g., what kind of jobs would I be good at?"
                 className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-6 py-3 text-base text-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
              <button
                 onClick={handleChat}
                 disabled={isSending || !chatMessage.trim()}
                 className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition-colors shrink-0 flex items-center justify-center shadow-lg"
              >
                 <Send className="w-4 h-4" />
              </button>
           </div>
       </div>

       <div className="mt-8 flex justify-end">
           <button 
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-base font-medium transition-colors border border-slate-200"
           >
              Back to Analyzer
           </button>
       </div>
      </div>
     </motion.div>
   );
 }
