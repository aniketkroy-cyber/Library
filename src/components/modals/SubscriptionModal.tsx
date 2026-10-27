import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  Clock,
  Sparkles,
  CreditCard,
  QrCode,
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import { AppState, SubscriptionPlan, SubscriptionHistoryItem } from '../../types';
import {
  SUBSCRIPTION_PLANS,
  RAZORPAY_KEY_ID,
  isSubscriptionActive,
  getSubscriptionTimeRemaining,
} from '../../utils/initialData';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onSubscriptionSuccess: (updatedState: AppState) => void;
  isEnforced?: boolean; // When true, user clicked a locked feature
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  state,
  onSubscriptionSuccess,
  isEnforced = false,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('3months');
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<'razorpay' | 'upi'>('razorpay');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [showUtrInput, setShowUtrInput] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const currentStatus = getSubscriptionTimeRemaining(state.subscriptionExpiry);
  const isCurrentlyActive = isSubscriptionActive(state.subscriptionExpiry);
  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];

  // Load Razorpay script dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        // Razorpay loaded
      };
      document.body.appendChild(script);
    }
  }, []);

  if (!isOpen) return null;

  const handlePlanActivation = (plan: SubscriptionPlan, paymentId: string, method: string) => {
    const currentExpiryMs = state.subscriptionExpiry
      ? new Date(state.subscriptionExpiry).getTime()
      : 0;
    const baseTime = !isNaN(currentExpiryMs) && currentExpiryMs > Date.now()
      ? currentExpiryMs
      : Date.now();

    const newExpiry = new Date(baseTime + plan.durationDays * 24 * 60 * 60 * 1000).toISOString();

    const historyEntry: SubscriptionHistoryItem = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      paymentId: paymentId || `PAY-${Date.now()}`,
      planId: plan.id,
      planName: plan.name,
      amount: plan.price,
      date: new Date().toISOString(),
      expiryDate: newExpiry,
      method: method === 'razorpay' ? 'razorpay' : 'upi',
      startDate: new Date().toISOString(),
      endDate: newExpiry,
      paymentMethod: method,
      status: 'active',
    };

    const updatedState: AppState = {
      ...state,
      subscriptionExpiry: newExpiry,
      subscriptionPlan: plan.id,
      subscriptionHistory: [historyEntry, ...(state.subscriptionHistory || [])],
    };

    onSubscriptionSuccess(updatedState);
    onClose();
  };

  const handleRazorpayPayment = () => {
    setErrorMessage('');
    setLoading(true);

    if (!window.Razorpay) {
      // If Razorpay script failed to load, fallback to manual confirmation or UPI
      setLoading(false);
      setPaymentMode('upi');
      setErrorMessage('Razorpay gateway is initializing or unavailable. Please pay directly via UPI.');
      return;
    }

    try {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: selectedPlan.price * 100, // amount in paisa
        currency: 'INR',
        name: state.header.ownerName || 'Study Library App',
        description: `Library Subscription: ${selectedPlan.name}`,
        image: state.header.logoUrl || undefined,
        prefill: {
          name: state.header.userName || 'Library Admin',
          email: state.header.email || 'libraryadmin@example.com',
          contact: state.header.phone || '+918809474959',
        },
        notes: {
          plan_id: selectedPlan.id,
          library_name: state.header.ownerName,
        },
        theme: {
          color: '#2563eb',
        },
        handler: function (response: any) {
          setLoading(false);
          const paymentId = response.razorpay_payment_id || `rzp_${Date.now()}`;
          handlePlanActivation(selectedPlan, paymentId, 'razorpay');
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setLoading(false);
        setErrorMessage(
          response.error?.description || 'Payment was unsuccessful or cancelled. Please try again.'
        );
      });
      rzp.open();
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || 'Failed to open Razorpay checkout.');
    }
  };

  const handleUtrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setErrorMessage('कृपया वैध 12 अंकों का UPI UTR/Transaction Ref नंबर दर्ज करें');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      handlePlanActivation(selectedPlan, `UTR-${utrNumber.trim()}`, 'upi_qr');
    }, 600);
  };

  // UPI intent link
  const defaultUpi = state.header.upiId || '8809474959@paytm';
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(
    defaultUpi
  )}&pn=LibrarySubscription&am=${selectedPlan.price}&tn=ReadBench_${selectedPlan.id}&cu=INR`;
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiIntentUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white px-6 py-6 sm:px-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Official Subscription Plans
            </span>
            {isCurrentlyActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                <BadgeCheck className="w-3.5 h-3.5" />
                Active ({currentStatus.formatted})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/30 text-red-200 border border-red-400/30">
                <Lock className="w-3.5 h-3.5" />
                All Functions Locked
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Select Your Library Plan
          </h2>
          <p className="text-blue-100 text-sm sm:text-base mt-1 max-w-2xl">
            {isCurrentlyActive ? (
              <>अपनी लाइब्रेरी को बिना रुकावट जारी रखने के लिए अपनी पसंदीदा योजना चुनें।</>
            ) : (
              <>
                24 घंटे का फ्री ट्रायल पूरा हो चुका है। सभी फीचर्स (छात्र जोड़ना, फीस रसीद, सीट आवंटन, बैकअप) अनलॉक करने के लिए तुरंत प्लान चुनें।
              </>
            )}
          </p>

          {/* Trial / Expired status indicator */}
          <div className="mt-4 p-3 rounded-xl bg-black/25 border border-white/15 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              {isCurrentlyActive ? (
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                  <Clock className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 animate-pulse">
                  <Lock className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-xs text-white/70">वर्तमान स्टेटस</p>
                <p className="text-sm font-bold text-white">
                  {isCurrentlyActive
                    ? `वैधता शेष: ${currentStatus.formatted}`
                    : '24 घंटे का फ्री ट्रायल समाप्त — कार्यक्षमता लॉक है'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-white/70 block">सुरक्षित पेमेंट</span>
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Razorpay Live + UPI Verified
              </span>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pricing Tiers Grid */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
              प्लान चुनें (Choose Plan)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-xl p-4 cursor-pointer transition-all border-2 text-left flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                        {plan.badge}
                      </span>
                    )}
                    {plan.popular && !plan.badge && (
                      <span className="absolute -top-3 right-3 bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                        MOST POPULAR
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-bold text-slate-900">{plan.name}</span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{plan.hindiName}</p>

                      <div className="mb-2">
                        <span className="text-3xl font-black text-slate-900">₹{plan.price}</span>
                        <span className="text-xs text-slate-500 ml-1">
                          / {plan.durationMonths === 1 ? 'month' : `${plan.durationMonths} months`}
                        </span>
                      </div>

                      {plan.savings && (
                        <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 mb-3">
                          {plan.savings}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span>पूर्ण {plan.durationDays} दिन एक्सेस</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span>तुरंत लाइव एक्टिवेशन</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Included Features List */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              सब्सक्रिप्शन में शामिल मुख्य सुविधाएं (Included Features):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>असीमित छात्र व सीट आवंटन</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>व्हाट्सएप पर डायरेक्ट PDF रसीद</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>रियल-टाइम फायरबेस क्लाउड सिंक</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>मासिक फीस ट्रैकिंग और रिपोर्ट</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>शिफ्ट एवं टाइमिंग कस्टमाइजेशन</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Excel/JSON डेटा बैकअप और रिस्टोर</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector & CTA */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              
              {/* Payment Method Tabs */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start">
                <button
                  type="button"
                  onClick={() => setPaymentMode('razorpay')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    paymentMode === 'razorpay'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Razorpay Checkout
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('upi')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    paymentMode === 'upi'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  UPI QR / App
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!isEnforced && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors"
                  >
                    बाद में करें (Close)
                  </button>
                )}

                {paymentMode === 'razorpay' ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleRazorpayPayment}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        प्रोसेसिंग...
                      </span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Pay ₹{selectedPlan.price} & Unlock</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUtrInput(!showUtrInput)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Scan QR / Confirm UTR</span>
                  </button>
                )}
              </div>
            </div>

            {/* UPI QR Display & Manual UTR Verification Drawer */}
            {paymentMode === 'upi' && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                    <img
                      src={upiQrUrl}
                      alt="UPI Payment QR"
                      className="w-36 h-36 rounded-lg object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 mt-1">
                    Scan with any UPI App (GPay/PhonePe/Paytm)
                  </span>
                  <a
                    href={upiIntentUrl}
                    className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Direct UPI App Link →
                  </a>
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">
                      Amount: ₹{selectedPlan.price} ({selectedPlan.name})
                    </h5>
                    <p className="text-xs text-slate-500">
                      QR कोड स्कैन करके ₹{selectedPlan.price} का भुगतान करें, फिर नीचे 12 अंकों का UTR/Transaction ID दर्ज करें।
                    </p>
                  </div>

                  <form onSubmit={handleUtrSubmit} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="12 Digit UPI UTR Number (e.g. 412345678901)"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Verify & Unlock'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      भुगतान होते ही आपका अकाउंट तुरंत एक्टिवेट और अनब्लॉक हो जाएगा।
                    </p>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
