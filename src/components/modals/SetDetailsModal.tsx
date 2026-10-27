import React from 'react';
import { X, Armchair, Phone, Calendar, UserCheck, Sparkles } from 'lucide-react';
import { Student } from '../../types';

interface SetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  entries: { student: Student; shift?: string }[];
  onSelectStudent: (student: Student) => void;
}

export const SetDetailsModal: React.FC<SetDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  entries,
  onSelectStudent,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-5 relative animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Armchair className="w-4 h-4 text-indigo-600" />
              <span>{title}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-3 max-h-72 overflow-y-auto space-y-2 text-xs">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-emerald-600 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-4">
              <UserCheck className="w-8 h-8 mx-auto mb-1 text-emerald-500" />
              <p className="font-bold">⚡ This set is currently FREE</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                No students are currently allocated to this seat in this shift.
              </p>
            </div>
          ) : (
            entries.map((entry, idx) => {
              const s = entry.student;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectStudent(s);
                    onClose();
                  }}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {s.avatar ? (
                      <img
                        src={s.avatar}
                        alt={s.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-800 hover:underline">{s.name}</h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-slate-400" /> {s.mobile || 'No Mobile'}
                        {entry.shift && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-indigo-600">{entry.shift}</span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400">Adm: {s.admissionDate || '—'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
