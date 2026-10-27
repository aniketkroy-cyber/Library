import React from 'react';
import { Trash2, AlertTriangle, X, Armchair, Phone } from 'lucide-react';
import { Student } from '../../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onConfirmDelete: (student: Student) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirmDelete,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-xs">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-black text-slate-900 text-center tracking-tight">
          Delete Student Record?
        </h3>
        <p className="text-xs text-slate-500 text-center mt-1">
          This action will permanently delete this member from the library roster and free up their assigned seat(s).
        </p>

        {/* Member Preview Card */}
        <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
              {student.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-slate-800 truncate">{student.name}</h4>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{student.mobile || 'No Mobile'}</span>
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1">
              <Armchair className="w-3 h-3" />
              <span>Seat: {student.seat != null ? `Set ${student.seat}` : 'SNA (No Seat)'}</span>
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
              student.feeStatus === 'paid'
                ? 'bg-emerald-100 text-emerald-800'
                : student.feeStatus === 'partial'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {student.feeStatus}
          </span>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(student);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-rose-200 active:scale-98"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
