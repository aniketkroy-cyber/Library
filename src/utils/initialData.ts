import { AppState, Student, StudentFee, SubscriptionPlan, SubscriptionHistoryItem } from '../types';

const defaultShifts = [
  { id: 'shift-1', label: '6AM-10AM', capacity: 10 },
  { id: 'shift-2', label: '10AM-2PM', capacity: 10 },
  { id: 'shift-3', label: '2PM-6PM', capacity: 10 },
  { id: 'shift-4', label: '6PM-10PM', capacity: 10 },
];

export const initialStudents: Student[] = [
  {
    id: 'S101',
    name: 'Rahul Sharma',
    mobile: '9876543210',
    aadhar: '4532 8901 2341',
    admissionDate: '2026-09-12',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80',
    feeStatus: 'paid',
    assignments: [
      { shift: 'shift-1', set: 1 },
      { shift: 'shift-2', set: 1 },
    ],
    seat: 1,
  },
  {
    id: 'S102',
    name: 'Priya Verma',
    mobile: '9811223344',
    aadhar: '7890 1234 5678',
    admissionDate: '2026-09-15',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    feeStatus: 'partial',
    assignments: [{ shift: 'shift-1', set: 2 }],
    seat: 2,
  },
  {
    id: 'S103',
    name: 'Aman Kumar Gupta',
    mobile: '8877665544',
    aadhar: '3344 5566 7788',
    admissionDate: '2026-10-01',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    feeStatus: 'due',
    assignments: [{ shift: 'shift-2', set: 3 }],
    seat: 3,
  },
  {
    id: 'S104',
    name: 'Sneha Kumari',
    mobile: '9123456780',
    aadhar: '9988 7766 5544',
    admissionDate: '2026-08-20',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    feeStatus: 'paid',
    assignments: [
      { shift: 'shift-3', set: 4 },
      { shift: 'shift-4', set: 4 },
    ],
    seat: 4,
  },
  {
    id: 'S105',
    name: 'Vikram Singh',
    mobile: '9988001122',
    aadhar: '1212 3434 5656',
    admissionDate: '2026-09-05',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    feeStatus: 'paid',
    assignments: [{ shift: 'shift-1', set: 5 }],
    seat: 5,
  },
  {
    id: 'S106',
    name: 'Anjali Rajput',
    mobile: '9765432109',
    aadhar: '6677 8899 0011',
    admissionDate: '2026-09-28',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    feeStatus: 'due',
    assignments: [{ shift: 'shift-4', set: 'SNA' }],
    seat: null,
  },
  {
    id: 'S107',
    name: 'Manish Tiwari',
    mobile: '9345678901',
    aadhar: '4455 6677 8899',
    admissionDate: '2026-09-10',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    feeStatus: 'partial',
    assignments: [{ shift: 'shift-2', set: 2 }],
    seat: 2,
  },
  {
    id: 'S108',
    name: 'Divya Prakash',
    mobile: '8899001122',
    aadhar: '2233 4455 6677',
    admissionDate: '2026-08-14',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    feeStatus: 'paid',
    assignments: [{ shift: 'shift-3', set: 3 }],
    seat: 3,
  },
];

