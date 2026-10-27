import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  CalendarCheck2,
  BookOpenCheck,
  IndianRupee,
  Settings,
  Sparkles,
  CloudCheck,
  LogOut,
} from 'lucide-react';

export type NavSection = 'dashboard' | 'students' | 'attendance' | 'library' | 'fees' | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  dueCount?: number;
  onSignOut?: () => void;
  subscriptionExpiry?: string;
  onOpenSubscription?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  dueCount = 0,
  onSignOut,
  subscriptionExpiry,
  onOpenSubscription,
}) => {
  const navItems: { id: NavSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Students', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck2 className="w-4 h-4" /> },
    { id: 'library', label: 'Library & Sets', icon: <BookOpenCheck className="w-4 h-4" /> },
    { id: 'fees', label: 'Fees & Dues', icon: <IndianRupee className="w-4 h-4" />, badge: dueCount },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-60 lg:w-64 bg-white border-r border-slate-200 h-full shrink-0">
      {/* Brand logo in sidebar */}
      <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm tracking-tight shadow-sm shadow-indigo-200">
            RB
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-1">
              ReadBench
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Library ERP Suite</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge != null && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {onSignOut && (
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer mt-2"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>लॉग आउट (Log Out)</span>
          </button>
        )}
      </nav>

      {/* Subscription Status Card */}
      {onOpenSubscription && (
        <div className="p-3 m-3 rounded-2xl bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border border-indigo-100 text-xs shadow-2xs">
          <div className="flex items-center justify-between font-bold text-indigo-950 mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              सब्सक्रिप्शन स्टेटस
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mb-2.5">
            24 घंटे फ्री ट्रायल या एक्टिव प्लान के साथ सभी सुविधाएं अनलॉक रखें।
          </p>
          <button
            onClick={onOpenSubscription}
            className="w-full py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>प्लान देखें / अपग्रेड करें</span>
          </button>
        </div>
      )}
    </aside>
  );
};
