import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  Calendar,
  Phone,
  Armchair,
  CheckCircle2,
  Sparkles,
  Wifi,
  QrCode,
  ShieldCheck,
  CreditCard,
  Layers,
} from 'lucide-react';
import { Student, StudentFee, HeaderConfig, LibraryConfig } from '../../types';
import { getPrimarySeat } from '../../utils/initialData';
import { openDirectWhatsApp } from '../../utils/pdfGenerator';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  feeData: StudentFee | null;
  library: LibraryConfig;
  header: HeaderConfig;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  feeData,
  library,
  header,
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'ledger'>('card');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const fee = feeData || {
    status: 'due',
    amount: 0,
    monthlyFee: 600,
    lastPaid: '',
    lastPaymentMethod: '-',
    months: {},
  };

  const seat = getPrimarySeat(student);
  const currentMonthIdx = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsData = fee.months || {};

  const formatShiftLabel = (shiftId: string) => {
    const s = (library.shifts || []).find((sh) => sh.id === shiftId);
    return s ? s.label : shiftId;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const assignStr = (student.assignments || [])
      .map((a) => `${formatShiftLabel(a.shift)} (${a.set === 'SNA' ? 'SNA' : 'Set ' + a.set})`)
      .join(', ') || 'General Shift';

    const msg = `🎓 *ReadBench Student Smart Card* 🎓\n\n*${header.ownerName || 'Library'}*\n━━━━━━━━━━━━━━━━━━━━━\n*Member:* ${student.name}\n*Member ID:* RB-2026-${student.id.slice(-4)}\n*Mobile:* ${student.mobile || '—'}\n*Seat:* ${seat != null ? `Set ${seat}` : 'SNA'}\n*Shift(s):* ${assignStr}\n*Admission:* ${student.admissionDate || '—'}\n━━━━━━━━━━━━━━━━━━━━━\n💳 *Fee Record:* ₹${fee.amount || 0} Paid / ₹${fee.monthlyFee} Target (Status: ${fee.status.toUpperCase()})\n━━━━━━━━━━━━━━━━━━━━━\n📞 Contact Desk: ${header.phone || '+918809474959'}`;

    if (!student.mobile || student.mobile.trim().length === 0) {
      setStatusMessage('⚠️ Mobile number missing for this member');
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    openDirectWhatsApp(student.mobile, msg);
    setStatusMessage(`✅ Opening WhatsApp for ${student.name}...`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Top Controls */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs tracking-tight">Digital Smart PVC Library Card</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
            >
              <Printer className="w-3 h-3" />
              <span>Print Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 border-b animate-in fade-in ${
              statusMessage.startsWith('⚠️')
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-4 pt-2 no-print">
          <button
            onClick={() => setActiveTab('card')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'card'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Smart PVC Card</span>
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-2 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>12-Month Fee Ledger</span>
          </button>
        </div>

        {/* Modal Content */}
        <div id="printable-receipt" className="p-5 sm:p-6 space-y-4 text-xs bg-white">
          {activeTab === 'card' ? (
            /* ================= REALISTIC PVC SMART MEMBERSHIP CARD ================= */
            <div className="space-y-4">
              <div className="relative rounded-3xl p-5 sm:p-6 text-white shadow-2xl border border-slate-700/60 overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950">
                {/* Hologram metallic gradient sheen */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-500/20 via-sky-500/10 to-amber-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-purple-500/10 via-emerald-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

                {/* Card Top: Logo, Institution Name & Contactless Icon */}
                <div className="relative z-10 flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                      RB
                    </div>
                    <div>
                      <h3 className="font-black text-sm tracking-tight text-white uppercase line-clamp-1">
                        {header.ownerName || 'ANIKET ROY LIBRARY'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                        Official Membership Card
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-white/70">
                    <Wifi className="w-4 h-4 rotate-90" />
                    <span className="text-[9px] font-mono tracking-wider font-bold">RFID</span>
                  </div>
                </div>

                {/* EMV Chip & Hologram Foil */}
                <div className="relative z-10 flex items-center justify-between my-3.5">
                  {/* Realistic Gold EMV Chip Graphic */}
                  <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200/60 shadow-inner flex flex-col justify-around p-1">
                    <div className="border-b border-amber-700/40 w-full h-1"></div>
                    <div className="border-b border-amber-700/40 w-full h-1"></div>
                  </div>

                  {/* Seat Hologram Badge */}
                  <div className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-right shadow-xs">
                    <span className="text-[9px] text-amber-300 uppercase tracking-wider block font-bold">
                      Seat Reserved
                    </span>
                    <span className="text-sm font-black font-mono text-white">
                      {seat != null ? `SET #${seat}` : 'SNA (FLOATING)'}
                    </span>
                  </div>
                </div>

                {/* Member Profile Details & Photo */}
                <div className="relative z-10 flex items-center gap-4 pt-1">
                  {/* Photo with metallic ring */}
                  <div className="relative shrink-0">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400/70 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center ring-2 ring-amber-400/70 shadow-lg">
                        {student.name.charAt(0)}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                        fee.status === 'paid'
                          ? 'bg-emerald-400'
                          : fee.status === 'partial'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                      title={`Status: ${fee.status}`}
                    />
                  </div>

                  {/* Name and Member ID */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-base text-white tracking-wide uppercase truncate drop-shadow-xs">
                      {student.name}
                    </h4>
                    <p className="text-xs text-amber-300 font-mono font-bold mt-0.5 tracking-wider">
                      RB-2026-{student.id.slice(-4)}
                    </p>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {student.mobile || '—'}
                    </p>
                  </div>
                </div>

                {/* Card Bottom: Validity & Barcode Strip */}
                <div className="relative z-10 mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                  <div>
                    <span className="text-slate-400 text-[9px] block">JOINED:</span>
                    <span className="font-bold text-white">{student.admissionDate || '2026-10-01'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[9px] block">EXPIRY CYCLE:</span>
                    <span className="font-bold text-amber-300">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-white/10 text-white">
                      Verified Member
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Card Details Summary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-slate-700">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">Assigned Shift(s):</span>
                  <span className="font-semibold text-indigo-700">
                    {(student.assignments || [])
                      .map((a) => `${formatShiftLabel(a.shift)} (${a.set === 'SNA' ? 'SNA' : 'Set ' + a.set})`)
                      .join(', ') || 'No Shift'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">Monthly Membership Fee:</span>
                  <span className="font-mono font-bold text-slate-900">₹{fee.monthlyFee}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600">Fee Status:</span>
                  <span
                    className={`font-black uppercase text-[11px] ${
                      fee.status === 'paid'
                        ? 'text-emerald-600'
                        : fee.status === 'partial'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {fee.status} (Paid: ₹{fee.amount || 0})
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ================= 12-MONTH FEE STATUS GRID ================= */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                  Annual Fee Calendar ({currentYear})
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Monthly fee payment verification grid for member {student.name}.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {monthNames.map((m, idx) => {
                    const key = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
                    const st = monthsData[key] || 'due';
                    const isCurrent = idx === currentMonthIdx;

                    return (
                      <div
                        key={m}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          st === 'paid'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : st === 'partial'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-slate-100/70 border-slate-200 text-slate-400'
                        } ${isCurrent ? 'ring-2 ring-indigo-600 ring-offset-1 font-black shadow-xs' : ''}`}
                      >
                        <span className="text-xs font-bold block">{m}</span>
                        <span className="text-[9px] uppercase font-bold tracking-wider">
                          {st === 'paid' ? 'Paid' : st === 'partial' ? 'Partial' : 'Due'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ledger Summary */}
              <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Payment Recorded:</span>
                  <span className="font-bold text-slate-800">{fee.lastPaid || 'Never'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="font-mono uppercase font-bold text-indigo-700">
                    {fee.lastPaymentMethod || 'None'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-indigo-100 pt-1">
                  <span className="text-slate-700 font-bold">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-rose-600">
                    ₹{Math.max((fee.monthlyFee || 600) - (fee.amount || 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