export const initialFees: Record<string, StudentFee> = {
  S101: {
    status: 'paid',
    amount: 600,
    monthlyFee: 600,
    lastPaid: '2026-10-12',
    lastPaymentMethod: 'upi',
    months: {
      '2026-08': 'paid',
      '2026-09': 'paid',
      '2026-10': 'paid',
    },
    paymentHistory: [
      { id: 'p1', date: '2026-10-12', amount: 600, method: 'upi', time: '11:30 AM', receiptNo: 'REC-20261012-101' },
    ],
  },
  S102: {
    status: 'partial',
    amount: 300,
    monthlyFee: 600,
    lastPaid: '2026-10-14',
    lastPaymentMethod: 'cash',
    months: {
      '2026-09': 'paid',
      '2026-10': 'partial',
    },
    paymentHistory: [
      { id: 'p2', date: '2026-10-14', amount: 300, method: 'cash', time: '04:15 PM', receiptNo: 'REC-20261014-102' },
    ],
  },
  S103: {
    status: 'due',
    amount: 0,
    monthlyFee: 600,
    lastPaid: '',
    lastPaymentMethod: '-',
    months: {
      '2026-10': 'due',
    },
    paymentHistory: [],
  },
  S104: {
    status: 'paid',
    amount: 800,
    monthlyFee: 800,
    lastPaid: '2026-10-18',
    lastPaymentMethod: 'upi',
    months: {
      '2026-08': 'paid',
      '2026-09': 'paid',
      '2026-10': 'paid',
    },
    paymentHistory: [
      { id: 'p3', date: '2026-10-18', amount: 800, method: 'upi', time: '09:00 AM', receiptNo: 'REC-20261018-104' },
    ],
  },
  S105: {
    status: 'paid',
    amount: 600,
    monthlyFee: 600,
    lastPaid: '2026-10-05',
    lastPaymentMethod: 'cash',
    months: {
      '2026-09': 'paid',
      '2026-10': 'paid',
    },
    paymentHistory: [
      { id: 'p4', date: '2026-10-05', amount: 600, method: 'cash', time: '02:30 PM', receiptNo: 'REC-20261005-105' },
    ],
  },
  S106: {
    status: 'due',
    amount: 0,
    monthlyFee: 500,
    lastPaid: '',
    lastPaymentMethod: '-',
    months: {
      '2026-10': 'due',
    },
    paymentHistory: [],
  },
  S107: {
    status: 'partial',
    amount: 250,
    monthlyFee: 600,
    lastPaid: '2026-10-10',
    lastPaymentMethod: 'cash',
    months: {
      '2026-09': 'paid',
      '2026-10': 'partial',
    },
    paymentHistory: [
      { id: 'p5', date: '2026-10-10', amount: 250, method: 'cash', time: '05:40 PM', receiptNo: 'REC-20261010-107' },
    ],
  },
  S108: {
    status: 'paid',
    amount: 600,
    monthlyFee: 600,
    lastPaid: '2026-10-15',
    lastPaymentMethod: 'upi',
    months: {
      '2026-08': 'paid',
      '2026-09': 'paid',
      '2026-10': 'paid',
    },
    paymentHistory: [
      { id: 'p6', date: '2026-10-15', amount: 600, method: 'upi', time: '10:15 AM', receiptNo: 'REC-20261015-108' },
    ],
  },
};

export const defaultMonthlyCollectionByYear: Record<string, number[]> = {
  '2026': [14200, 16800, 18500, 19200, 21000, 22400, 23900, 24500, 25800, 27400, 0, 0],
  '2025': [10000, 11500, 12800, 14000, 15200, 16000, 17500, 18200, 19000, 20500, 21200, 22800],
};

export const defaultState: AppState = {
  students: initialStudents,
  fees: initialFees,
  library: {
    totalSets: 10,
    shifts: defaultShifts,
  },
  monthlyCollectionByYear: defaultMonthlyCollectionByYear,
  header: {
    ownerName: 'ANIKET ROY LIBRARY',
    logoUrl: '',
    userName: 'Aniket Roy (Owner)',
    userAvatar: '',
    qrCodeUrl: '',
    address: 'Near Gandhi Chowk, Station Road, Patna - 800001',
    phone: '+918809474959',
    email: 'aniketkrooy@gmail.com',
    upiId: '8809474959@paytm',
  },
  subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const STORAGE_KEY_PREFIX = 'readbench_user_';

/**
 * Creates a brand new, pristine, isolated library state for a specific user.
 * Starts with 0 students and 0 fees, ensuring no cross-account data leakage.
 */
export function createBlankUserState(
  ownerName: string,
  email: string,
  phone: string = '+918809474959',
  upiId: string = ''
): AppState {
  const currentYear = new Date().getFullYear().toString();
  return {
    students: [],
    fees: {},
    library: {
      totalSets: 12,
      shifts: [
        { id: 'shift-1', label: '6AM-10AM', capacity: 12 },
        { id: 'shift-2', label: '10AM-2PM', capacity: 12 },
        { id: 'shift-3', label: '2PM-6PM', capacity: 12 },
        { id: 'shift-4', label: '6PM-10PM', capacity: 12 },
      ],
    },
    monthlyCollectionByYear: {
      [currentYear]: Array(12).fill(0),
    },
    header: {
      ownerName: ownerName.trim() || 'My Study Library',
      logoUrl: '',
      userName: ownerName.trim() || 'Library Admin',
      userAvatar: '',
      qrCodeUrl: '',
      address: '',
      phone: phone || '',
      email: email || '',
      upiId: upiId || '',
    },
    // 24-Hours Free Trial for new registrations
    subscriptionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    subscriptionPlan: 'trial_24h',
    subscriptionHistory: [],
  };
}

export const RAZORPAY_KEY_ID = 'rzp_live_STi2dRevdvmOE5';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '1month',
    name: '1 Month Plan',
    hindiName: '1 महीना प्लान',
    durationMonths: 1,
    durationDays: 30,
    price: 99,
    savings: '₹99 / महीना',
  },
  {
    id: '3months',
    name: '3 Months Plan',
    hindiName: '3 महीने प्लान',
    durationMonths: 3,
    durationDays: 90,
    price: 250,
    savings: '₹83 / माह (16% बचत)',
    popular: true,
  },
  {
    id: '6months',
    name: '6 Months Plan',
    hindiName: '6 महीने प्लान',
    durationMonths: 6,
    durationDays: 180,
    price: 400,
    savings: '₹66 / माह (33% बचत)',
  },
  {
    id: '1year',
    name: '1 Year Plan',
    hindiName: '1 वर्ष (12 माह) प्लान',
    durationMonths: 12,
    durationDays: 365,
    price: 700,
    badge: 'BEST VALUE 🔥',
    savings: '₹58 / माह (41% महाबचत)',
  },
];

