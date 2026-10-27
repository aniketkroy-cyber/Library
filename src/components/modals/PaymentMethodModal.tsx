import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, StudentFee } from '../../types';
import { generateDynamicUpiQr } from '../../utils/upi';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  feeData: StudentFee | null;
  ownerUpiId: string;
  ownerLibraryName: string;
  onConfirmPayment: (student: Student, amount: number, method: 'cash' | 'upi') => void;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  student,
  feeData,
  ownerUpiId,
  ownerLibraryName,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<'cash' | 'upi'>('upi');
  const [amountInput, setAmountInput] = useState<string>('');
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  // Set default due amount when modal opens
  useEffect(() => {
    if (student && feeData) {
      const remainingDue = Math.max((feeData.monthlyFee || 600) - (feeData.amount || 0), 0);
      const defaultAmt = remainingDue > 0 ? remainingDue : feeData.monthlyFee || 600;
      setAmountInput(String(defaultAmt));
      setInputError(null);
    }
  }, [student, feeData, isOpen]);

  // Generate dynamic QR code as amount changes
  useEffect(() => {
    if (method === 'upi' && ownerUpiId && amountInput) {
      const num = parseFloat(amountInput);
      if (!isNaN(num) && num > 0) {
        setIsGeneratingQr(true);
        generateDynamicUpiQr(ownerUpiId, ownerLibraryName, num)
          .then((qr) => setUpiQrDataUrl(qr))
          .finally(() => setIsGeneratingQr(false));
      } else {
        setUpiQrDataUrl(null);
      }
    } else {
      setUpiQrDataUrl(null);
    }
  }, [method, amountInput, ownerUpiId, ownerLibraryName]);

  if (!isOpen || !student) return null;

  const handleConfirm = () => {
    const amt = parseFloat(amountInput);
    if (isNaN(amt) || amt <= 0) {
      setInputError('⚠️ Please enter a valid payment amount (greater than ₹0).');
      return;
    }
    setInputError(null);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // Confetti fallback
    }

    onConfirmPayment(student, amt, method);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-200" />
              <span>Collect Fee Payment</span>
            </h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              Student: <span className="font-bold text-white">{student.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Method Choice */}
          <div className="grid grid-cols-2 gap-3">
            {/* UPI Option */}
            <div
              onClick={() => setMethod('upi')}
              className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                method === 'upi'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  method === 'upi' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <QrCode className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs">Dynamic UPI QR</span>
              <span className="text-[10px] text-slate-400">Scan & Pay on Mobile</span>
            </div>

            {/* Cash Option */}
            <div
              onClick={() => setMethod('cash')}
              className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1.5 ${
                method === 'cash'
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  method === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Banknote className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs">Cash Payment</span>
              <span className="text-[10px] text-slate-400">Manual counter cash</span>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Enter Amount Received (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min={1}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="Enter amount"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-bold text-slate-800 outline-hidden font-mono"
              />
            </div>
            {feeData && (
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>Monthly Fee: ₹{feeData.monthlyFee}</span>
                <span>Already Paid: ₹{feeData.amount || 0}</span>
              </div>
            )}
          </div>

          {/* Dynamic QR Presentation */}
          {method === 'upi' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Instant Dynamic UPI QR Code</span>
              </div>

              {ownerUpiId ? (
                <div>
                  <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200 inline-block">
                    {upiQrDataUrl ? (
                      <img
                        src={upiQrDataUrl}
                        alt="Dynamic UPI QR"
                        className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                        {isGeneratingQr ? 'Generating QR...' : 'Enter amount to generate QR'}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono font-bold mt-2">
                    UPI ID: {ownerUpiId}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Amount locked to ₹{amountInput || '0'}. Scan with Google Pay, PhonePe or Paytm.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-center">
                  <AlertCircle className="w-6 h-6 mx-auto mb-1 text-amber-600" />
                  <p className="font-bold">UPI ID Not Configured</p>
                  <p className="text-[10px] mt-0.5 text-amber-700">
                    Set your UPI ID in Settings to enable automatic QR generation.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Input Error Message */}
          {inputError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-center animate-in fade-in">
              {inputError}
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm ₹{amountInput || 0} Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
};
