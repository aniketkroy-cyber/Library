import React, { useState } from 'react';
import {
  Plus,
  Filter,
  X,
  IndianRupee,
  Receipt,
  MessageCircle,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Armchair,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Student, StudentFee, LibraryConfig } from '../types';
import { getPrimarySeat } from '../utils/initialData';

interface StudentsSectionProps {
  students: Student[];
  fees: Record<string, StudentFee>;
  library: LibraryConfig;
  globalSearch: string;
  onOpenNewStudentModal: () => void;
  onOpenEditStudentModal: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onOpenPaymentModal: (student: Student) => void;
  onOpenInvoiceModal: (student: Student) => void;
  onOpenWhatsAppModal: (student: Student) => void;
  onOpenProfileModal: (student: Student) => void;
}

export const StudentsSection: React.FC<StudentsSectionProps> = ({
  students,
  fees,
  library,
  globalSearch,
  onOpenNewStudentModal,
  onOpenEditStudentModal,
  onDeleteStudent,
  onOpenPaymentModal,
  onOpenInvoiceModal,
  onOpenWhatsAppModal,
  onOpenProfileModal,
}) => {
  const [filterShift, setFilterShift] = useState<string>('');
  const [filterSet, setFilterSet] = useState<string>('');
  const [filterFee, setFilterFee] = useState<string>('');
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

  const formatShiftLabel = (shiftId: string) => {
    const s = (library.shifts || []).find((sh) => sh.id === shiftId);
    return s ? s.label : shiftId;
  };

  const handleResetFilters = () => {
    setFilterShift('');
    setFilterSet('');
    setFilterFee('');
    setShowFilterPanel(false);
  };

  const hasActiveFilters = Boolean(filterShift || filterSet || filterFee || globalSearch);

  // Filter students
  const filteredStudents = [...students]
    .sort((a, b) => (getPrimarySeat(a) ?? 999) - (getPrimarySeat(b) ?? 999))
    .filter((s) => {
      // Global text query (name or phone)
      if (globalSearch) {
        const q = globalSearch.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesMobile = (s.mobile || '').toLowerCase().includes(q);
        const matchesAadhar = (s.aadhar || '').toLowerCase().includes(q);
        if (!matchesName && !matchesMobile && !matchesAadhar) return false;
      }

      // Filter by shift
      if (filterShift) {
        const hasShift = (s.assignments || []).some((a) => a.shift === filterShift);
        if (!hasShift) return false;
      }

      // Filter by set
      if (filterSet) {
        if (filterSet === 'SNA') {
          const hasSNA = (s.assignments || []).some((a) => a.set === 'SNA');
          if (!hasSNA) return false;
        } else {
          const setNum = parseInt(filterSet, 10);
          const hasSet = (s.assignments || []).some((a) => a.set === setNum);
          if (!hasSet) return false;
        }
      }

      // Filter by fee status
      if (filterFee) {
        const feeData = fees[s.id] || { status: 'due' };
        if (feeData.status !== filterFee) return false;
      }

      return true;
    });

  return (
    <div className="space-y-4">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
            Students Directory
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {filteredStudents.length} of {students.length}
          </span>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Smart Filters Toggle Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs ${
                hasActiveFilters
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

            {/* Smart Filter Flyout Menu */}
            {showFilterPanel && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <h4 className="text-xs font-bold text-slate-800">Filter Records</h4>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Filter by Shift
                    </label>
                    <select
                      value={filterShift}
                      onChange={(e) => setFilterShift(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-hidden font-medium"
                    >
                      <option value="">All Shifts</option>
                      {(library.shifts || []).map((sh) => (
                        <option key={sh.id} value={sh.id}>
                          {sh.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Filter by Set / Seat
                    </label>
                    <select
                      value={filterSet}
                      onChange={(e) => setFilterSet(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-hidden font-medium"
                    >
                      <option value="">All Sets</option>
                      <option value="SNA">SNA (No Seat Assigned)</option>
                      {Array.from({ length: library.totalSets || 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={String(n)}>
                          Set {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Filter by Fee Status
                    </label>
                    <select
                      value={filterFee}
                      onChange={(e) => setFilterFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 outline-hidden font-medium"
                    >
                      <option value="">All Statuses</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="due">Due / Pending</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleResetFilters}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowFilterPanel(false)}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Student Button */}
          <button
            onClick={onOpenNewStudentModal}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Student Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Armchair className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No students found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'Try modifying your filter parameters or search keyword.'
              : 'Add your first library member to start tracking seats and monthly fees.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors"
            >
              Clear All Filters
            </button>
          ) : (
            <button
              onClick={onOpenNewStudentModal}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ नया स्टूडेंट जोड़ें</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredStudents.map((student) => {
            const fee = fees[student.id] || { status: 'due', amount: 0, monthlyFee: 600 };
            const seat = getPrimarySeat(student);
            const dueAmount = Math.max((fee.monthlyFee || 600) - (fee.amount || 0), 0);

            return (
              <div
                key={student.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top: Avatar with Status Dot, Name & Fee Pill */}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-100 to-indigo-200 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-200">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Live Fee Status Dot */}
                      <span
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                          fee.status === 'paid'
                            ? 'bg-emerald-500'
                            : fee.status === 'partial'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        title={`Fee Status: ${fee.status.toUpperCase()}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-extrabold text-sm text-slate-800 truncate tracking-tight">
                          {student.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            fee.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : fee.status === 'partial'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {fee.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <a href={`tel:${student.mobile}`} className="hover:underline">
                          {student.mobile || 'No Mobile'}
                        </a>
                      </p>

                      <p className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1 mt-0.5">
                        <Armchair className="w-3 h-3" />
                        <span>Seat: {seat != null ? `Set ${seat}` : 'SNA (No Set)'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Shift Badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(student.assignments || []).map((a, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                          a.set === 'SNA'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{formatShiftLabel(a.shift)}</span>
                        <span className="font-mono text-slate-400">({a.set === 'SNA' ? 'SNA' : `#${a.set}`})</span>
                      </span>
                    ))}
                  </div>

                  {/* Fee Box */}
                  <div className="mt-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Monthly Fee:</span>
                      <span className="font-bold text-slate-700">₹{fee.monthlyFee}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Paid this cycle:</span>
                      <span className="font-bold text-emerald-600">₹{fee.amount || 0}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600">Pending Due:</span>
                      <span className={dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        ₹{dueAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    onClick={() => onOpenPaymentModal(student)}
                    className="py-1.5 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center gap-1 transition-colors text-[11px]"
                    title="Pay with Cash or Dynamic UPI QR"
                  >
                    <IndianRupee className="w-3 h-3" /> Pay
                  </button>

                  <button
                    onClick={() => onOpenInvoiceModal(student)}
                    className="py-1.5 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center justify-center gap-1 transition-colors text-[11px]"
                    title="View Fee Receipt / Invoice"
                  >
                    <Receipt className="w-3 h-3" /> Receipt
                  </button>

                  <button
                    onClick={() => onOpenWhatsAppModal(student)}
                    className="py-1.5 px-1 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-bold flex items-center justify-center gap-1 transition-colors text-[11px]"
                    title="Send WhatsApp Template message"
                  >
                    <MessageCircle className="w-3 h-3" /> WA
                  </button>

                  <button
                    onClick={() => onOpenProfileModal(student)}
                    className="py-1.5 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center justify-center gap-1 transition-colors text-[11px]"
                    title="View Student Profile Card with Year Matrix"
                  >
                    <Eye className="w-3 h-3" /> Card
                  </button>

                  <button
                    onClick={() => onOpenEditStudentModal(student)}
                    className="py-1.5 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium flex items-center justify-center gap-1 transition-colors text-[11px]"
                    title="Edit Student Information"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>

                  <button
                    onClick={() => onDeleteStudent(student)}
                    className="py-1.5 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium flex items-center justify-center gap-1 transition-colors text-[11px]"
                    title="Delete Student Record"
                  >
                    <Trash2 className="w-3 h-3" /> Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
