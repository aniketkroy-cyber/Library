import React from 'react';
import { CalendarClock, RotateCw, X, Sparkles, AlertTriangle } from 'lucide-react';

interface DailyRefreshModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRefresh: () => void;
}

export const DailyRefreshModal: React.FC<DailyRefreshModalProps> = ({
  isOpen,
  onClose,
  onConfirmRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-7 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
          <CalendarClock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          📅 Daily Fee Cycle Refresh
        </h2>

        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
          As per each student&apos;s individual <strong>admission date monthly billing cycle</strong>, it is time to check and refresh fees for eligible students.
        </p>

        <div className="my-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 text-left space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Smart Automation:</span>
          </div>
          <p>
            Students whose monthly anniversary date has arrived will be automatically updated to <strong>Due</strong> status so you never miss collecting fees.
          </p>
        </div>

        <button
          onClick={() => {
            onConfirmRefresh();
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-98 transition-all"
        >
          <RotateCw className="w-4 h-4" />
          <span>Refresh Fees Now</span>
        </button>
      </div>
    </div>
  );
};
