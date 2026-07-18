const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const mainAppContent = `      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 max-w-2xl px-4">
        {activeTab === 'voice' && (`;

const replaceWith = `      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 max-w-2xl px-4">
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
        {activeTab === 'voice' && (`;

code = code.replace(mainAppContent, replaceWith);

const closingContent = `        {showReport && appReport && (
          <AnalysisReport 
            report={appReport} 
            onClose={() => setShowReport(false)} 
          />
        )}
      </div>
    </div>
  );
}`;

const replaceClosing = `        {showReport && appReport && (
          <AnalysisReport 
            report={appReport} 
            onClose={() => setShowReport(false)} 
          />
        )}
        </>
        )}
      </div>
    </div>
  );
}`;

code = code.replace(closingContent, replaceClosing);

fs.writeFileSync('src/App.tsx', code);
