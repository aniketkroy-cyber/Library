import React, { useState } from 'react';
import {
  X,
  Printer,
  Receipt,
  Download,
  Share2,
  QrCode,
  CheckCircle2,
  Loader2,
  FileText,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Student, StudentFee, HeaderConfig } from '../../types';
import { getPrimarySeat } from '../../utils/initialData';
import {
  downloadReceiptPdf,
  shareReceiptPdfOnWhatsApp,
  InvoicePdfData,
} from '../../utils/pdfGenerator';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  feeData: StudentFee | null;
  header: HeaderConfig;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  isOpen,
  onClose,
  student,
  feeData,
  header,
}) => {
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const totalPaid = feeData?.amount || 0;
  const monthlyFee = feeData?.monthlyFee || 600;
  const totalDue = Math.max(monthlyFee - totalPaid, 0);

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const receiptNo = `INV-${today.getFullYear()}${(today.getMonth() + 1)
    .toString()
    .padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${student.id.slice(-4)}`;

  const seat = getPrimarySeat(student);
  const paymentHistory = feeData?.paymentHistory || [];

  // Convert numbers to words (e.g. 600 -> Six Hundred Rupees Only)
  const numberToWords = (num: number): string => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero Rupees Only';
    if (num < 20) return `${a[num]} Rupees Only`;
    if (num < 100) return `${b[Math.floor(num / 10)]} ${a[num % 10]} Rupees Only`.trim();
    if (num < 1000) {
      const remainder = num % 100;
      return `${a[Math.floor(num / 100)]} Hundred ${remainder > 0 ? (remainder < 20 ? a[remainder] : `${b[Math.floor(remainder / 10)]} ${a[remainder % 10]}`) : ''} Rupees Only`.trim();
    }
    return `${num} Rupees Only`;
  };

  const invoiceData: InvoicePdfData = {
    receiptNo,
    dateStr,
    studentName: student.name,
    mobile: student.mobile || '',
    aadhar: student.aadhar,
    seat,
    admissionDate: student.admissionDate,
    monthlyFee,
    totalPaid,
    totalDue,
    libraryName: header.ownerName || 'ANIKET ROY LIBRARY',
    libraryAddress: header.address || 'Central Study Zone, Station Road, Patna - 800001',
    libraryPhone: header.phone || '+918809474959',
    libraryEmail: header.email || 'library@readbench.xyz',
    upiId: header.upiId || '',
    paymentHistory: paymentHistory.map((p) => ({
      date: p.date,
      amount: p.amount,
      method: p.method,
    })),
  };

  const handlePrint = () => {
    window.print();
  };

  // Direct PDF Share to WhatsApp
  const handleShareWhatsAppPdf = async () => {
    if (!student.mobile || student.mobile.trim().length === 0) {
      setStatusMessage('⚠️ इस छात्र का मोबाइल नंबर उपलब्ध नहीं है। कृपया पहले छात्र के विवरण में मोबाइल नंबर जोड़ें।');
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    try {
      setIsProcessingPdf(true);
      setStatusMessage(`PDF जनरेट हो रहा है और ${student.name} का WhatsApp खुल रहा है...`);

      await shareReceiptPdfOnWhatsApp(invoiceData);

      setStatusMessage(`✅ PDF डाउनलोड हो गया और ${student.name} (${student.mobile}) का WhatsApp चैट खुल गया!`);

      setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
    } catch (err) {
      console.warn('Failed to share PDF:', err);
      setStatusMessage('❌ PDF जनरेट करने में समस्या: ' + (err as Error).message);
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  // Direct PDF Download
  const handleDownloadPdfOnly = async () => {
    try {
      setIsProcessingPdf(true);
      setStatusMessage('Downloading PDF...');

      await downloadReceiptPdf(invoiceData);

      setStatusMessage('✅ PDF downloaded successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      setStatusMessage('❌ Failed to download PDF: ' + (err as Error).message);
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const isFullyPaid = totalDue === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden during Print) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs tracking-tight">Official Fee Invoice & Receipt</span>
            {isProcessingPdf && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-medium animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Processing PDF...</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Main Feature: Share PDF on WhatsApp */}
            <button
              onClick={handleShareWhatsAppPdf}
              disabled={isProcessingPdf}
              title={`Download PDF & directly open WhatsApp for ${student.name} (${student.mobile || 'No Mobile'})`}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 active:scale-95 cursor-pointer"
            >
              {isProcessingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>Share PDF on WhatsApp</span>
              {student.mobile && (
                <span className="hidden sm:inline font-mono font-medium text-[10px] text-emerald-200">
                  ({student.mobile})
                </span>
              )}
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPdfOnly}
              disabled={isProcessingPdf}
              title="Download PDF to device"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Download PDF</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in duration-150 no-print border-b ${
              statusMessage.startsWith('⚠️') || statusMessage.startsWith('❌')
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Printable Executive Receipt Sheet */}
        <div id="printable-receipt" className="p-6 sm:p-8 bg-white text-slate-800 space-y-5 text-xs font-sans selection:bg-indigo-100">
          {/* 1. Header with Logo, Organization & Registration */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-900">
            <div className="flex items-center gap-3.5">
              {header.logoUrl ? (
                <img
                  src={header.logoUrl}
                  alt="Library Logo"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xl shadow-md">
                  RB
                </div>
              )}
              <div>
                <h1 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                  {header.ownerName || 'ANIKET ROY LIBRARY'}
                </h1>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{header.address || 'Central Study Zone, Station Road, Patna - 800001'}</span>
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" /> {header.phone || '+918809474959'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-2.5 h-2.5" /> {header.email || 'library@readbench.xyz'}
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Badge */}
            <div className="text-left sm:text-right shrink-0">
              <span className="inline-block px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                Fee Invoice & Receipt
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1 font-bold">
                REG: RB-LIB-880947
              </p>
            </div>
          </div>

          {/* 2. Invoice & Member Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Left: Member Info */}
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                Billed To (Member)
              </p>
              <h3 className="font-extrabold text-sm text-slate-950">{student.name}</h3>
              <p className="text-slate-600 font-mono text-[11px]">📞 {student.mobile || '—'}</p>
              {student.aadhar && (
                <p className="text-[10px] text-slate-400 font-mono">
                  Aadhar: {student.aadhar}
                </p>
              )}
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100/70 text-indigo-800 text-[10px] font-black">
                  Allocated: {seat != null ? `Set ${seat}` : 'SNA (Floating)'}
                </span>
              </div>
            </div>

            {/* Right: Invoice Info */}
            <div className="text-right space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                Invoice Details
              </p>
              <p className="font-mono font-black text-slate-900 text-xs">{receiptNo}</p>
              <p className="text-slate-600 font-medium text-[11px]">Date: {dateStr}</p>
              <p className="text-slate-500 text-[10px]">
                Admission: {student.admissionDate || '—'}
              </p>
              <div className="pt-1 flex justify-end">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    isFullyPaid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isFullyPaid ? 'Paid in Full' : 'Partial Due'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 3. Itemized Services Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Description of Facility / Services</th>
                  <th className="py-2.5 px-3 text-center">Shift & Seat</th>
                  <th className="py-2.5 px-3 text-right">Fee Rate (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">01</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">
                      Monthly Library Study Desk Membership
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Includes high-speed Wi-Fi, air-conditioned silent hall, power socket & locker access.
                    </p>
                  </td>
                  <td className="py-3 px-3 text-center font-mono font-semibold text-slate-700">
                    {seat != null ? `Set ${seat}` : 'SNA'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{monthlyFee}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Payment History & Calculation Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Recent Payments Received */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                Payment Transactions Received
              </p>
              {paymentHistory.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No payments logged yet.</p>
              ) : (
                <div className="space-y-1">
                  {paymentHistory.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200/60 last:border-0"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-medium text-slate-700">{p.date}</span>
                        <span className="px-1 py-0.2 rounded bg-slate-200 text-slate-600 font-mono text-[9px] uppercase">
                          {p.method}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700">₹{p.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Balance Calculations */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal Amount:</span>
                <span className="font-mono font-bold text-slate-800">₹{monthlyFee}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>GST / Taxes (Exempt):</span>
                <span className="font-mono text-slate-500">₹0.00</span>
              </div>
              <div className="flex justify-between py-1 text-emerald-700 font-bold border-t border-slate-200">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-sm">₹{totalPaid}</span>
              </div>
              <div className="flex justify-between py-1.5 text-rose-600 font-black text-sm border-t-2 border-slate-900">
                <span>Balance Due:</span>
                <span className="font-mono text-base">₹{totalDue}</span>
              </div>
            </div>
          </div>

          {/* Amount in words */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Amount in Words:{' '}
            </span>
            <span className="font-bold text-slate-800 italic">
              {numberToWords(totalPaid > 0 ? totalPaid : monthlyFee)}
            </span>
          </div>

          {/* 5. Stamp, QR & Signatures */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-3 items-center">
            {/* Left: Dynamic UPI QR */}
            <div className="flex items-center gap-2.5">
              {header.qrCodeUrl ? (
                <img
                  src={header.qrCodeUrl}
                  alt="QR"
                  className="w-16 h-16 rounded-xl border border-slate-200 p-0.5 object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200">
                  <QrCode className="w-6 h-6 text-indigo-600" />
                  <span className="text-[8px] font-mono mt-0.5 font-bold">SCAN TO PAY</span>
                </div>
              )}
              <div className="text-[10px] text-slate-500 leading-tight">
                <p className="font-bold text-slate-800">Direct UPI Scan</p>
                {header.upiId && <p className="font-mono text-emerald-600 font-bold">{header.upiId}</p>}
                <p className="text-[9px] text-slate-400">GPay • PhonePe • Paytm</p>
              </div>
            </div>

            {/* Center: Authentic Seal Stamp */}
            <div className="flex justify-center">
              <div
                className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center text-center p-1 transform -rotate-12 ${
                  isFullyPaid
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-50/20'
                    : 'border-amber-600 text-amber-600 bg-amber-50/20'
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {header.ownerName || 'READBENCH'}
                </span>
                <span className="text-[10px] font-black uppercase border-y border-current py-0.5 my-0.5">
                  {isFullyPaid ? 'PAID IN FULL' : 'PARTIAL DUE'}
                </span>
                <span className="text-[8px] font-bold font-mono">{dateStr}</span>
              </div>
            </div>

            {/* Right: Signature Line */}
            <div className="text-right text-[10px] space-y-1">
              <div className="h-10 flex items-end justify-end">
                <span className="font-serif italic font-bold text-indigo-900 text-sm">
                  {header.userName || 'Authorized Signatory'}
                </span>
              </div>
              <div className="border-t border-slate-300 pt-1">
                <p className="font-black text-slate-800">Authorized Officer Seal</p>
                <p className="text-slate-400">ReadBench Library Administration</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
