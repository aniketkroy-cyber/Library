import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  IndianRupee,
  Camera,
  Upload,
  Trash2,
  Plus,
  Save,
  Armchair,
  IdCard,
} from 'lucide-react';
import { Student, StudentFee, LibraryConfig, Assignment } from '../../types';
import { compressToMaxSize } from '../../utils/imageCompressor';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null; // If editing, otherwise null for adding
  existingStudents: Student[];
  library: LibraryConfig;
  fees: Record<string, StudentFee>;
  onSaveStudent: (student: Student, monthlyFee: number, initialStatus: 'paid' | 'partial' | 'due') => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  student,
  existingStudents,
  library,
  fees,
  onSaveStudent,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [feeStatus, setFeeStatus] = useState<'paid' | 'partial' | 'due'>('due');
  const [monthlyFee, setMonthlyFee] = useState<number>(600);
  const [avatar, setAvatar] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([{ shift: '', set: '' as any }]);
  const [formError, setFormError] = useState<string>('');

  const shifts = library.shifts || [];
  const totalSets = library.totalSets || 10;

  // Initialize form state
  useEffect(() => {
    if (student) {
      setName(student.name || '');
      setMobile(student.mobile || '');
      setAadhar(student.aadhar || '');
      setAdmissionDate(student.admissionDate || '');
      setAvatar(student.avatar || '');
      const f = fees[student.id] || { status: 'due', monthlyFee: 600 };
      setFeeStatus(f.status || 'due');
      setMonthlyFee(f.monthlyFee || 600);
      setAssignments(
        student.assignments && student.assignments.length > 0
          ? [...student.assignments]
          : [{ shift: '', set: '' as any }]
      );
    } else {
      // New Student Defaults
      setName('');
      setMobile('');
      setAadhar('');
      setAdmissionDate(new Date().toISOString().slice(0, 10));
      setFeeStatus('due');
      setMonthlyFee(600);
      setAvatar('');
      const firstShift = shifts[0]?.id || '';
      setAssignments([{ shift: firstShift, set: '' as any }]);
    }
  }, [student, isOpen, shifts, fees]);

  if (!isOpen) return null;

  // Find occupied seats across existing students (excluding current student being edited)
  const occupiedSlots = new Set<string>();
  existingStudents.forEach((s) => {
    if (student && s.id === student.id) return;
    (s.assignments || []).forEach((a) => {
      if (a.shift && a.set && a.set !== 'SNA') {
        occupiedSlots.add(`${a.shift}|${a.set}`);
      }
    });
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressToMaxSize(file, 15);
      setAvatar(compressed);
    } catch (err) {
      setFormError('Error processing photo: ' + (err as Error).message);
    }
  };

  const handleAddAssignmentRow = () => {
    const firstShift = shifts[0]?.id || '';
    setAssignments([...assignments, { shift: firstShift, set: '' as any }]);
  };

  const handleRemoveAssignmentRow = (index: number) => {
    const next = assignments.filter((_, i) => i !== index);
    setAssignments(next.length ? next : [{ shift: '', set: '' as any }]);
  };

  const handleAssignmentShiftChange = (index: number, newShift: string) => {
    const next = [...assignments];
    next[index] = { ...next[index], shift: newShift, set: '' as any };
    setAssignments(next);
  };

  const handleAssignmentSetChange = (index: number, newSetVal: string) => {
    const next = [...assignments];
    const val = newSetVal === 'SNA' ? 'SNA' : parseInt(newSetVal, 10);
    next[index] = { ...next[index], set: val };
    setAssignments(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('⚠️ Student Name is required.');
      return;
    }
    if (!mobile.trim()) {
      setFormError('⚠️ Mobile Number is required.');
      return;
    }

    // Clean assignments
    const validAssignments = assignments.filter((a) => Boolean(a.shift && a.set));

    // Check duplicate shift in same student
    const seenShifts = new Set<string>();
    for (const a of validAssignments) {
      if (seenShifts.has(a.shift)) {
        setFormError('❌ The same shift cannot be assigned multiple times to one student.');
        return;
      }
      seenShifts.add(a.shift);

      // Check seat collision
      if (a.set !== 'SNA' && occupiedSlots.has(`${a.shift}|${a.set}`)) {
        setFormError(`❌ Set ${a.set} in that shift is already occupied by another student.`);
        return;
      }
    }

    // Compute primary seat number
    let seatNum: number | null = null;
    const numericSets = validAssignments
      .filter((a) => typeof a.set === 'number')
      .map((a) => a.set as number);
    if (numericSets.length) {
      seatNum = Math.min(...numericSets);
    }

    const newStudent: Student = {
      id: student ? student.id : 'S' + Date.now().toString().slice(-6),
      name: name.trim(),
      mobile: mobile.trim(),
      aadhar: aadhar.trim(),
      admissionDate: admissionDate || new Date().toISOString().slice(0, 10),
      avatar,
      feeStatus,
      assignments: validAssignments,
      seat: seatNum,
    };

    onSaveStudent(newStudent, Number(monthlyFee) || 600, feeStatus);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-200" />
            <div>
              <h3 className="text-base font-bold">
                {student ? 'Edit Student Details' : 'Add New Library Member'}
              </h3>
              <p className="text-xs text-indigo-200">
                Enroll student, assign library shifts and allocate seats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
              <span>{formError}</span>
              <button
                type="button"
                onClick={() => setFormError('')}
                className="text-rose-500 hover:text-rose-700 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                required
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Aadhar Number (Optional)
              </label>
              <input
                type="text"
                value={aadhar}
                onChange={(e) => setAadhar(e.target.value)}
                placeholder="XXXX XXXX XXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Admission Date
              </label>
              <input
                type="date"
                value={admissionDate}
                onChange={(e) => setAdmissionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Monthly Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(parseInt(e.target.value) || 0)}
                placeholder="600"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Initial Fee Status
              </label>
              <select
                value={feeStatus}
                onChange={(e) => setFeeStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-semibold capitalize"
              >
                <option value="due">Due / Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          {/* Photo Upload Area */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Student avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-slate-400" />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Profile Photo (Auto-compressed &lt;15KB)
              </span>
              <div className="flex flex-wrap gap-2">
                <label className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-semibold cursor-pointer text-slate-700 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose File</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>

                <label className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-semibold cursor-pointer text-slate-700 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Shifts & Sets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Armchair className="w-3.5 h-3.5 text-indigo-600" />
                <span>Assigned Shift(s) & Set(s)</span>
              </label>
              <button
                type="button"
                onClick={handleAddAssignmentRow}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Another Shift
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {assignments.map((assignment, idx) => {
                const shiftId = assignment.shift;

                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200"
                  >
                    {/* Shift Dropdown */}
                    <div className="flex-1 min-w-[140px]">
                      <select
                        value={assignment.shift}
                        onChange={(e) => handleAssignmentShiftChange(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs outline-hidden font-medium"
                      >
                        <option value="">Select shift</option>
                        {shifts.map((sh) => (
                          <option key={sh.id} value={sh.id}>
                            {sh.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Set Dropdown */}
                    <div className="flex-1 min-w-[150px]">
                      <select
                        value={assignment.set !== undefined ? String(assignment.set) : ''}
                        onChange={(e) => handleAssignmentSetChange(idx, e.target.value)}
                        disabled={!shiftId}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs outline-hidden font-medium disabled:opacity-50"
                      >
                        <option value="">Select Set / Seat</option>
                        <option value="SNA" className="text-purple-700 font-bold">
                          SNA (No Seat Allotted)
                        </option>
                        {Array.from({ length: totalSets }, (_, i) => i + 1).map((sNum) => {
                          const isOccupied = Boolean(shiftId && occupiedSlots.has(`${shiftId}|${sNum}`));
                          return (
                            <option key={sNum} value={String(sNum)} disabled={isOccupied}>
                              Set {sNum} {isOccupied ? '(Occupied)' : '(Available)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Remove button */}
                    {assignments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAssignmentRow(idx)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-200"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{student ? 'Save Changes' : 'Enroll Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
