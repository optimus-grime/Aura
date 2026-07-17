import { auth } from '../firebase';
import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, FileText, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useFirebaseReports } from '../hooks/useFirebaseReports';

export function CSVImporter({ onImportComplete }: { onImportComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [analyzePartner, setAnalyzePartner] = useState(false);
  const { saveReport } = useFirebaseReports();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const processImport = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const csvData = results.data;
          
          if (csvData.length === 0) {
            throw new Error("CSV file is empty or no data found.");
          }

          // To prevent token limits with massive CSVs, we might take the first 100 rows or stringify cleanly.
          // For now, assume it's a reasonable size for Gemini 2.5 Flash.
          const jsonString = JSON.stringify(csvData.slice(0, 150)); 
          
          const response = await fetch('/api/import-csv', {
            method: 'POST',
            headers: {
        'Authorization': `Bearer ${await auth.currentUser?.getIdToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ csvContent: jsonString, filename: file.name, analyzePartner })
          });

          if (!response.ok) {
            throw new Error("Server failed to process the CSV data.");
          }

          const reportData = await response.json();
          await saveReport(reportData);
          
          setSuccess(true);
          setTimeout(() => {
            onImportComplete();
          }, 2000);

        } catch (err: any) {
          setError(err.message || "An error occurred during import.");
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        setError(error.message);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 mt-12 bg-slate-900/50 rounded-3xl border border-slate-800/80 shadow-2xl">
      <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6">
        <UploadCloud className="w-8 h-8 text-cyan-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-100 mb-2">Import External Data</h2>
      <p className="text-slate-400 text-center max-w-md mb-8">
        Upload a .csv file from another application containing your previous journal entries, mood logs, or habits. Aura will synthesize the entire dataset into a comprehensive historical profile.
      </p>

      {error && (
        <div className="w-full max-w-sm mb-6 flex items-center space-x-2 text-rose-400 bg-rose-500/10 px-4 py-3 rounded-xl border border-rose-500/20">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm mb-6 flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20"
        >
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">Import successful! Synthesized report created. Redirecting...</span>
        </motion.div>
      )}

      <div className="w-full max-w-sm space-y-4">
        <div className="relative group">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
          />
          <div className={`p-4 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors ${file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'}`}>
            {file ? (
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-cyan-400" />
                <span className="text-sm text-slate-200 truncate font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 text-slate-400">
                <UploadCloud className="w-6 h-6" />
                <span className="text-sm font-medium">Click or drag CSV here</span>
              </div>
            )}
          </div>
        </div>

        <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer justify-center mb-4">
          <input
            type="checkbox"
            checked={analyzePartner}
            onChange={(e) => setAnalyzePartner(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/50"
          />
          <span>Analyze the other person's personality</span>
        </label>

        <button
          onClick={processImport}
          disabled={!file || isUploading || success}
          className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Synthesizing API...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Analyze & Import</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
