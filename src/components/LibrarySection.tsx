import React from 'react';
import {
  Armchair,
  Layers,
  SlidersHorizontal,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Student, LibraryConfig } from '../types';

interface LibrarySectionProps {
  students: Student[];
  library: LibraryConfig;
  onOpenSetDetails: (title: string, subtitle: string, list: { student: Student; shift?: string }[]) => void;
  onCustomizeTotalSets: () => void;
}

export const LibrarySection: React.FC<LibrarySectionProps> = ({
  students,
  library,
  onOpenSetDetails,
  onCustomizeTotalSets,
}) => {
  const shifts = library.shifts || [];
  const totalSets = library.totalSets || 10;

  // Build occupancy maps
  // occ[shiftId][setNo] -> Student[]
  const occ: Record<string, Record<string | number, Student[]>> = {};
  shifts.forEach((sh) => {
    occ[sh.id] = { SNA: [] };
    for (let i = 1; i <= totalSets; i++) {
      occ[sh.id][i] = [];
    }
  });

  const setOverallCount: Record<string | number, number> = { SNA: 0 };
  for (let i = 1; i <= totalSets; i++) setOverallCount[i] = 0;

  students.forEach((st) => {
    (st.assignments || []).forEach((a) => {
      if (occ[a.shift]) {
        if (a.set === 'SNA') {
          occ[a.shift]['SNA'].push(st);
          setOverallCount['SNA']++;
        } else if (typeof a.set === 'number' && occ[a.shift][a.set]) {
          occ[a.shift][a.set].push(st);
          if (setOverallCount[a.set] !== undefined) {
            setOverallCount[a.set]++;
          }
        }
      }
    });
  });

  const handleSetClick = (shiftId: string, setNo: number | 'SNA') => {
    const shiftObj = shifts.find((s) => s.id === shiftId);
    const shiftLabel = shiftObj ? shiftObj.label : shiftId;
    const title = setNo === 'SNA' ? `Shift: ${shiftLabel} · SNA (No Set Allotted)` : `Shift: ${shiftLabel} · Set ${setNo}`;
    const assignedStudents = occ[shiftId]?.[setNo] || [];
    const subtitle = assignedStudents.length > 0
      ? `Total Occupants: ${assignedStudents.length} student(s)`
      : `Status: FREE (Available for assignment)`;

    onOpenSetDetails(
      title,
      subtitle,
      assignedStudents.map((s) => ({ student: s, shift: shiftId }))
    );
  };

  const handleAllShiftsSetClick = (setNo: number | 'SNA') => {
    const title = setNo === 'SNA' ? 'All Shifts · SNA (Set Not Allotted)' : `All Shifts · Set ${setNo} Allocations`;
    const entries: { student: Student; shift?: string }[] = [];

    students.forEach((st) => {
      (st.assignments || []).forEach((a) => {
        if (a.set === setNo) {
          entries.push({ student: st, shift: a.shift });
        }
      });
    });

    onOpenSetDetails(
      title,
      `Total Allocations: ${entries.length} assignment(s)`,
      entries
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Armchair className="w-5 h-5 text-indigo-600" />
            <span>Library Sets & Shift Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time visual seat allocation matrix across all library shifts.
          </p>
        </div>

        <button
          onClick={onCustomizeTotalSets}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors border border-indigo-200/60"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Customize Capacity ({totalSets} Sets)</span>
        </button>
      </div>

      {/* Main Set Matrix by Shift Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Set Availability by Shift</h3>
            <p className="text-[11px] text-slate-400">
              Click any numeric seat box to view student details or assign
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md border-2 border-emerald-500 bg-emerald-50/50"></span>
              <span className="text-slate-600 text-[11px]">Free</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-500"></span>
              <span className="text-slate-600 text-[11px]">Full (Occupied)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-600"></span>
              <span className="text-slate-600 text-[11px]">SNA (No Seat)</span>
            </span>
          </div>
        </div>

        {/* Matrix Rows */}
        <div className="space-y-3.5">
          {shifts.map((sh) => {
            return (
              <div
                key={sh.id}
                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">{sh.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Sets 1–{totalSets} + Floating
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {/* Numerical Sets 1..totalSets */}
                  {Array.from({ length: totalSets }, (_, i) => i + 1).map((sNum) => {
                    const assigned = occ[sh.id]?.[sNum] || [];
                    const isFull = assigned.length > 0;

                    return (
                      <button
                        key={sNum}
                        onClick={() => handleSetClick(sh.id, sNum)}
                        title={
                          isFull
                            ? `Occupied by: ${assigned.map((st) => st.name).join(', ')}`
                            : `Set ${sNum} is FREE`
                        }
                        className={`min-w-[34px] sm:min-w-[38px] h-9 px-1 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                          isFull
                            ? 'bg-rose-500 text-white shadow-rose-200 hover:bg-rose-600'
                            : 'bg-white text-emerald-700 border-2 border-emerald-500/80 hover:bg-emerald-50'
                        }`}
                      >
                        {sNum}
                      </button>
                    );
                  })}

                  {/* SNA Box */}
                  {(() => {
                    const snaAssigned = occ[sh.id]?.['SNA'] || [];
                    const hasSna = snaAssigned.length > 0;

                    return (
                      <button
                        onClick={() => handleSetClick(sh.id, 'SNA')}
                        title={
                          hasSna
                            ? `SNA Students: ${snaAssigned.map((st) => st.name).join(', ')}`
                            : 'No SNA students in this shift'
                        }
                        className={`min-w-[44px] h-9 px-2 rounded-xl text-[11px] font-black flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                          hasSna
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-white text-purple-700 border-2 border-purple-400/60 hover:bg-purple-50'
                        }`}
                      >
                        SNA {hasSna && `(${snaAssigned.length})`}
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5 italic">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Red = Seat Full • Green = Available • Purple = Floating member (SNA - Set Not Allotted).</span>
        </p>
      </div>

      {/* Side-by-side Shift Capacity & Sets Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Shift Capacity */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Shift Utilization</h3>
          </div>

          <div className="space-y-2.5">
            {shifts.map((sh) => {
              let shiftOccupied = 0;
              for (let i = 1; i <= totalSets; i++) {
                if (occ[sh.id]?.[i]?.length) shiftOccupied++;
              }
              const pct = Math.round((shiftOccupied * 100) / totalSets);

              return (
                <div key={sh.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span>{sh.label}</span>
                    <span className="font-mono text-slate-600">{pct}% Occupied</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1 mb-1.5">
                    <span>{shiftOccupied} of {totalSets} sets allotted</span>
                    <span>{totalSets - shiftOccupied} remaining</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 85 ? 'bg-rose-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sets Overview Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">Sets Overview</h3>
            </div>
            <span className="text-[11px] text-slate-400">Click set to inspect</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {/* SNA Card */}
            <div
              onClick={() => handleAllShiftsSetClick('SNA')}
              className="p-2.5 rounded-2xl border border-purple-200 bg-purple-50 hover:bg-purple-100 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-black">
                  SNA
                </span>
                <span className="text-xs font-black text-purple-900">
                  {setOverallCount['SNA'] || 0}
                </span>
              </div>
              <p className="text-[10px] text-purple-700 mt-1 font-semibold">Floating / No Set</p>
            </div>

            {/* Sets 1..N */}
            {Array.from({ length: totalSets }, (_, i) => i + 1).map((sNum) => {
              const cnt = setOverallCount[sNum] || 0;
              return (
                <div
                  key={sNum}
                  onClick={() => handleAllShiftsSetClick(sNum)}
                  className="p-2.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-indigo-50/70 hover:border-indigo-200 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">Set {sNum}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        cnt > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {cnt}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{cnt} assignment(s)</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
