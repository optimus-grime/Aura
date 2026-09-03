import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SavedReport } from '../types';


import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Sparkles,
  Info,
  FileText,
  Clock,
  TrendingUp,
  Activity,
  HeartPulse,
  X,
  Zap,
  CheckCircle2,
  BarChart3,
  Flame,
  ArrowUpRight
} from 'lucide-react';

interface MoodCalendarViewProps {
  reports: SavedReport[];
  onViewReport: (report: SavedReport) => void;
}

// Helper to format Date to local YYYY-MM-DD
function toLocalDateKey(dateObj: Date): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to parse report date string into a Date
function parseReportDate(dateStr: string): Date {
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Mood Category Color Configuration
interface MoodCategoryConfig {
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  dotColor: string;
  icon: React.FC<{ className?: string }>;
}

function getMoodCategory(score?: number): { id: string; name: string; config: MoodCategoryConfig } {
  if (score === undefined || score === null) {
    return {
      id: 'unknown',
      name: 'Unspecified',
      config: {
        label: 'Unspecified',
        bgClass: 'bg-slate-50',
        borderClass: 'border-slate-200',
        textClass: 'text-slate-600',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: 'bg-slate-400',
        icon: Meh
      }
    };
  }

  if (score >= 75) {
    return {
      id: 'high',
      name: 'Energetic & Inspired',
      config: {
        label: 'High Energy',
        bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
        borderClass: 'border-emerald-500/30',
        textClass: 'text-emerald-700',
        badgeBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
        dotColor: 'bg-emerald-500',
        icon: Smile
      }
    };
  }

  if (score >= 55) {
    return {
      id: 'calm',
      name: 'Calm & Centered',
      config: {
        label: 'Calm / Balanced',
        bgClass: 'bg-cyan-500/10 hover:bg-cyan-500/20',
        borderClass: 'border-cyan-500/30',
        textClass: 'text-cyan-700',
        badgeBg: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
        dotColor: 'bg-cyan-500',
        icon: Smile
      }
    };
  }

  if (score >= 40) {
    return {
      id: 'neutral',
      name: 'Steady / Neutral',
      config: {
        label: 'Neutral',
        bgClass: 'bg-amber-500/10 hover:bg-amber-500/20',
        borderClass: 'border-amber-500/30',
        textClass: 'text-amber-700',
        badgeBg: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
        dotColor: 'bg-amber-500',
        icon: Meh
      }
    };
  }

  return {
    id: 'low',
    name: 'Low Energy / Reflective',
    config: {
      label: 'Low / Stressed',
      bgClass: 'bg-rose-500/10 hover:bg-rose-500/20',
      borderClass: 'border-rose-500/30',
      textClass: 'text-rose-700',
      badgeBg: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
      dotColor: 'bg-rose-500',
      icon: Frown
    }
  };
}

export const MoodCalendarView: React.FC<MoodCalendarViewProps> = ({ reports, onViewReport }) => {
  const today = useMemo(() => new Date(), []);
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(() => toLocalDateKey(today));

  // Map reports by local YYYY-MM-DD key using logDate or report date
  const reportsByDateKey = useMemo(() => {
    const map: Record<string, SavedReport[]> = {};
    reports.forEach((rp) => {
      const key = rp.logDate || toLocalDateKey(parseReportDate(rp.date));
      if (!map[key]) map[key] = [];
      map[key].push(rp);
    });
    return map;
  }, [reports]);

  // Compute 30-day stats
  const stats30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReports = reports.filter((rp) => {
      const d = parseReportDate(rp.date);
      return d >= thirtyDaysAgo;
    });

    const activeDaysSet = new Set<string>();
    let totalScore = 0;
    let scoreCount = 0;
    const moodCounts = { high: 0, calm: 0, neutral: 0, low: 0 };

    recentReports.forEach((rp) => {
      const key = toLocalDateKey(parseReportDate(rp.date));
      activeDaysSet.add(key);

      const score = rp.report.readiness?.score;
      if (typeof score === 'number') {
        totalScore += score;
        scoreCount += 1;
        const cat = getMoodCategory(score);
        if (cat.id in moodCounts) {
          moodCounts[cat.id as keyof typeof moodCounts]++;
        }
      }
    });

    const avgReadiness = scoreCount > 0 ? Math.round(totalScore / scoreCount) : null;
    const activeDaysCount = activeDaysSet.size;

    // Determine dominant mood
    let dominantMood = 'No entries';
    let maxCount = -1;
    (Object.keys(moodCounts) as (keyof typeof moodCounts)[]).forEach((k) => {
      if (moodCounts[k] > maxCount && moodCounts[k] > 0) {
        maxCount = moodCounts[k];
        if (k === 'high') dominantMood = 'Energetic & Inspired';
        else if (k === 'calm') dominantMood = 'Calm & Centered';
        else if (k === 'neutral') dominantMood = 'Steady / Neutral';
        else if (k === 'low') dominantMood = 'Low Energy / Reflective';
      }
    });

    return {
      activeDaysCount,
      totalReportsCount: recentReports.length,
      avgReadiness,
      dominantMood,
      moodCounts
    };
  }, [reports]);

  // Calendar Grid Generation
  const year = selectedMonthDate.getFullYear();
  const month = selectedMonthDate.getMonth();

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isInLast30Days: boolean;
      reports: SavedReport[];
    }> = [];

    // Previous month padding
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      const key = toLocalDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: key === toLocalDateKey(today),
        isInLast30Days: false,
        reports: reportsByDateKey[key] || []
      });
    }

    // Current month days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = toLocalDateKey(d);
      const isInLast30 = d >= thirtyDaysAgo && d <= today;

      days.push({
        date: d,
        dateKey: key,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: key === toLocalDateKey(today),
        isInLast30Days: isInLast30,
        reports: reportsByDateKey[key] || []
      });
    }

    // Next month padding to fill grid to multiple of 7
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      const key = toLocalDateKey(d);
      days.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === toLocalDateKey(today),
        isInLast30Days: false,
        reports: reportsByDateKey[key] || []
      });
    }

    return days;
  }, [year, month, reportsByDateKey, today]);

  const handlePrevMonth = () => {
    setSelectedMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonthDate(new Date(year, month + 1, 1));
  };

  const monthLabel = selectedMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const selectedReports = selectedDateKey ? reportsByDateKey[selectedDateKey] || [] : [];

  return (
    <div className="w-full space-y-6">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Days (30d)
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats30Days.activeDaysCount} <span className="text-xs font-normal text-slate-500">/ 30 days</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Readiness Score
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats30Days.avgReadiness !== null ? `${stats30Days.avgReadiness} / 100` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-cyan-600/10 text-cyan-600 rounded-xl">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Dominant Vibe
            </p>
            <p className="text-base font-bold text-slate-900 mt-0.5 truncate max-w-[150px]">
              {stats30Days.dominantMood}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-600/10 text-purple-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Reports Saved
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {reports.length} <span className="text-xs font-normal text-slate-500">entries</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-white backdrop-blur-md rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xl flex flex-col space-y-6">
        {/* Calendar Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">30-Day Mood Calendar</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualizing daily emotional readiness and personality insights
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-bold text-slate-800 min-w-[130px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            Mood Legend:
          </span>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>High Energy (75-100)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-500" />
            <span>Calm / Balanced (55-74)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Neutral (40-54)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span>Low / Stressed (&lt;40)</span>
          </div>
        </div>

        {/* Grid Header (Days of week) */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {calendarGrid.map((dayItem) => {
            const isSelected = selectedDateKey === dayItem.dateKey;
            const hasReports = dayItem.reports.length > 0;
            const topReport = hasReports ? dayItem.reports[0] : null;
            const readinessScore = topReport?.report.readiness?.score;
            const moodCategory = getMoodCategory(readinessScore);

            return (
              <div
                key={dayItem.dateKey}
                onClick={() => setSelectedDateKey(dayItem.dateKey)}
                className={`relative min-h-[70px] md:min-h-[85px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-blue-600 border-blue-600 shadow-md z-10 bg-blue-50/20'
                    : hasReports
                    ? `${moodCategory.config.bgClass} ${moodCategory.config.borderClass} shadow-sm`
                    : dayItem.isCurrentMonth
                    ? 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    : 'bg-slate-50/50 border-slate-100 text-slate-300'
                }`}
              >
                {/* Top row: day number & today badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs md:text-sm font-semibold ${
                      dayItem.isToday
                        ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm'
                        : dayItem.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {dayItem.dayNumber}
                  </span>

                  <div className="flex items-center space-x-1">
                    {hasReports && (
                      <span
                        className={`w-2 h-2 rounded-full ${moodCategory.config.dotColor} shadow-sm`}
                        title={`${dayItem.reports.length} report(s)`}
                      />
                    )}
                  </div>
                </div>

                {/* Bottom row: score or mood pill */}
                {hasReports ? (
                  <div className="mt-1 space-y-1">
                    {typeof readinessScore === 'number' ? (
                      <div
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] md:text-xs font-bold border ${moodCategory.config.badgeBg}`}
                      >
                        <moodCategory.config.icon className="w-3 h-3 shrink-0" />
                        <span>{readinessScore}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium truncate block">
                        Logged
                      </span>
                    )}
                    {topReport?.report.mbti && (
                      <span className="hidden md:block text-[9px] font-mono text-slate-500 tracking-wider">
                        {topReport.report.mbti}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="min-h-[20px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <AnimatePresence mode="wait">
        {selectedDateKey && (
          <motion.div
            key={selectedDateKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-xl">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {new Date(selectedDateKey + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedReports.length === 0
                      ? 'No personality analysis recorded for this day'
                      : `${selectedReports.length} personality log(s) found`}
                  </p>
                </div>
              </div>

              {selectedReports.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 border border-blue-600/20">
                    {selectedReports.length} Entry
                  </span>
                </div>
              )}
            </div>

            {selectedReports.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-slate-50 rounded-xl border border-slate-200">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 text-sm font-medium">
                  No mood or personality reports logged on this date.
                </p>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Complete a Daily Check-in chat or Voice Analysis session to track your mood and build your baseline.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {selectedReports.map((rp, idx) => {
                  const score = rp.report.readiness?.score;
                  const cat = getMoodCategory(score);
                  const dateObj = parseReportDate(rp.date);
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={rp.id || idx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {timeStr}
                          </span>
                          {rp.report.mbti && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-600 text-white shadow-sm">
                              {rp.report.mbti}
                            </span>
                          )}
                        </div>

                        {typeof score === 'number' && (
                          <div
                            className={`flex items-center space-x-2 px-3 py-1 rounded-lg border font-bold text-xs ${cat.config.badgeBg}`}
                          >
                            <cat.config.icon className="w-4 h-4" />
                            <span>Readiness: {score} / 100</span>
                          </div>
                        )}
                      </div>

                      {/* Summary / Casual Summary */}
                      {(rp.report.casualSummary || rp.report.summary) && (
                        <div className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-lg border border-slate-200/80">
                          <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            Daily Reflection
                          </p>
                          {rp.report.casualSummary || rp.report.summary}
                        </div>
                      )}

                      {/* Big Five Mini Bar Preview */}
                      {rp.report.bigFive && (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                          {[
                            { key: 'openness', label: 'Openness', val: rp.report.bigFive.openness, color: 'bg-cyan-500' },
                            { key: 'conscientiousness', label: 'Conscientious', val: rp.report.bigFive.conscientiousness, color: 'bg-purple-500' },
                            { key: 'extraversion', label: 'Extraversion', val: rp.report.bigFive.extraversion, color: 'bg-amber-500' },
                            { key: 'agreeableness', label: 'Agreeable', val: rp.report.bigFive.agreeableness, color: 'bg-emerald-500' },
                            { key: 'neuroticism', label: 'Sensitivity', val: rp.report.bigFive.neuroticism, color: 'bg-rose-500' }
                          ].map((t) => (
                            <div key={t.key} className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600 mb-1">
                                <span>{t.label}</span>
                                <span className="font-mono text-slate-900">{t.val ?? 0}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${t.color}`}
                                  style={{ width: `${Math.min(100, Math.max(0, t.val || 0))}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => onViewReport(rp)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Full Report</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
