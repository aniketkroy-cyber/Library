import React, { useState } from 'react';
import {
  IndianRupee,
  RotateCw,
  Send,
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
} from 'lucide-react';
import { Student, StudentFee } from '../types';
import { getPrimarySeat } from '../utils/initialData';

interface FeesSectionProps {
  students: Student[];
  fees: Record<string, StudentFee>;
  onTriggerDailyRefresh: () => void;
  onOpenInvoiceReminderModal: () => void;
  onOpenPaymentModal: (student: Student) => void;
  onOpenInvoiceModal: (student: Student) => void;
}

export const FeesSection: React.FC<FeesSectionProps> = ({
  students,
  fees,
  onTriggerDailyRefresh,
  onOpenInvoiceReminderModal,
  onOpenPaymentModal,
  onOpenInvoiceModal,
}) => {
  const [search, setSearch] = useState('');
  const [feeFilter, setFeeFilter] = useState<'all' | 'due' | 'partial' | 'paid'>('all');

  const sortedStudents = [...students].sort((a, b) => {
    return (getPrimarySeat(a) ?? 999) - (getPrimarySeat(b) ?? 999);
  });

  const filtered = sortedStudents.filter((s) => {
    const f = fees[s.id] || { status: 'due', amount: 0, monthlyFee: 600 };
    if (feeFilter !== 'all' && f.status !== feeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || (s.mobile || '').includes(q);
    }
    return true;
  });

  // Count pending dues
  const dueCount = students.filter((s) => {
    const f = fees[s.id] || { status: 'due' };
    return f.status === 'due' || f.status === 'partial';
  }).length;

  return (
    <div className="space-y-4">
      {/* Action Header Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-indigo-600" />
            <span>Fee Collection & Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track monthly fee cycles, record cash/UPI payments, and broadcast reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manual Fee Refresh Button */}
          <button
            onClick={onTriggerDailyRefresh}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-600" />
            <span>Refresh Cycle (Due Date)</span>
          </button>

          {/* Send WhatsApp Reminders (Bulk Modal) */}
          <button
            onClick={onOpenInvoiceReminderModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-200 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send WhatsApp Reminders {dueCount > 0 && `(${dueCount})`}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
          {(['all', 'due', 'partial', 'paid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFeeFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                feeFilter === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'all' ? 'All Students' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden"
          />
        </div>
      </div>

      {/* Fee Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((s) => {
          const f = fees[s.id] || {
            status: 'due',
            amount: 0,
            monthlyFee: 600,
            lastPaid: '',
            lastPaymentMethod: '-',
          };
          const seat = getPrimarySeat(s);
          const dueAmt = Math.max((f.monthlyFee || 600) - (f.amount || 0), 0);

          return (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {s.avatar ? (
                        <img
                          src={s.avatar}
                          alt={s.name}
                          className="h-11 w-11 rounded-2xl object-cover ring-2 ring-slate-100"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-200">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          f.status === 'paid'
                            ? 'bg-emerald-500'
                            : f.status === 'partial'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                      />
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 tracking-tight">{s.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-slate-400" /> {s.mobile || '—'}
                      </p>
                      <p className="text-[11px] font-semibold text-indigo-600">
                        Seat: {seat != null ? `Set ${seat}` : 'SNA'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                      f.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : f.status === 'partial'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>

                {/* Ledger Breakdown Details */}
                <div className="mt-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-[11px] space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Monthly Fee:</span>
                    <span className="font-bold text-slate-800">₹{f.monthlyFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-emerald-600">₹{f.amount || 0}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-700">Remaining Due:</span>
                    <span className={dueAmt > 0 ? 'text-rose-600 font-mono' : 'text-emerald-600 font-mono'}>
                      ₹{dueAmt}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px] pt-1 border-t border-slate-200/60">
                    <span>Method: {f.lastPaymentMethod ? f.lastPaymentMethod.toUpperCase() : 'None'}</span>
                    <span>Last Paid: {f.lastPaid || 'Never'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => onOpenPaymentModal(s)}
                  className="flex-1 py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Pay Now</span>
                </button>

                <button
                  onClick={() => onOpenInvoiceModal(s)}
                  className="flex-1 py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-blue-200/60"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
