import React, { useState } from 'react';
import {
  X,
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Users,
  Search,
} from 'lucide-react';
import { Student } from '../../types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  students,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>(() => {
    // Default all students present
    const init: Record<string, boolean> = {};
    students.forEach((s) => (init[s.id] = true));
    return init;
  });
  const [search, setSearch] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleStudent = (id: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const markAllPresent = () => {
    const updated: Record<string, boolean> = {};
    students.forEach((s) => (updated[s.id] = true));
    setAttendanceMap(updated);
  };

  const markAllAbsent = () => {
    const updated: Record<string, boolean> = {};
    students.forEach((s) => (updated[s.id] = false));
    setAttendanceMap(updated);
  };

  const presentCount = Object.values(attendanceMap).filter(Boolean).length;
  const totalStudents = students.length || 1;
  const attendanceRate = Math.round((presentCount * 100) / totalStudents);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-indigo-200" />
            <div>
              <h3 className="text-base font-bold">Daily Study Attendance</h3>
              <p className="text-xs text-indigo-200">
                Mark who is attending the library study hall today
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

        {/* Attendance Toolbar */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-hidden"
              />
              <span className="font-bold text-emerald-600">
                {attendanceRate}% Present ({presentCount}/{students.length})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={markAllPresent}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px]"
              >
                All Present
              </button>
              <button
                onClick={markAllAbsent}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px]"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-hidden text-xs"
            />
          </div>

          {/* Student attendance list */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
            {filteredStudents.map((s) => {
              const isPresent = attendanceMap[s.id] ?? true;

              return (
                <div
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isPresent
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {s.avatar ? (
                      <img
                        src={s.avatar}
                        alt={s.name}
                        className="w-8 h-8 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className={`font-bold text-xs ${isPresent ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                        {s.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {s.mobile || 'No Phone'} • Seat {s.seat ?? 'SNA'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                      isPresent
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPresent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{isPresent ? 'Present' : 'Absent'}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* External Attendance Portal link as in source */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <a
              href="https://readbench2.blogspot.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Open Online Attendance Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => {
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer active:scale-95"
            >
              Save Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
