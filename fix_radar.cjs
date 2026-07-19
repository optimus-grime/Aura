const fs = require('fs');

let code = fs.readFileSync('src/components/TrendsView.tsx', 'utf8');

const oldRadarBlock = `<div 
                         className="h-[550px] w-full max-w-2xl relative flex items-center justify-center my-6"
                         style={{ perspective: '1400px' }}
                      >
                        <div 
                           className="w-full h-full relative"
                           style={{ 
                             transform: 'rotateX(55deg) rotateZ(-45deg)', 
                             transformStyle: 'preserve-3d',
                             transition: 'transform 0.5s ease-in-out'
                           }}
                        >
                           <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={comparisonData}>
                                 <defs>
                                   <filter id="glowA" x="-20%" y="-20%" width="140%" height="140%">
                                     <feDropShadow dx="-6" dy="16" stdDeviation="6" floodColor="#06b6d4" floodOpacity="0.4" />
                                   </filter>
                                   <filter id="glowB" x="-20%" y="-20%" width="140%" height="140%">
                                     <feDropShadow dx="6" dy="16" stdDeviation="6" floodColor="#8b5cf6" floodOpacity="0.4" />
                                   </filter>
                                 </defs>
                                 <PolarGrid stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" />
                                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 16, fontWeight: '700' }} />
                                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                 
                                 {/* We render a custom tooltip to un-tilt it visually if possible, or just style it heavily */}
                                 <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', padding: '12px 20px', fontWeight: 'bold' }} 
                                    itemStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '15px' }}
                                    labelStyle={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', tracking: 'widest' }}
                                 />
                                 <Legend wrapperStyle={{ transform: 'rotateZ(45deg) rotateX(-55deg) translateY(60px)', fontWeight: 'bold' }} />
                                 
                                 {/* Baseline Extrusion Layers (Simulated 3D) */}
                                 <Radar dataKey="A" stroke="none" fill="#06b6d4" fillOpacity={0.15} style={{ transform: 'translate(-4px, 12px)', filter: 'url(#glowA)' }} />
                                 <Radar dataKey="A" stroke="none" fill="#06b6d4" fillOpacity={0.25} style={{ transform: 'translate(-2px, 8px)' }} />
                                 <Radar dataKey="A" stroke="none" fill="#06b6d4" fillOpacity={0.4} style={{ transform: 'translate(-1px, 4px)' }} />
                                 <Radar name="Baseline" dataKey="A" stroke="#0891b2" strokeWidth={3} fill="#22d3ee" fillOpacity={0.7} />

                                 {/* Comparison Extrusion Layers (Simulated 3D) */}
                                 <Radar dataKey="B" stroke="none" fill="#8b5cf6" fillOpacity={0.15} style={{ transform: 'translate(4px, 12px)', filter: 'url(#glowB)' }} />
                                 <Radar dataKey="B" stroke="none" fill="#8b5cf6" fillOpacity={0.25} style={{ transform: 'translate(2px, 8px)' }} />
                                 <Radar dataKey="B" stroke="none" fill="#8b5cf6" fillOpacity={0.4} style={{ transform: 'translate(1px, 4px)' }} />
                                 <Radar name="Comparison" dataKey="B" stroke="#7c3aed" strokeWidth={3} fill="#a78bfa" fillOpacity={0.7} />
                                 
                              </RadarChart>
                           </ResponsiveContainer>
                        </div>
                      </div>`;

const newRadarBlock = `<div 
                         className="h-[550px] w-full max-w-2xl relative flex flex-col items-center justify-center my-6"
                         style={{ perspective: '1400px' }}
                      >
                        <div 
                           className="w-full h-[500px] relative"
                           style={{ 
                             transform: 'rotateX(55deg) rotateZ(-45deg)', 
                             transformStyle: 'preserve-3d',
                             transition: 'transform 0.5s ease-in-out'
                           }}
                        >
                           <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={comparisonData}>
                                 <defs>
                                   <filter id="glowA" x="-20%" y="-20%" width="140%" height="140%">
                                     <feDropShadow dx="-6" dy="16" stdDeviation="6" floodColor="#06b6d4" floodOpacity="0.4" />
                                   </filter>
                                   <filter id="glowB" x="-20%" y="-20%" width="140%" height="140%">
                                     <feDropShadow dx="6" dy="16" stdDeviation="6" floodColor="#8b5cf6" floodOpacity="0.4" />
                                   </filter>
                                 </defs>
                                 <PolarGrid stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" />
                                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 16, fontWeight: '700' }} />
                                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                 
                                 <Tooltip 
                                    wrapperStyle={{ transform: 'rotateZ(45deg) rotateX(-55deg) scale(1.1)', transformOrigin: 'center center', pointerEvents: 'none', zIndex: 1000 }}
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', padding: '12px 20px', fontWeight: 'bold' }} 
                                    itemStyle={{ color: '#0f172a', fontWeight: 'bold', fontSize: '15px' }}
                                    labelStyle={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', tracking: 'widest' }}
                                 />
                                 
                                 {/* Baseline Extrusion Layers (Simulated 3D) */}
                                 <Radar dataKey="A" stroke="none" fill="#06b6d4" fillOpacity={0.15} style={{ transform: 'translate(-4px, 12px)', filter: 'url(#glowA)' }} />
                                 <Radar dataKey="A" stroke="none" fill="#06b6d4" fillOpacity={0.25} style={{ transform: 'translate(-2px, 8px)' }} />
                                 <Radar dataKey="A" stroke="none" fill="#06b6d4" fillOpacity={0.4} style={{ transform: 'translate(-1px, 4px)' }} />
                                 <Radar name="Baseline" dataKey="A" stroke="#0891b2" strokeWidth={3} fill="#22d3ee" fillOpacity={0.7} />

                                 {/* Comparison Extrusion Layers (Simulated 3D) */}
                                 <Radar dataKey="B" stroke="none" fill="#8b5cf6" fillOpacity={0.15} style={{ transform: 'translate(4px, 12px)', filter: 'url(#glowB)' }} />
                                 <Radar dataKey="B" stroke="none" fill="#8b5cf6" fillOpacity={0.25} style={{ transform: 'translate(2px, 8px)' }} />
                                 <Radar dataKey="B" stroke="none" fill="#8b5cf6" fillOpacity={0.4} style={{ transform: 'translate(1px, 4px)' }} />
                                 <Radar name="Comparison" dataKey="B" stroke="#7c3aed" strokeWidth={3} fill="#a78bfa" fillOpacity={0.7} />
                                 
                              </RadarChart>
                           </ResponsiveContainer>
                        </div>
                        
                        {/* Custom Legend outside of 3D transformed container */}
                        <div className="flex justify-center items-center space-x-8 mt-6">
                           <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 rounded-md bg-[#22d3ee] border-2 border-[#0891b2] shadow-sm"></div>
                              <span className="text-base font-bold text-slate-700">Baseline</span>
                           </div>
                           <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 rounded-md bg-[#a78bfa] border-2 border-[#7c3aed] shadow-sm"></div>
                              <span className="text-base font-bold text-slate-700">Comparison</span>
                           </div>
                        </div>
                      </div>`;

if (code.includes('rotateZ(45deg) rotateX(-55deg) translateY(60px)')) {
   code = code.replace(oldRadarBlock, newRadarBlock);
   fs.writeFileSync('src/components/TrendsView.tsx', code);
   console.log("Patched TrendsView successfully.");
} else {
   console.log("Could not find the original block");
}
