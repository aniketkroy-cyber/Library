import React, { useState } from 'react';
import {
  X,
  FileText,
  Send,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { Student, StudentFee, HeaderConfig } from '../../types';
import { getPrimarySeat } from '../../utils/initialData';
import { openDirectWhatsApp } from '../../utils/pdfGenerator';

interface InvoiceReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  fees: Record<string, StudentFee>;
  header: HeaderConfig;
}

export const InvoiceReminderModal: React.FC<InvoiceReminderModalProps> = ({
  isOpen,
  onClose,
  students,
  fees,
  header,
}) => {
  const [warningText, setWarningText] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter students with due or partial status
  const dueStudents = students.filter((s) => {
    const f = fees[s.id] || { status: 'due' };
    return f.status === 'due' || f.status === 'partial';
  });

  const sendInvoiceViaWhatsApp = (student: Student) => {
    const fee = fees[student.id] || { monthlyFee: 600, amount: 0, status: 'due' };
    const dueAmt = Math.max((fee.monthlyFee || 600) - (fee.amount || 0), 0);
    const today = new Date();
    const month = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    const seat = getPrimarySeat(student);

    const message = `📄 *${header.ownerName || 'ReadBench Library'} - Fee Invoice*
━━━━━━━━━━━━━━━━━━━━━
*Student:* ${student.name}
*Mobile:* ${student.mobile || 'Not provided'}
*Seat:* ${seat != null ? `Set ${seat}` : 'SNA (No Seat)'}
*Month:* ${month} ${year}
━━━━━━━━━━━━━━━━━━━━━
*Monthly Fee:* ₹${fee.monthlyFee}
*Paid Amount:* ₹${fee.amount || 0}
*Due Amount:* ₹${dueAmt}
*Status:* ${fee.status.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━
🔹 Please clear the due amount at the earliest.
${
  header.upiId
    ? `🔹 Scan QR or pay via UPI: *${header.upiId}*\n`
    : '🔹 Pay at library counter or ask for UPI details.\n'
}━━━━━━━━━━━━━━━━━━━━━
📞 Contact: ${header.phone || '+918809474959'}
Thank you! 🙏`;

    if (!student.mobile || student.mobile.trim().length === 0) {
      setWarningText(`⚠️ ${student.name} का मोबाइल नंबर उपलब्ध नहीं है। कृपया पहले मोबाइल नंबर जोड़ें।`);
      setTimeout(() => setWarningText(null), 4000);
      return;
    }
    openDirectWhatsApp(student.mobile, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-200" />
            <div>
              <h3 className="text-base font-bold">Pending Fee Invoice Reminders</h3>
              <p className="text-xs text-teal-200">
                Students with pending dues ({dueStudents.length} members)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {warningText && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs font-bold text-amber-900 flex items-center justify-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{warningText}</span>
          </div>
        )}

        {/* List Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3 text-xs">
          {dueStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">All fees are collected!</p>
              <p className="text-xs">No students currently have pending dues.</p>
            </div>
          ) : (
            dueStudents.map((s) => {
              const f = fees[s.id] || { monthlyFee: 600, amount: 0, status: 'due' };
              const dueAmt = Math.max((f.monthlyFee || 600) - (f.amount || 0), 0);
              const seat = getPrimarySeat(s);

              return (
                <div
                  key={s.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-800">{s.name}</h4>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase ${
                          f.status === 'partial'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>📞 {s.mobile || 'No mobile'}</span>
                      <span>•</span>
                      <span className="font-semibold text-indigo-600">
                        Seat: {seat != null ? `Set ${seat}` : 'SNA'}
                      </span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-[10px] bg-white p-2 rounded-xl border border-slate-200/60 mt-2 font-mono">
                      <span>Fee: ₹{f.monthlyFee}</span>
                      <span className="text-emerald-600">Paid: ₹{f.amount || 0}</span>
                      <span className="font-bold text-rose-600">Due: ₹{dueAmt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => sendInvoiceViaWhatsApp(s)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-200 active:scale-95 transition-all w-full sm:w-auto justify-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Invoice</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