export function isSubscriptionActive(subscriptionExpiry?: string): boolean {
  if (!subscriptionExpiry) return false;
  const expiry = new Date(subscriptionExpiry).getTime();
  return !isNaN(expiry) && expiry > Date.now();
}

export function getSubscriptionTimeRemaining(subscriptionExpiry?: string): {
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  if (!subscriptionExpiry) {
    return { isActive: false, isTrial: false, isExpired: true, days: 0, hours: 0, minutes: 0, formatted: 'Expired' };
  }
  const expiry = new Date(subscriptionExpiry).getTime();
  if (isNaN(expiry)) {
    return { isActive: false, isTrial: false, isExpired: true, days: 0, hours: 0, minutes: 0, formatted: 'Expired' };
  }
  const diff = expiry - Date.now();
  if (diff <= 0) {
    return { isActive: false, isTrial: false, isExpired: true, days: 0, hours: 0, minutes: 0, formatted: 'Locked / Expired' };
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 1000)) / (60 * 1000));

  let formatted = '';
  if (days > 0) {
    formatted = `${days} दिन ${hours} घंटे शेष`;
  } else if (hours > 0) {
    formatted = `${hours} घंटे ${minutes} मिनट शेष`;
  } else {
    formatted = `${minutes} मिनट शेष`;
  }

  return {
    isActive: true,
    isTrial: days === 0,
    isExpired: false,
    days,
    hours,
    minutes,
    formatted,
  };
}

/**
 * Normalizes any raw state (from Firebase RTDB or localStorage) into a complete, safe AppState.
 * Guarantees that students is always an Array and fees is always an Object, preventing
 * undefined runtime exceptions (e.g. state.students.filter).
 */
export function normalizeAppState(
  raw: any,
  fallbackName: string = 'My Study Library',
  fallbackEmail: string = ''
): AppState {
  const base = createBlankUserState(fallbackName, fallbackEmail);
  if (!raw || typeof raw !== 'object') {
    return base;
  }

  // Ensure students is guaranteed to be an array
  let students: Student[] = [];
  if (Array.isArray(raw.students)) {
    students = raw.students.filter((s: any) => s && typeof s === 'object' && s.id);
  }

  // Ensure fees is guaranteed to be an object
  const fees: Record<string, StudentFee> = {};
  if (raw.fees && typeof raw.fees === 'object') {
    Object.keys(raw.fees).forEach((key) => {
      const f = raw.fees[key];
      if (f && typeof f === 'object') {
        fees[key] = {
          status: f.status || 'due',
          amount: typeof f.amount === 'number' ? f.amount : 0,
          monthlyFee: typeof f.monthlyFee === 'number' ? f.monthlyFee : 600,
          lastPaid: f.lastPaid || '',
          lastPaymentMethod: f.lastPaymentMethod || 'cash',
          months: f.months && typeof f.months === 'object' ? f.months : {},
          paymentHistory: Array.isArray(f.paymentHistory) ? f.paymentHistory : [],
        };
      }
    });
  }

  const library = {
    ...base.library,
    ...(raw.library || {}),
    totalSets:
      typeof raw.library?.totalSets === 'number' && raw.library.totalSets > 0
        ? raw.library.totalSets
        : base.library.totalSets,
    shifts:
      Array.isArray(raw.library?.shifts) && raw.library.shifts.length > 0
        ? raw.library.shifts
        : base.library.shifts,
  };

  const header = {
    ...base.header,
    ...(raw.header || {}),
    ownerName: raw.header?.ownerName || fallbackName,
    userName: raw.header?.userName || raw.header?.ownerName || fallbackName,
    email: raw.header?.email || fallbackEmail,
    phone: raw.header?.phone || base.header.phone,
  };

  const currentYear = new Date().getFullYear().toString();
  const monthlyCollectionByYear: Record<string, number[]> = {};
  if (raw.monthlyCollectionByYear && typeof raw.monthlyCollectionByYear === 'object') {
    Object.keys(raw.monthlyCollectionByYear).forEach((yr) => {
      if (Array.isArray(raw.monthlyCollectionByYear[yr])) {
        monthlyCollectionByYear[yr] = raw.monthlyCollectionByYear[yr];
      }
    });
  }
  if (!monthlyCollectionByYear[currentYear]) {
    monthlyCollectionByYear[currentYear] = Array(12).fill(0);
  }

  return {
    students,
    fees,
    library,
    header,
    monthlyCollectionByYear,
    subscriptionExpiry: raw.subscriptionExpiry || base.subscriptionExpiry,
    subscriptionPlan: raw.subscriptionPlan || base.subscriptionPlan || 'trial_24h',
    subscriptionHistory: Array.isArray(raw.subscriptionHistory) ? raw.subscriptionHistory : [],
  };
}

