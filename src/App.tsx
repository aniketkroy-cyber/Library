/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppState, Student, StudentFee, HeaderConfig, LibraryConfig, Assignment } from './types';
import {
  loadStoredState,
  saveStoredState,
  clearUserStoredState,
  createBlankUserState,
  normalizeAppState,
  refreshFeesByAdmissionDate,
  defaultState,
} from './utils/initialData';

// Components
import { Header } from './components/Header';
import { Sidebar, NavSection } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Dashboard } from './components/Dashboard';
import { StudentsSection } from './components/StudentsSection';
import { LibrarySection } from './components/LibrarySection';
import { FeesSection } from './components/FeesSection';
import { SettingsSection } from './components/SettingsSection';

// Modals
import { PaymentMethodModal } from './components/modals/PaymentMethodModal';
import { StudentFormModal } from './components/modals/StudentFormModal';
import { InvoiceReceiptModal } from './components/modals/InvoiceReceiptModal';
import { WhatsAppTemplateModal } from './components/modals/WhatsAppTemplateModal';
import { InvoiceReminderModal } from './components/modals/InvoiceReminderModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { SetDetailsModal } from './components/modals/SetDetailsModal';
import { DailyRefreshModal } from './components/modals/DailyRefreshModal';
import { AttendanceModal } from './components/modals/AttendanceModal';
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal';
import { SubscriptionModal } from './components/modals/SubscriptionModal';
import {
  isSubscriptionActive,
  getSubscriptionTimeRemaining,
} from './utils/initialData';
import { Loader2, Lock, Sparkles, Crown, AlertCircle } from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import {
  auth,
  database,
  onAuthStateChanged,
  onValue,
  ref,
  signOut,
  syncStateToFirebase,
  type User,
} from './utils/firebase';

