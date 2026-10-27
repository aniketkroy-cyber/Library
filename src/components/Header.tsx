import React, { useState } from 'react';
import {
  QrCode,
  Search,
  Phone,
  LogOut,
  Building2,
  Sparkles,
  Lock,
  Crown,
} from 'lucide-react';
import { HeaderConfig } from '../types';
import type { User } from '../utils/firebase';
import { getSubscriptionTimeRemaining } from '../utils/initialData';

interface HeaderProps {
  header: HeaderConfig;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenPaymentQr: () => void;
  onNavigateToSettings: () => void;
  onLogout: () => void;
  onOpenAuth?: () => void;
  currentUser?: User | null;
  isFirebaseLive?: boolean;
  subscriptionExpiry?: string;
  onOpenSubscription?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  header,
  searchQuery,
  onSearchChange,
  onOpenPaymentQr,
  onNavigateToSettings,
  onLogout,
  onOpenAuth,
  currentUser,
  isFirebaseLive = false,
  subscriptionExpiry,
  onOpenSubscription,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const subStatus = getSubscriptionTimeRemaining(subscriptionExpiry);

  const initials = (header.userName || 'AU')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5">
        {/* Brand & Library Info */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={onNavigateToSettings}>
            {header.logoUrl ? (
              <img
                src={header.logoUrl}
                alt="Library Logo"
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl object-cover ring-2 ring-indigo-600/20 shadow-xs"
              />
            ) : (
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-indigo-200 tracking-tight">
                RB
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight line-clamp-1">
                {header.ownerName || 'ANIKET ROY LIBRARY'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles className="w-2.5 h-2.5" /> ReadBench
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <Phone className="w-3 h-3 text-emerald-600" /> {header.phone || '+918809474959'}
              </span>
              {header.address && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="hidden lg:inline text-slate-500 truncate max-w-xs">{header.address}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Global Search & Subscription Status & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search bar */}
          <div className="relative hidden md:block w-52 lg:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or phone..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl outline-hidden transition-all"
            />
          </div>

          {/* Subscription / Trial Status Badge Button */}
          {onOpenSubscription && (
            <button
              onClick={onOpenSubscription}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-102 active:scale-98 ${
                subStatus.isActive
                  ? subStatus.days === 0
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 animate-pulse'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
              }`}
              title={
                subStatus.isActive
                  ? `Plan Active: ${subStatus.formatted}`
                  : 'Plan Expired / Locked. Click to Unlock.'
              }
            >
              {subStatus.isActive ? (
                subStatus.days === 0 ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px]">🎁 Trial: {subStatus.formatted}</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[11px] font-semibold">{subStatus.formatted}</span>
                  </>
                )
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[11px] font-bold">🔒 Locked (Upgrade)</span>
                </>
              )}
            </button>
          )}

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 transition-colors"
            >
              {header.userAvatar ? (
                <img
                  src={header.userAvatar}
                  alt={header.userName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-800 font-bold text-xs flex items-center justify-center border border-indigo-300/40">
                  {initials}
                </div>
              )}
            </button>

            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setShowUserDropdown(false)}
              >
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{header.userName || 'Admin'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || header.email || 'library@readbench.xyz'}</p>
                  
                  {/* Firebase badge in dropdown */}
                  <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px]">
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span>Firebase Realtime DB:</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    </div>
                    <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-slate-500">
                      <span>डेटा आइसोलेशन:</span>
                      <span className="text-emerald-600 font-bold">100% प्राइवेट 🔒</span>
                    </div>
                    {currentUser?.uid && (
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5 truncate">
                        UID: {currentUser.uid}
                      </p>
                    )}
                  </div>

                  {header.upiId && (
                    <div className="mt-2 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-mono font-medium flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> {header.upiId}
                    </div>
                  )}
                </div>
                {onOpenSubscription && (
                  <button
                    onClick={onOpenSubscription}
                    className="w-full text-left px-3.5 py-2 text-xs text-indigo-700 hover:bg-indigo-50 flex items-center justify-between font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <Crown className="w-3.5 h-3.5 text-indigo-600" /> Subscription Plan
                    </span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                      {subStatus.isActive ? 'Active' : 'Locked'}
                    </span>
                  </button>
                )}
                {onOpenPaymentQr && (
                  <button
                    onClick={onOpenPaymentQr}
                    className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Library UPI QR
                  </button>
                )}
                <button
                  onClick={onNavigateToSettings}
                  className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Library Settings
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout / Switch Library
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden px-3 pb-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or phone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden"
          />
        </div>
      </div>
    </header>
  );
};