/**
 * Loads stored state isolated by user UID.
 * If user is logged in and no cache exists, returns a fresh isolated blank state (never another user's data).
 * If user is guest/demo, falls back to demo state.
 */
export function loadStoredState(userId?: string): AppState {
  const key = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizeAppState(parsed);
    }

    // If registered user with no local cache yet, return clean state for that user
    if (userId && userId !== 'guest') {
      return createBlankUserState('My Library', '');
    }

    // Guest demo mode fallback
    return normalizeAppState(defaultState);
  } catch (e) {
    console.error('Failed to parse local storage for key:', key, e);
    return userId && userId !== 'guest' ? createBlankUserState('My Library', '') : normalizeAppState(defaultState);
  }
}

/**
 * Saves state strictly isolated to the specified user UID key.
 */
export function saveStoredState(state: AppState, userId?: string): void {
  const key = userId ? `${STORAGE_KEY_PREFIX}${userId}` : `${STORAGE_KEY_PREFIX}guest`;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to local storage for key:', key, e);
  }
}

/**
 * Clears stored cache for a user upon sign out.
 */
export function clearUserStoredState(userId?: string): void {
  try {
    if (userId) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
    }
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}guest`);
    localStorage.removeItem('readbench_app_state_v1');
    localStorage.removeItem('readbench_state_v1');
  } catch (e) {
    console.warn('Failed to clear user storage:', e);
  }
}

/**
 * Calculates primary seat for a student (lowest numerical set, or null if only SNA)
 */
export function getPrimarySeat(student: Student): number | null {
  let min: number | null = null;
  (student.assignments || []).forEach((a) => {
    if (a.set === 'SNA') return;
    const s = Number(a.set);
    if (!isNaN(s) && (min === null || s < min)) {
      min = s;
    }
  });
  return min;
}

/**
 * Helper to compute next fee due date based on admission date
 */
export function getNextDueDate(admissionDate: string, afterDate: string): Date {
  const adm = new Date(admissionDate);
  const after = new Date(afterDate);
  let due = new Date(Date.UTC(after.getUTCFullYear(), after.getUTCMonth(), adm.getUTCDate()));
  if (due <= after) {
    due.setUTCMonth(due.getUTCMonth() + 1);
  }
  return due;
}

/**
 * Refreshes fee status for eligible students based on admission date cycle
 */
export function refreshFeesByAdmissionDate(students: Student[], fees: Record<string, StudentFee>): {
  updatedFees: Record<string, StudentFee>;
  hasChanges: boolean;
  affectedCount: number;
} {
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let hasChanges = false;
  let affectedCount = 0;
  const newFees = { ...fees };

  students.forEach((student) => {
    if (!student.admissionDate) return;
    const admissionDate = new Date(student.admissionDate);
    if (isNaN(admissionDate.getTime())) return;

    let feeData = newFees[student.id];
    if (!feeData) {
      feeData = {
        status: 'due',
        amount: 0,
        monthlyFee: 600,
        lastPaid: '',
        lastResetDate: student.admissionDate,
        months: {},
        paymentHistory: [],
      };
      newFees[student.id] = feeData;
    }

    let lastReset = feeData.lastResetDate ? new Date(feeData.lastResetDate) : admissionDate;
    if (isNaN(lastReset.getTime())) lastReset = admissionDate;

    const nextDue = getNextDueDate(student.admissionDate, lastReset.toISOString());

    if (todayUTC >= nextDue) {
      feeData.status = 'due';
      feeData.amount = 0;
      feeData.lastPaid = '';
      feeData.lastResetDate = todayUTC.toISOString().slice(0, 10);
      const monthKey = nextDue.toISOString().slice(0, 7);
      if (!feeData.months) feeData.months = {};
      feeData.months[monthKey] = 'due';
      hasChanges = true;
      affectedCount++;
    }
  });

  return { updatedFees: newFees, hasChanges, affectedCount };
}