export default function App() {
  const [state, setState] = useState<AppState>(() => createBlankUserState('', ''));
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Firebase state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [demoUserActive, setDemoUserActive] = useState<boolean>(false);

  // Modals state
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [selectedStudentForInvoice, setSelectedStudentForInvoice] = useState<Student | null>(null);
  const [selectedStudentForWhatsApp, setSelectedStudentForWhatsApp] = useState<Student | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<Student | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    studentToRestore?: { student: Student; fee?: StudentFee };
  } | null>(null);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState<boolean>(false);
  const [isInvoiceReminderOpen, setIsInvoiceReminderOpen] = useState<boolean>(false);
  const [isDailyRefreshOpen, setIsDailyRefreshOpen] = useState<boolean>(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);

  // Subscription state checks
  const isAppLocked = !isSubscriptionActive(state.subscriptionExpiry);
  const subStatus = getSubscriptionTimeRemaining(state.subscriptionExpiry);

  // Subscription action guard: If locked after 24h trial, prompt user with subscription modal
  const requireSubscription = (action: () => void) => {
    if (isAppLocked) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    action();
  };

  const handleSubscriptionSuccess = (updatedState: AppState) => {
    setState(updatedState);
    if (currentUser) {
      saveStoredState(updatedState, currentUser.uid);
      syncStateToFirebase(currentUser.uid, updatedState);
    }
    setToastMessage({
      text: '🎉 सब्सक्रिप्शन सफलतापूर्वक एक्टिवेट हो गया है! सभी फीचर्स अनलॉक हो गए हैं।',
    });
  };

  // Set Details Modal
  const [setModalConfig, setSetModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    entries: { student: Student; shift?: string }[];
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    entries: [],
  });

  // Prevent echo loops between local state and Firebase Realtime Database
  const lastSyncedJsonRef = useRef<string>('');
  const lastReceivedJsonRef = useRef<string>('');
  const syncTimerRef = useRef<any>(null);

  // Directly sync state to Firebase Realtime Database whenever local state changes
  useEffect(() => {
    if (currentUser) {
      saveStoredState(state, currentUser.uid);

      const currentJson = JSON.stringify(state);

      // If state matches what Firebase remote just provided, do not echo it back
      if (currentJson === lastReceivedJsonRef.current) {
        return;
      }

      // If state matches what we already sent to Firebase, do not send again
      if (currentJson === lastSyncedJsonRef.current) {
        return;
      }

      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        lastSyncedJsonRef.current = currentJson;
        syncStateToFirebase(currentUser.uid, state);
      }, 400);
    } else if (demoUserActive) {
      saveStoredState(state, 'guest');
    }

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [state, currentUser, demoUserActive]);

  // Firebase Auth & Realtime Database sync listener strictly keyed by user.uid
  useEffect(() => {
    let unsubscribeDatabase: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsFirebaseLive(Boolean(user));
      setIsAuthChecking(false);

      if (unsubscribeDatabase) {
        unsubscribeDatabase();
        unsubscribeDatabase = null;
      }

      if (user) {
        // Load local offline cache for this user immediately if present
        const userCache = loadStoredState(user.uid);
        if (userCache) {
          const cachedNormalized = normalizeAppState(userCache, user.displayName || 'ANIKET ROY LIBRARY', user.email || '');
          lastSyncedJsonRef.current = JSON.stringify(cachedNormalized);
          setState(cachedNormalized);
        }

        // Direct realtime listener for user's isolated library branch in Firebase RTDB
        const libRef = ref(database, `libraries/${user.uid}`);
        unsubscribeDatabase = onValue(libRef, (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.val();
            if (remoteData) {
              const cleanState = normalizeAppState(
                remoteData,
                user.displayName || 'ANIKET ROY LIBRARY',
                user.email || ''
              );
              const cleanJson = JSON.stringify(cleanState);

              // Ignore if already identical to our last sent or last received state
              if (cleanJson === lastSyncedJsonRef.current || cleanJson === lastReceivedJsonRef.current) {
                return;
              }

              lastReceivedJsonRef.current = cleanJson;
              setState(cleanState);
              saveStoredState(cleanState, user.uid);
            }
          } else {
            // Automatically initialize user's library branch directly in Firebase RTDB
            // with a completely isolated, clean library for this specific user UID
            const freshUserLibrary = createBlankUserState(
              user.displayName || 'ANIKET ROY LIBRARY',
              user.email || '',
              user.phoneNumber || '+918809474959'
            );
            const freshJson = JSON.stringify(freshUserLibrary);
            lastSyncedJsonRef.current = freshJson;
            lastReceivedJsonRef.current = freshJson;
            setState(freshUserLibrary);
            syncStateToFirebase(user.uid, freshUserLibrary);
            saveStoredState(freshUserLibrary, user.uid);
          }
        });
      } else {
        // User is not authenticated; if not in demo mode, ensure state is reset
        if (!demoUserActive) {
          setState(createBlankUserState('', ''));
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDatabase) unsubscribeDatabase();
    };
  }, [demoUserActive]);

  // Check Daily Admission Date Refresh on Mount once per day
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastCheckKey = 'readbench_last_daily_popup';
    const lastCheck = localStorage.getItem(lastCheckKey);

    if (lastCheck !== todayStr) {
      // Show daily refresh modal
      setIsDailyRefreshOpen(true);
      localStorage.setItem(lastCheckKey, todayStr);
    }
  }, []);

  const showToast = (text: string, studentToRestore?: { student: Student; fee?: StudentFee }) => {
    setToastMessage({ text, studentToRestore });
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text === text ? null : cur));
    }, 4500);
  };

  // Handlers
  const handleDailyFeeRefresh = () => {
    const { updatedFees, hasChanges, affectedCount } = refreshFeesByAdmissionDate(
      safeStudents,
      safeFees
    );

    if (hasChanges) {
      setState((prev) => ({
        ...prev,
        fees: updatedFees,
      }));
      showToast(`✅ Fee cycle refreshed! Updated ${affectedCount} student(s) based on their admission date.`);
    } else {
      showToast('ℹ️ All student fee cycles are up-to-date for today.');
    }
  };

  // Confirming a payment (Cash or UPI)
  const handleConfirmPayment = (student: Student, amount: number, method: 'cash' | 'upi') => {
    const today = new Date();
    const yearStr = today.getFullYear().toString();
    const monthIdx = today.getMonth();
    const dateStr = today.toISOString().slice(0, 10);
    const timeStr = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const currentFee = safeFees[student.id] || {
      status: 'due',
      amount: 0,
      monthlyFee: 600,
      months: {},
      paymentHistory: [],
    };

    const newPaidAmount = (currentFee.amount || 0) + amount;
    const isPaidInFull = newPaidAmount >= (currentFee.monthlyFee || 600);
    const newStatus: 'paid' | 'partial' | 'due' = isPaidInFull ? 'paid' : newPaidAmount > 0 ? 'partial' : 'due';

    const newPaymentRecord = {
      id: 'P' + Date.now().toString().slice(-6),
      date: dateStr,
      amount,
      method,
      time: timeStr,
      receiptNo: `REC-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${student.id.slice(-4)}`,
    };

    const monthKey = dateStr.slice(0, 7);
    const updatedMonths = {
      ...(currentFee.months || {}),
      [monthKey]: newStatus,
    };

    // Update monthly collection record
    const updatedYearCollections = { ...safeMonthly };
    if (!updatedYearCollections[yearStr]) {
      updatedYearCollections[yearStr] = Array(12).fill(0);
    }
    const yearArr = [...updatedYearCollections[yearStr]];
    yearArr[monthIdx] = (yearArr[monthIdx] || 0) + amount;
    updatedYearCollections[yearStr] = yearArr;

    setState((prev) => ({
      ...prev,
      fees: {
        ...(prev?.fees || {}),
        [student.id]: {
          ...currentFee,
          status: newStatus,
          amount: newPaidAmount,
          lastPaid: dateStr,
          lastPaymentMethod: method,
          months: updatedMonths,
          paymentHistory: [newPaymentRecord, ...(currentFee.paymentHistory || [])],
        },
      },
      monthlyCollectionByYear: updatedYearCollections,
    }));
  };

  // Save / Add Student
  const handleSaveStudent = (
    savedStudent: Student,
    monthlyFee: number,
    initialStatus: 'paid' | 'partial' | 'due'
  ) => {
    setState((prev) => {
      const currentStudents = Array.isArray(prev?.students) ? prev.students : [];
      const currentFees = prev?.fees && typeof prev.fees === 'object' ? prev.fees : {};
      const existingIdx = currentStudents.findIndex((s) => s.id === savedStudent.id);
      let newStudents: Student[];
      if (existingIdx >= 0) {
        newStudents = [...currentStudents];
        newStudents[existingIdx] = savedStudent;
      } else {
        newStudents = [savedStudent, ...currentStudents];
      }

      const existingFee = currentFees[savedStudent.id] || {
        status: initialStatus,
        amount: initialStatus === 'paid' ? monthlyFee : 0,
        monthlyFee,
        months: {},
        paymentHistory: [],
      };

      const updatedFees = {
        ...currentFees,
        [savedStudent.id]: {
          ...existingFee,
          monthlyFee,
          status: existingIdx >= 0 ? existingFee.status : initialStatus,
        },
      };

      return {
        ...prev,
        students: newStudents,
        fees: updatedFees,
      };
    });
  };

  // Delete Student - Opens custom in-app confirmation modal (no window.confirm iframe blocking)
  const handleDeleteStudent = (student: Student) => {
    setSelectedStudentForDelete(student);
  };

  const handleConfirmDeleteStudent = (student: Student) => {
    const studentFee = safeFees[student.id];
    setState((prev) => {
      const currentStudents = Array.isArray(prev?.students) ? prev.students : [];
      const currentFees = prev?.fees && typeof prev.fees === 'object' ? prev.fees : {};
      const remainingStudents = currentStudents.filter((s) => s.id !== student.id);
      const { [student.id]: _, ...remainingFees } = currentFees;
      return {
        ...prev,
        students: remainingStudents,
        fees: remainingFees,
      };
    });

    // Show undo toast notification
    setToastMessage({
      text: `Member "${student.name}" was removed.`,
      studentToRestore: { student, fee: studentFee },
    });

    // Auto-dismiss toast after 6 seconds
    setTimeout(() => {
      setToastMessage((cur) => (cur?.text.includes(student.name) ? null : cur));
    }, 6000);
  };

  const handleRestoreDeletedStudent = (saved: { student: Student; fee?: StudentFee }) => {
    setState((prev) => {
      const currentStudents = Array.isArray(prev?.students) ? prev.students : [];
      const currentFees = prev?.fees && typeof prev.fees === 'object' ? prev.fees : {};
      return {
        ...prev,
        students: [saved.student, ...currentStudents],
        fees: saved.fee ? { ...currentFees, [saved.student.id]: saved.fee } : currentFees,
      };
    });
    setToastMessage(null);
  };

  // Header / Branding Save
  const handleSaveHeader = (newHeader: HeaderConfig) => {
    setState((prev) => ({
      ...prev,
      header: newHeader,
    }));
  };

  // Save Shifts from Textarea
  const handleSaveShifts = (shiftsText: string) => {
    const lines = shiftsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      showToast('⚠️ At least one shift line must be provided.');
      return;
    }

    const newShifts = lines.map((label, i) => ({
      id: `shift-${i + 1}`,
      label,
      capacity: state.library.totalSets,
    }));

    setState((prev) => ({
      ...prev,
      library: {
        ...prev.library,
        shifts: newShifts,
      },
    }));
    showToast('✅ Shifts updated successfully.');
  };

  // Customize Total Sets
  const handleSaveTotalSets = (newTotal: number) => {
    if (newTotal < 1 || newTotal > 250) {
      showToast('⚠️ Total sets must be between 1 and 250.');
      return;
    }
    setState((prev) => ({
      ...prev,
      library: {
        ...prev.library,
        totalSets: newTotal,
      },
    }));
  };

  // Prompt for set customization from Library screen
  const handlePromptTotalSets = () => {
    const current = state.library.totalSets || 12;
    const presets = [10, 12, 15, 20, 25, 30, 40, 50, 75, 100];
    const next = presets.find((p) => p > current) || 12;
    handleSaveTotalSets(next);
    showToast(`✅ Library seat capacity set to ${next} seats (Customize anytime in Settings).`);
  };

  const handleSignOut = async () => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    const prevUid = currentUser?.uid;
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    if (prevUid) {
      clearUserStoredState(prevUid);
    }
    setCurrentUser(null);
    setDemoUserActive(false);
    setIsFirebaseLive(false);
    setState(createBlankUserState('', ''));
    setCurrentSection('dashboard');
  };

  // Safe resolved values to prevent undefined access during initial load or empty sync
  const safeStudents = Array.isArray(state?.students) ? state.students : [];
  const safeFees = state?.fees && typeof state.fees === 'object' ? state.fees : {};
  const safeLibrary = state?.library || defaultState.library;
  const safeHeader = state?.header || defaultState.header;
  const safeMonthly = state?.monthlyCollectionByYear || defaultState.monthlyCollectionByYear;

  // Compute pending dues count for badges safely
  const pendingDueCount = safeStudents.filter((s) => {
    const f = safeFees[s?.id] || { status: 'due' };
    return f.status === 'due' || f.status === 'partial';
  }).length;

  // 1. Loading screen while Firebase verifies active session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl mb-4 animate-pulse shadow-lg shadow-indigo-500/30">
          RB
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Firebase से कनेक्ट हो रहा है...</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 font-mono">student-management-syste-205c4</p>
      </div>
    );
  }

  // 2. Mandatory Auth Gate: Unauthenticated users MUST sign in or create account to enter
  if (!currentUser && !demoUserActive) {
    return (
      <AuthScreen
        onLoginSuccess={(libraryData, isDemo) => {
          if (isDemo) {
            setDemoUserActive(true);
            const demoState = loadStoredState('guest');
            setState(demoState);
          } else if (libraryData) {
            const normalized = normalizeAppState(libraryData);
            const normJson = JSON.stringify(normalized);
            lastSyncedJsonRef.current = normJson;
            lastReceivedJsonRef.current = normJson;
            setState(normalized);
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* 1. Desktop Left Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => {
          if (sec === 'attendance') {
            requireSubscription(() => setIsAttendanceOpen(true));
          } else {
            setCurrentSection(sec);
          }
        }}
        dueCount={pendingDueCount}
        onSignOut={handleSignOut}
        subscriptionExpiry={state.subscriptionExpiry}
        onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          header={safeHeader}
          searchQuery={globalSearch}
          onSearchChange={(q) => {
            setGlobalSearch(q);
            if (q.trim() && currentSection !== 'students') {
              setCurrentSection('students');
            }
          }}
          onOpenPaymentQr={() => {
            requireSubscription(() => {
              const target = safeStudents.find((s) => (safeFees[s.id]?.status || 'due') !== 'paid') || safeStudents[0];
              if (target) {
                setSelectedStudentForPayment(target);
              } else {
                showToast('Please add a student to collect payment.');
              }
            });
          }}
          onNavigateToSettings={() => setCurrentSection('settings')}
          onLogout={handleSignOut}
          currentUser={currentUser}
          isFirebaseLive={isFirebaseLive}
          subscriptionExpiry={state.subscriptionExpiry}
          onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
        />

        {/* Dynamic Subscription / Free Trial Alert Banner */}
        {isAppLocked ? (
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 text-white px-3 sm:px-6 py-2 text-xs flex items-center justify-between shadow-xs border-b border-red-700">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-200 flex-shrink-0 animate-bounce" />
              <span className="font-bold">24 घंटे का फ्री ट्रायल समाप्त हो चुका है — कार्यक्षमता लॉक है</span>
              <span className="hidden md:inline text-rose-100 text-[11px]">
                | छात्र जोड़ना, फीस व रसीद सेव करने के लिए कृपया प्लान चुनें।
              </span>
            </div>
            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="px-3 py-1 bg-white hover:bg-rose-50 text-red-700 font-extrabold rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>प्लान चुनें व अनलॉक करें (₹99 से शुरू) →</span>
            </button>
          </div>
        ) : subStatus.days === 0 ? (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white px-3 sm:px-6 py-1.5 text-xs flex items-center justify-between shadow-2xs border-b border-amber-600">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 flex-shrink-0" />
              <span className="font-bold">🎁 24 घंटे का फ्री ट्रायल सक्रिय है</span>
              <span className="text-amber-100 text-[11px]">({subStatus.formatted}) — सभी सुविधाएं पूरी तरह मुफ्त हैं।</span>
            </div>
            <button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="px-2.5 py-0.5 bg-black/20 hover:bg-black/30 text-white rounded-md font-semibold text-[11px] transition-colors cursor-pointer"
            >
              प्लान देखें →
            </button>
          </div>
        ) : null}

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 pb-24 md:pb-6">
          {currentSection === 'dashboard' && (
            <Dashboard
              students={safeStudents}
              fees={safeFees}
              library={safeLibrary}
              monthlyCollectionByYear={safeMonthly}
              onNavigateToStudents={() => setCurrentSection('students')}
              onNavigateToFees={() => setCurrentSection('fees')}
              onNavigateToLibrary={() => setCurrentSection('library')}
              onOpenNewStudentModal={() => {
                requireSubscription(() => {
                  setSelectedStudentForEdit(null);
                  setIsStudentFormOpen(true);
                });
              }}
              onOpenQuickPayment={() => {
                requireSubscription(() => {
                  const target = safeStudents[0];
                  if (target) setSelectedStudentForPayment(target);
                });
              }}
              onTriggerDailyRefresh={() => requireSubscription(() => setIsDailyRefreshOpen(true))}
            />
          )}

          {currentSection === 'students' && (
            <StudentsSection
              students={safeStudents}
              fees={safeFees}
              library={safeLibrary}
              globalSearch={globalSearch}
              onOpenNewStudentModal={() => {
                requireSubscription(() => {
                  setSelectedStudentForEdit(null);
                  setIsStudentFormOpen(true);
                });
              }}
              onOpenEditStudentModal={(s) => {
                requireSubscription(() => {
                  setSelectedStudentForEdit(s);
                  setIsStudentFormOpen(true);
                });
              }}
              onDeleteStudent={(s) => requireSubscription(() => handleDeleteStudent(s))}
              onOpenPaymentModal={(s) => requireSubscription(() => setSelectedStudentForPayment(s))}
              onOpenInvoiceModal={(s) => setSelectedStudentForInvoice(s)}
              onOpenWhatsAppModal={(s) => requireSubscription(() => setSelectedStudentForWhatsApp(s))}
              onOpenProfileModal={(s) => setSelectedStudentForProfile(s)}
            />
          )}

          {currentSection === 'library' && (
            <LibrarySection
              students={safeStudents}
              library={safeLibrary}
              onOpenSetDetails={(title, subtitle, entries) => {
                setSetModalConfig({
                  isOpen: true,
                  title,
                  subtitle,
                  entries,
                });
              }}
              onCustomizeTotalSets={() => requireSubscription(handlePromptTotalSets)}
            />
          )}

          {currentSection === 'fees' && (
            <FeesSection
              students={safeStudents}
              fees={safeFees}
              onTriggerDailyRefresh={() => requireSubscription(handleDailyFeeRefresh)}
              onOpenInvoiceReminderModal={() => requireSubscription(() => setIsInvoiceReminderOpen(true))}
              onOpenPaymentModal={(s) => requireSubscription(() => setSelectedStudentForPayment(s))}
              onOpenInvoiceModal={(s) => setSelectedStudentForInvoice(s)}
            />
          )}

          {currentSection === 'settings' && (
            <SettingsSection
              header={safeHeader}
              library={safeLibrary}
              fullState={state}
              onSaveHeader={(h) => requireSubscription(() => handleSaveHeader(h))}
              onSaveShifts={(s) => requireSubscription(() => handleSaveShifts(s))}
              onSaveTotalSets={(t) => requireSubscription(() => handleSaveTotalSets(t))}
              onImportBackup={(imported) => requireSubscription(() => setState(normalizeAppState(imported)))}
              currentUser={currentUser}
              onSignOut={handleSignOut}
            />
          )}
        </main>

        {/* 3. Mobile Bottom Navigation */}
        <MobileBottomNav
          currentSection={currentSection}
          onSelectSection={(sec) => {
            if (sec === 'attendance') {
              requireSubscription(() => setIsAttendanceOpen(true));
            } else {
              setCurrentSection(sec);
            }
          }}
          dueCount={pendingDueCount}
        />
      </div>

      {/* ================= MODALS ================= */}

      {/* Subscription & Pricing Modal (Razorpay + UPI) */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        state={state}
        onSubscriptionSuccess={handleSubscriptionSuccess}
        isEnforced={isAppLocked}
      />

      {/* Payment Modal (Dynamic UPI QR & Cash) */}
      <PaymentMethodModal
        isOpen={Boolean(selectedStudentForPayment)}
        onClose={() => setSelectedStudentForPayment(null)}
        student={selectedStudentForPayment}
        feeData={selectedStudentForPayment ? safeFees[selectedStudentForPayment.id] || null : null}
        ownerUpiId={safeHeader.upiId}
        ownerLibraryName={safeHeader.ownerName}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Add / Edit Student Form */}
      <StudentFormModal
        isOpen={isStudentFormOpen}
        onClose={() => {
          setIsStudentFormOpen(false);
          setSelectedStudentForEdit(null);
        }}
        student={selectedStudentForEdit}
        existingStudents={safeStudents}
        library={safeLibrary}
        fees={safeFees}
        onSaveStudent={handleSaveStudent}
      />

      {/* Invoice Receipt Modal (Single Member) */}
      <InvoiceReceiptModal
        isOpen={Boolean(selectedStudentForInvoice)}
        onClose={() => setSelectedStudentForInvoice(null)}
        student={selectedStudentForInvoice}
        feeData={selectedStudentForInvoice ? safeFees[selectedStudentForInvoice.id] || null : null}
        header={safeHeader}
      />

      {/* WhatsApp Message Template Sender */}
      <WhatsAppTemplateModal
        isOpen={Boolean(selectedStudentForWhatsApp)}
        onClose={() => setSelectedStudentForWhatsApp(null)}
        student={selectedStudentForWhatsApp}
        feeData={selectedStudentForWhatsApp ? safeFees[selectedStudentForWhatsApp.id] || null : null}
        header={safeHeader}
      />

      {/* Bulk Fee Invoice Reminders List Modal */}
      <InvoiceReminderModal
        isOpen={isInvoiceReminderOpen}
        onClose={() => setIsInvoiceReminderOpen(false)}
        students={safeStudents}
        fees={safeFees}
        header={safeHeader}
      />

      {/* Student Profile & 12-Month Card Modal */}
      <ProfileModal
        isOpen={Boolean(selectedStudentForProfile)}
        onClose={() => setSelectedStudentForProfile(null)}
        student={selectedStudentForProfile}
        feeData={selectedStudentForProfile ? safeFees[selectedStudentForProfile.id] || null : null}
        library={safeLibrary}
        header={safeHeader}
      />

      {/* Set Details Modal (Shift & Seat Inspector) */}
      <SetDetailsModal
        isOpen={setModalConfig.isOpen}
        onClose={() => setSetModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={setModalConfig.title}
        subtitle={setModalConfig.subtitle}
        entries={setModalConfig.entries}
        onSelectStudent={(st) => setSelectedStudentForProfile(st)}
      />

      {/* Daily Fee Refresh Prompt */}
      <DailyRefreshModal
        isOpen={isDailyRefreshOpen}
        onClose={() => setIsDailyRefreshOpen(false)}
        onConfirmRefresh={handleDailyFeeRefresh}
      />

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
        students={safeStudents}
      />

      {/* Delete Confirmation Modal (Reliable in iframes, no window.confirm) */}
      <DeleteConfirmModal
        isOpen={Boolean(selectedStudentForDelete)}
        onClose={() => setSelectedStudentForDelete(null)}
        student={selectedStudentForDelete}
        onConfirmDelete={handleConfirmDeleteStudent}
      />

      {/* Non-blocking Action Toast with Undo */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200 text-xs">
          <span className="font-medium">{toastMessage.text}</span>
          {toastMessage.studentToRestore && (
            <button
              onClick={() => handleRestoreDeletedStudent(toastMessage.studentToRestore!)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-[11px] transition-colors shadow-2xs"
            >
              Undo
            </button>
          )}
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-1 p-0.5"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
