const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(`        )}
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
`, `        )}
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
`);

fs.writeFileSync('src/App.tsx', code);
