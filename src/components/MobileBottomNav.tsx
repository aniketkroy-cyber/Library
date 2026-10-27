import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck2,
  BookOpenCheck,
  IndianRupee,
  Settings,
} from 'lucide-react';
import { NavSection } from './Sidebar';

interface MobileBottomNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  dueCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentSection,
  onSelectSection,
  dueCount = 0,
}) => {
  const tabs: { id: NavSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'students', label: 'Students', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck2 className="w-5 h-5" /> },
    { id: 'library', label: 'Library', icon: <BookOpenCheck className="w-5 h-5" /> },
    { id: 'fees', label: 'Fees', icon: <IndianRupee className="w-5 h-5" />, badge: dueCount },
    { id: 'settings', label: 'More', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-1 py-1.5 shadow-lg shadow-slate-900/10">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectSection(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl relative transition-all ${
                isActive
                  ? 'text-indigo-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black h-4 min-w-4 px-1 rounded-full flex items-center justify-center border-2 border-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
