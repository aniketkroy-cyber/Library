export interface Assignment {
  shift: string;
  set: number | 'SNA';
}

export interface Student {
  id: string;
  name: string;
  mobile: string;
  aadhar?: string;
  admissionDate: string;
  avatar?: string;
  feeStatus: 'paid' | 'partial' | 'due';
  assignments: Assignment[];
  seat?: number | null;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: 'cash' | 'upi';
  time: string;
  receiptNo?: string;
}

export interface StudentFee {
  status: 'paid' | 'partial' | 'due';
  amount: number; // Amount paid in current billing cycle
  monthlyFee: number;
  lastPaid?: string;
  lastPaymentMethod?: 'cash' | 'upi' | '-';
  lastResetDate?: string;
  months?: Record<string, 'paid' | 'partial' | 'due'>; // "YYYY-MM" -> status
  paymentHistory?: PaymentRecord[];
}

export interface Shift {
  id: string;
  label: string;
  capacity: number;
}

export interface LibraryConfig {
  totalSets: number;
  shifts: Shift[];
}

export interface HeaderConfig {
  ownerName: string;
  logoUrl: string;
  userName: string;
  userAvatar: string;
  qrCodeUrl: string;
  address: string;
  phone: string;
  email: string;
  upiId: string;
}

export interface SubscriptionPlan {
  id: '1month' | '3months' | '6months' | '1year';
  name: string;
  hindiName: string;
  durationMonths: number;
  durationDays: number;
  price: number;
  savings?: string;
  badge?: string;
  popular?: boolean;
}

export interface SubscriptionHistoryItem {
  id?: string;
  paymentId: string;
  planId: string;
  planName: string;
  amount: number;
  date: string;
  expiryDate: string;
  method: 'razorpay' | 'upi';
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  status?: string;
}

export interface AppState {
  students: Student[];
  fees: Record<string, StudentFee>;
  library: LibraryConfig;
  monthlyCollectionByYear: Record<string, number[]>;
  header: HeaderConfig;
  subscriptionExpiry?: string;
  subscriptionPlan?: string;
  subscriptionHistory?: SubscriptionHistoryItem[];
}
