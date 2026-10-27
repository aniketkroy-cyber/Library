import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  PlusCircle,
  QrCode,
  RotateCw,
  BarChart3,
  LineChart,
  CalendarCheck2,
  Armchair,
  Activity,
  DollarSign,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts';
import { Student, StudentFee, LibraryConfig, Shift, Assignment } from '../types';

// Stable static objects for Recharts to prevent render re-subscription loops in React 19
const CHART_MARGIN = { top: 15, right: 20, left: 0, bottom: 5 };
const LEGEND_STYLE = { fontSize: '11px', paddingTop: '10px' };
const REVENUE_DOT = { r: 5, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 };
const REVENUE_ACTIVE_DOT = { r: 8, fill: '#10b981', stroke: '#ffffff', strokeWidth: 3 };

// File-level Custom Tooltip component with stable identity
const CustomRechartsTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data) return null;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
        <p className="font-extrabold text-indigo-300 text-sm border-b border-slate-800 pb-1">
          {data.monthKey}
        </p>
        <div className="flex justify-between gap-4 text-slate-300">
          <span>Collected Revenue:</span>
          <span className="font-mono font-bold text-emerald-400">
            ₹{data.revenue?.toLocaleString('en-IN') || 0}
          </span>
        </div>
        <div className="flex justify-between gap-4 text-slate-400">
          <span>Monthly Target:</span>
          <span className="font-mono text-slate-200">
            ₹{data.target?.toLocaleString('en-IN') || 0}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 font-bold text-amber-300">
          <span>Achievement:</span>
          <span>{data.achievement || 0}%</span>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardProps {
  students: Student[];
  fees: Record<string, StudentFee>;
  library: LibraryConfig;
  monthlyCollectionByYear: Record<string, number[]>;
  onNavigateToStudents: () => void;
  onNavigateToFees: () => void;
  onNavigateToLibrary: () => void;
  onOpenNewStudentModal: () => void;
  onOpenQuickPayment: () => void;
  onTriggerDailyRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  fees,
  library,
  monthlyCollectionByYear,
  onNavigateToStudents,
  onNavigateToFees,
  onNavigateToLibrary,
  onOpenNewStudentModal,
  onOpenQuickPayment,
  onTriggerDailyRefresh,
}) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [chartViewMode, setChartViewMode] = useState<'area' | 'bar'>('area');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(new Date().getMonth());

  // Aggregates
  let paidCount = 0;
  let partialCount = 0;
  let dueCount = 0;
  let totalTarget = 0;
  let totalCollected = 0;

  students.forEach((s) => {
    const f = fees[s.id] || { status: 'due', monthlyFee: 600, amount: 0 };
    totalTarget += f.monthlyFee || 600;
    totalCollected += f.amount || 0;

    if (f.status === 'paid') paidCount++;
    else if (f.status === 'partial') partialCount++;
    else dueCount++;
  });

  const totalStudents = students.length || 1;
  const collectionPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCollected * 100) / totalTarget)) : 0;
  const paidPercent = Math.round((paidCount * 100) / totalStudents);
  const partialPercent = Math.round((partialCount * 100) / totalStudents);
  const duePercent = Math.round((dueCount * 100) / totalStudents);

  // Shift & Set stats
  const shiftCounts: Record<string, number> = {};
  (library.shifts || []).forEach((sh: Shift) => (shiftCounts[sh.id] = 0));
  const setCounts: Record<number, number> = {};
  for (let i = 1; i <= (library.totalSets || 10); i++) setCounts[i] = 0;
  let snaCount = 0;

  students.forEach((s) => {
    (s.assignments || []).forEach((a: Assignment) => {
      if (shiftCounts[a.shift] !== undefined) shiftCounts[a.shift]++;
      if (a.set === 'SNA') snaCount++;
      else if (typeof a.set === 'number' && setCounts[a.set] !== undefined) {
        setCounts[a.set]++;
      }
    });
  });

  // Monthly Data for selected year
  const monthlyData = monthlyCollectionByYear[selectedYear] || Array(12).fill(0);
  const yearTotal = monthlyData.reduce((acc, curr) => acc + curr, 0);
  const annualTarget = totalTarget * 12;
  const yearPercent = annualTarget > 0 ? Math.round((yearTotal * 100) / annualTarget) : 0;
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxMonthlyVal = Math.max(30000, ...monthlyData, 10000);

  // Peak month calculation
  let peakVal = 0;
  let peakIdx = 0;
  monthlyData.forEach((v, idx) => {
    if (v > peakVal) {
      peakVal = v;
      peakIdx = idx;
    }
  });

  const averageMonthly = Math.round(yearTotal / 12);

  // ==================== RECHARTS: LAST 6 MONTHS REVENUE TRENDS ====================
  const last6MonthsData = useMemo(() => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonthIdx = today.getMonth(); // 0 to 11

    const result = [];
    for (let i = 5; i >= 0; i--) {
      let targetMonthIdx = curMonthIdx - i;
      let targetYear = curYear;
      if (targetMonthIdx < 0) {
        targetMonthIdx += 12;
        targetYear -= 1;
      }

      const yearArr = monthlyCollectionByYear[targetYear.toString()] || Array(12).fill(0);
      const rev = yearArr[targetMonthIdx] || 0;
      const targetVal = totalTarget > 0 ? totalTarget : 22000;

      result.push({
        monthKey: `${monthLabels[targetMonthIdx]} '${String(targetYear).slice(-2)}`,
        monthName: monthLabels[targetMonthIdx],
        year: targetYear,
        revenue: rev,
        target: targetVal,
        achievement: targetVal > 0 ? Math.round((rev * 100) / targetVal) : 0,
      });
    }
    return result;
  }, [monthlyCollectionByYear, totalTarget]);

  // 6-Month Insights Calculations
  const sixMonthTotal = useMemo(
    () => last6MonthsData.reduce((sum, item) => sum + item.revenue, 0),
    [last6MonthsData]
  );
  const sixMonthAverage = Math.round(sixMonthTotal / 6);
  const firstMonthRev = last6MonthsData[0]?.revenue || 1;
  const latestMonthRev = last6MonthsData[last6MonthsData.length - 1]?.revenue || 0;
  const sixMonthGrowth = Math.round(((latestMonthRev - firstMonthRev) / Math.max(firstMonthRev, 1)) * 100);
  const bestMonthItem = [...last6MonthsData].sort((a, b) => b.revenue - a.revenue)[0];

  // Build SVG Smooth Bezier Line Path for Year Area Chart
  const svgWidth = 600;
  const svgHeight = 160;
  const paddingX = 25;
  const paddingY = 20;
  const usableWidth = svgWidth - paddingX * 2;
  const usableHeight = svgHeight - paddingY * 2;

  const points = monthlyData.map((val, idx) => {
    const x = paddingX + (idx / 11) * usableWidth;
    const y = svgHeight - paddingY - (val / maxMonthlyVal) * usableHeight;
    return { x, y, val, month: monthLabels[idx] };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }

  const areaPathD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  // Weekly Attendance flow simulation (Mon to Sun)
  const weekDays = [
    { day: 'Mon', count: Math.round(students.length * 0.92), time: '92% Peak' },
    { day: 'Tue', count: Math.round(students.length * 0.88), time: '88% Flow' },
    { day: 'Wed', count: Math.round(students.length * 0.95), time: '95% Peak' },
    { day: 'Thu', count: Math.round(students.length * 0.85), time: '85% Flow' },
    { day: 'Fri', count: Math.round(students.length * 0.90), time: '90% Flow' },
    { day: 'Sat', count: Math.round(students.length * 0.98), time: '98% Rush' },
    { day: 'Sun', count: Math.round(students.length * 0.75), time: '75% Moderate' },
  ];

  // Available Years
  const availableYears = Object.keys(monthlyCollectionByYear).sort((a, b) => Number(b) - Number(a));
  if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);

  return (
    <div className="space-y-4 pb-6">
      {/* 1. Hero Dark Fee Overview Card */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Ambient glow flare */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Headline & Totals */}
          <div className="flex-1 text-center md:text-left space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-indigo-200">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Current Monthly Cycle Overview</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Monthly Collection Velocity</p>
            <div className="flex items-baseline justify-center md:justify-start gap-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                {showBalance ? `₹${totalCollected.toLocaleString('en-IN')}` : '••••••••'}
              </p>
              {showBalance && (
                <span className="text-xs text-slate-400 font-semibold font-mono">
                  / ₹{totalTarget.toLocaleString('en-IN')} target
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              {collectionPercent}% collected of total student targets. Keep collecting fees regularly to maintain zero-dues status.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-3">
              <button
                onClick={onOpenQuickPayment}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Instant UPI QR</span>
              </button>
              <button
                onClick={onOpenNewStudentModal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-indigo-950 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Student</span>
              </button>
              <button
                onClick={onTriggerDailyRefresh}
                title="Refresh fee due dates based on student admission calendar"
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-300" />
                <span>Cycle Refresh</span>
              </button>
            </div>
          </div>

          {/* Center: Main SVG Doughnut Progress Chart */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-slate-800"
                  strokeWidth="11"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="text-emerald-400 transition-all duration-1000 ease-out"
                  strokeWidth="11"
                  strokeDasharray={`${(collectionPercent / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white">{collectionPercent}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collected</span>
              </div>
            </div>
          </div>

          {/* Right: 3 Mini Doughnut status gauges */}
          <div className="flex sm:flex-row md:flex-col gap-4 sm:gap-6 md:gap-3 justify-center items-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            {/* Paid Mini */}
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" stroke="#1e293b" strokeWidth="4.5" fill="none" />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="#10b981"
                    strokeWidth="4.5"
                    strokeDasharray={`${(paidPercent / 100) * 100.5} 100.5`}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-400">
                  {paidPercent}%
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-semibold mt-0.5">Paid ({paidCount})</span>
            </div>

            {/* Partial Mini */}
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" stroke="#1e293b" strokeWidth="4.5" fill="none" />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="#f59e0b"
                    strokeWidth="4.5"
                    strokeDasharray={`${(partialPercent / 100) * 100.5} 100.5`}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-amber-400">
                  {partialPercent}%
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-semibold mt-0.5">Partial ({partialCount})</span>
            </div>

            {/* Due Mini */}
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" stroke="#1e293b" strokeWidth="4.5" fill="none" />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="#f43f5e"
                    strokeWidth="4.5"
                    strokeDasharray={`${(duePercent / 100) * 100.5} 100.5`}
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-rose-400">
                  {duePercent}%
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-semibold mt-0.5">Due ({dueCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Banner for Clean New Account */}
      {students.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/90 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>आपकी नई लाइब्रेरी तैयार है!</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold">🔒 100% प्राइवेट व सेफ</span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                आपका डेटा पूरी तरह से अलग और सुरक्षित है। अब अपनी लाइब्रेरी का पहला छात्र रजिस्टर करने के लिए '+ नया स्टूडेंट जोड़ें' पर क्लिक करें।
              </p>
            </div>
          </div>
          <button
            onClick={onOpenNewStudentModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm shadow-emerald-300 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ पहला स्टूडेंट जोड़ें</span>
          </button>
        </div>
      )}

      {/* 2. Four Color Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Students */}
        <div
          onClick={onNavigateToStudents}
          className="rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-600 text-white p-4 shadow-xs border border-indigo-400/30 flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-101 transition-all group"
        >
          <div>
            <p className="text-[11px] text-indigo-100 font-bold flex items-center gap-1">
              <Users className="w-3 h-3" /> Total Enrolled
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-black font-mono">{students.length}</p>
            <p className="text-[10px] text-indigo-200 mt-0.5">Active Study Members</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Paid */}
        <div
          onClick={onNavigateToFees}
          className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white p-4 shadow-xs border border-emerald-400/30 flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-101 transition-all group"
        >
          <div>
            <p className="text-[11px] text-emerald-100 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Cleared Fees
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-black font-mono">{paidCount}</p>
            <p className="text-[10px] text-emerald-200 mt-0.5">{paidPercent}% of library</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Partial */}
        <div
          onClick={onNavigateToFees}
          className="rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white p-4 shadow-xs border border-amber-400/30 flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-101 transition-all group"
        >
          <div>
            <p className="text-[11px] text-amber-100 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" /> Partial Paid
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-black font-mono">{partialCount}</p>
            <p className="text-[10px] text-amber-200 mt-0.5">Pending Balance</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Due */}
        <div
          onClick={onNavigateToFees}
          className="rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 text-white p-4 shadow-xs border border-rose-400/30 flex items-center justify-between cursor-pointer hover:shadow-md hover:scale-101 transition-all group"
        >
          <div>
            <p className="text-[11px] text-rose-100 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Full Due
            </p>
            <p className="mt-1 text-2xl sm:text-3xl font-black font-mono">{dueCount}</p>
            <p className="text-[10px] text-rose-200 mt-0.5">Requires Attention</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECHARTS: 6-MONTH REVENUE TRENDS & FINANCIAL INSIGHTS (REQUESTED)      */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700">
                <LineChart className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Last 6 Months Revenue Trends
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100">
                Recharts Analytics
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multi-month cash flow trajectory, target achievement, and growth momentum
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span>Actual vs Target</span>
            </span>
          </div>
        </div>

        {/* 6-Month Executive Insights Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-indigo-100/30 border border-indigo-100">
            <span className="text-[10px] text-indigo-900/70 font-bold uppercase tracking-wider block">
              6-Month Total Collection
            </span>
            <p className="mt-1 text-lg sm:text-xl font-black font-mono text-indigo-950">
              {showBalance ? `₹${sixMonthTotal.toLocaleString('en-IN')}` : '••••••••'}
            </p>
            <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Across Last 6 Billing Cycles</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 border border-emerald-100">
            <span className="text-[10px] text-emerald-900/70 font-bold uppercase tracking-wider block">
              Monthly Average Revenue
            </span>
            <p className="mt-1 text-lg sm:text-xl font-black font-mono text-emerald-950">
              {showBalance ? `₹${sixMonthAverage.toLocaleString('en-IN')}` : '••••••••'}
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Expected Baseline / Month</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/70 to-amber-100/30 border border-amber-100">
            <span className="text-[10px] text-amber-900/70 font-bold uppercase tracking-wider block">
              6-Month Growth Trajectory
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <p className="text-lg sm:text-xl font-black font-mono text-amber-950">
                {sixMonthGrowth >= 0 ? `+${sixMonthGrowth}%` : `${sixMonthGrowth}%`}
              </p>
              {sixMonthGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Vs Month 1 Baseline</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50/70 to-sky-100/30 border border-sky-100">
            <span className="text-[10px] text-sky-900/70 font-bold uppercase tracking-wider block">
              Top Collection Month
            </span>
            <p className="mt-1 text-lg sm:text-xl font-black font-mono text-sky-950">
              {bestMonthItem?.monthName || '—'}
            </p>
            <p className="text-[10px] text-sky-700 font-semibold mt-0.5">
              {showBalance ? `₹${(bestMonthItem?.revenue || 0).toLocaleString('en-IN')}` : '••••••'}
            </p>
          </div>
        </div>

        {/* Recharts Responsive Line Chart */}
        <div className="w-full h-72 sm:h-80 pt-2 min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%" minHeight={280}>
            <RechartsLineChart data={last6MonthsData} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="monthKey"
                stroke="#94a3b8"
                fontSize={11}
                fontWeight={600}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                fontWeight={500}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <RechartsTooltip content={CustomRechartsTooltip} />
              <RechartsLegend
                wrapperStyle={LEGEND_STYLE}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Actual Revenue (₹)"
                stroke="#4f46e5"
                strokeWidth={3.5}
                dot={REVENUE_DOT}
                activeDot={REVENUE_ACTIVE_DOT}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Monthly Target (₹)"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={false}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Full Year Interactive Revenue Analytics (Curve & Pillars) */}
      <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Full Year Financial Calendar & Breakdown
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              12-Month trajectory for Selected Academic / Financial Year
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1 text-xs">
              <button
                onClick={() => setChartViewMode('area')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  chartViewMode === 'area'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Curve</span>
              </button>
              <button
                onClick={() => setChartViewMode('bar')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  chartViewMode === 'bar'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Pillars</span>
              </button>
            </div>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-700 outline-hidden hover:bg-slate-100 cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold flex items-center gap-1 transition-colors"
            >
              {showBalance ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showBalance ? 'Hide' : 'Show'}</span>
            </button>
          </div>
        </div>

        {/* Visual Chart View Area */}
        <div className="bg-gradient-to-b from-slate-50/50 to-white rounded-2xl p-3 border border-slate-100">
          {chartViewMode === 'area' ? (
            /* --- AREA / LINE BEZIER CURVE SVG --- */
            <div className="relative w-full overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="collectionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                    <stop offset="70%" stopColor="#6366f1" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1={paddingX} y1={paddingY + usableHeight / 2} x2={svgWidth - paddingX} y2={paddingY + usableHeight / 2} stroke="#e2e8f0" strokeDasharray="4 4" />
                <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Area Gradient Fill */}
                <path d={areaPathD} fill="url(#collectionGrad)" />

                {/* Main Stroke Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Points & Interactive Nodes */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredMonthIdx === idx;
                  return (
                    <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredMonthIdx(idx)}>
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1={paddingY}
                          x2={pt.x}
                          y2={svgHeight - paddingY}
                          stroke="#6366f1"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 6 : 4}
                        className={`transition-all duration-150 ${
                          isHovered
                            ? 'fill-indigo-600 stroke-white stroke-2'
                            : 'fill-white stroke-indigo-600 stroke-2'
                        }`}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Month Labels Strip */}
              <div className="flex justify-between px-2 pt-1">
                {monthLabels.map((m, idx) => (
                  <span
                    key={m}
                    onClick={() => setHoveredMonthIdx(idx)}
                    className={`text-[10px] font-bold cursor-pointer transition-colors ${
                      hoveredMonthIdx === idx ? 'text-indigo-600 underline' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {m}
                  </span>
                ))}
              </div>

              {/* Active Hover Floating Stat Badge */}
              {hoveredMonthIdx !== null && (
                <div className="mt-2.5 p-2 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold">{monthLabels[hoveredMonthIdx]} {selectedYear}:</span>
                    <span className="font-mono font-bold text-amber-300">
                      ₹{monthlyData[hoveredMonthIdx].toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {totalTarget > 0 ? Math.round((monthlyData[hoveredMonthIdx] * 100) / totalTarget) : 0}% of Monthly Goal
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* --- BAR BREAKDOWN PILLARS --- */
            <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-4 px-1">
              {monthlyData.map((val, idx) => {
                const barHeightPercent = maxMonthlyVal > 0 ? Math.min(100, Math.round((val / maxMonthlyVal) * 100)) : 0;
                const isZero = val === 0;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredMonthIdx(idx)}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    <div
                      className={`w-full max-w-[22px] rounded-t-lg transition-all duration-500 ease-out ${
                        isZero
                          ? 'bg-slate-200 h-1.5'
                          : val >= 20000
                          ? 'bg-indigo-600 group-hover:bg-indigo-500'
                          : val >= 10000
                          ? 'bg-emerald-500 group-hover:bg-emerald-400'
                          : 'bg-amber-500 group-hover:bg-amber-400'
                      }`}
                      style={{ height: isZero ? '4px' : `${Math.max(barHeightPercent, 8)}%` }}
                    />
                    <span className="text-[10px] text-slate-500 font-semibold mt-1.5">
                      {monthLabels[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Two Bottom Visual Graph Cards: Shift Occupancy Radial & Weekly Activity Pulse */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Card A: Shift Capacity & Occupancy Radial Breakdown */}
        <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700">
                <Armchair className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Shift Desk Occupancy</h4>
                <p className="text-[11px] text-slate-400">Desk distribution per timing slot</p>
              </div>
            </div>
            <button
              onClick={onNavigateToLibrary}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
            >
              Matrix <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {(library.shifts || []).map((sh: Shift) => {
              const used = shiftCounts[sh.id] || 0;
              const total = library.totalSets || 10;
              const pct = Math.round((used * 100) / total);

              return (
                <div key={sh.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sh.label}</span>
                    </span>
                    <span className="font-mono text-indigo-700">{used} / {total} Desks ({pct}%)</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mt-2">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pct >= 90
                          ? 'bg-rose-500'
                          : pct >= 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card B: Weekly Activity Pulse & Footfall Tracker */}
        <div className="rounded-3xl bg-white p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Weekly Library Pulse</h4>
                <p className="text-[11px] text-slate-400">Day-by-day member study activity</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Live Flow
            </span>
          </div>

          <div className="pt-2">
            <div className="h-32 flex items-end justify-between gap-2 px-1">
              {weekDays.map((w, idx) => {
                const heightPct = Math.round((w.count / (students.length || 1)) * 100);
                const isPeak = heightPct >= 90;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isPeak
                          ? 'bg-emerald-500 group-hover:bg-emerald-400'
                          : 'bg-indigo-400/80 group-hover:bg-indigo-500'
                      }`}
                      style={{ height: `${Math.max(heightPct, 15)}%` }}
                    />
                    <span className="text-[10px] text-slate-600 font-bold mt-1.5">{w.day}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{w.count}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Peak Hours: <strong>6AM–10AM</strong> & <strong>6PM–10PM</strong></span>
              <span className="font-semibold text-indigo-600">Turnover: Nominal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
