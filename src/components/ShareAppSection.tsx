import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Share2, Copy, Check, QrCode, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShareAppSectionProps {
  customUrl?: string;
}

export const ShareAppSection: React.FC<ShareAppSectionProps> = ({ customUrl }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const url = customUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    setShareUrl(url);
  }, [customUrl]);

  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });
  }, [shareUrl]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Aura - Conversational Personality Analyzer',
          text: 'Explore Aura, an AI personality analyzer!',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or failed
      }
    }
  };

  return (
    <div className="border-t border-slate-200 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600">
          <Share2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-slate-900 font-medium text-base">Share Aura App</p>
          <p className="text-slate-600 text-sm mt-0.5">
            QR code dynamically points to your live app origin
          </p>
        </div>
      </div>

      {/* Main Share Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center space-y-4 shadow-sm">
        {/* QR Code container */}
        <div className="relative group">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Aura App QR Code"
                className="w-44 h-44 object-contain rounded-lg"
              />
            ) : (
              <div className="w-44 h-44 bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">
                <QrCode className="w-8 h-8 opacity-50" />
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow border border-white flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Scan to Launch</span>
          </div>
        </div>

        {/* URL Display Box */}
        <div className="w-full space-y-1 text-left">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            App URL
          </label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-600/30">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full text-xs font-mono text-slate-700 bg-transparent focus:outline-none truncate"
            />
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-slate-400 hover:text-blue-600 transition shrink-0"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-2 pt-1">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm border ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
                : 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600/50 shadow-blue-600/20 hover:shadow'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 animate-bounce" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Share Link</span>
              </>
            )}
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl transition shadow-sm"
              title="Share via system share menu"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Temporary Toast notification */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-lg flex items-center justify-between font-medium shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Link copied to clipboard!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
