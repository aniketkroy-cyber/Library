import React, { useState, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Send,
  Sparkles,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Student, StudentFee, HeaderConfig } from '../../types';
import { getPrimarySeat } from '../../utils/initialData';
import { openDirectWhatsApp } from '../../utils/pdfGenerator';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  feeData: StudentFee | null;
  header: HeaderConfig;
}

type TemplateKey = 'welcome' | 'payment' | 'reminder' | 'inactive';

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  student,
  feeData,
  header,
}) => {
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>('reminder');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [warningText, setWarningText] = useState<string | null>(null);

  const libraryName = header.ownerName || 'ReadBench Library';

  const getTemplateText = (key: TemplateKey, s: Student, f: StudentFee | null): string => {
    const seat = getPrimarySeat(s);
    const seatLabel = seat != null ? `Set ${seat}` : 'SNA';
    const shiftsStr = (s.assignments || [])
      .map((a) => `${a.shift} (${a.set === 'SNA' ? 'SNA' : 'Set ' + a.set})`)
      .join(', ') || 'General Shift';

    const monthlyFee = f?.monthlyFee || 600;
    const paidAmount = f?.amount || 0;
    const dueAmount = Math.max(monthlyFee - paidAmount, 0);
    const lastPaidDate = f?.lastPaid || new Date().toLocaleDateString('en-IN');

    switch (key) {
      case 'welcome':
        return `🎉 Welcome to ${libraryName}, ${s.name}! 🎉

📚 *Your Learning Journey Starts Here!*

🪑 Seat: ${seatLabel}
🕒 Shift: ${shiftsStr}
💰 Monthly Fee: ₹${monthlyFee}

🌟 *We’re delighted to have you as part of our study family!*
यहाँ आपको मिलेगा एक शांत, disciplined और focused environment — जो आपकी success को next level तक ले जाएगा 🚀

📖 *Stay consistent, stay focused, and success will follow!*

🤝 किसी भी सहायता के लिए बेझिझक हमसे संपर्क करें — हम हमेशा आपके साथ हैं।

💡 *"आज की मेहनत ही कल की सफलता है!"*
🔥 *Let’s crack your goals together!* 🔥`;

      case 'payment':
        return `✅ Payment Confirmation - ${libraryName}

👋 Dear ${s.name},

💰 *Payment Received Successfully!*
We appreciate your payment — thank you for being a valued member 🙌 💰

📊 *Payment Details:*
💰 Amount Received: ₹${paidAmount}
📅 Date: ${lastPaidDate}
🪑 Seat: ${seatLabel}
🚀 Status: ${(f?.status || 'PAID').toUpperCase()}

📖 *Keep Learning, Keep Growing!*
Your dedication today is building your success tomorrow 🚀

${dueAmount > 0 ? `🔔 *Note:* Kindly clear the remaining amount (₹${dueAmount}) soon to continue uninterrupted access.` : '✨ Your fees are fully cleared for this cycle. Thank you!'}

🤝 Need help? Library Desk is always here for you!
✨ *Happy Reading & Stay Focused!* ✨`;

      case 'reminder':
        return `⏰ Fee Reminder - ${libraryName}

👋 Hello ${s.name},

🪑 Seat: ${seatLabel}
🕒 Shift: ${shiftsStr}
📅 Monthly Fee: ₹${monthlyFee}
✅ Paid: ₹${paidAmount}
❌ Due Amount: ₹${dueAmount}

🔔 *Kind Reminder:*
कृपया अपना बाकी शुल्क (₹${dueAmount}) जल्द से जल्द जमा करें ताकि आपकी सीट और सुविधा बिना किसी रुकावट के जारी रहे 📚

${header.upiId ? `📱 You can pay via UPI to: *${header.upiId}*` : ''}

📞 *Library Desk:* ${header.phone || '+918809474959'}
किसी भी सहायता के लिए हमसे संपर्क करें — हम हमेशा आपकी मदद के लिए तैयार हैं 🤝

🚀 *Stay consistent, success is on the way!*
✨ *Happy Studying!* ✨`;

      case 'inactive':
        return `⚠️ Inactive Alert - ${libraryName}

👋 Hello ${s.name},

📌 *We Miss You at the Library!*
काफी समय से आपकी उपस्थिति दर्ज नहीं हुई है 😔

🪑 *Your Seat ${seatLabel}* अभी भी आपके लिए सुरक्षित है — लेकिन उसे active बनाए रखने के लिए आपका आना जरूरी है 📚

🔔 *Kind Request:*
कृपया जल्द से जल्द अपनी attendance अपडेट करें या हमसे संपर्क करें ताकि आपकी membership active बनी रहे।

📞 *Need Help?*
Library Desk (${header.phone || '+918809474959'}) हमेशा आपकी सहायता के लिए उपलब्ध है 🤝

🚀 *Come back, stay consistent & keep moving towards your goals!*
✨ *We’re waiting for you!* ✨`;
    }
  };

  useEffect(() => {
    if (student) {
      setCustomMessage(getTemplateText(activeTemplate, student, feeData));
    }
  }, [student, feeData, activeTemplate, isOpen]);

  if (!isOpen || !student) return null;

  const handleSelectTemplate = (key: TemplateKey) => {
    setActiveTemplate(key);
    setCustomMessage(getTemplateText(key, student, feeData));
  };

  const handleSendWhatsApp = () => {
    if (!student.mobile || student.mobile.trim().length === 0) {
      setWarningText('⚠️ छात्र का मोबाइल नंबर उपलब्ध नहीं है। कृपया पहले छात्र के विवरण में मोबाइल नंबर जोड़ें।');
      setTimeout(() => setWarningText(null), 4000);
      return;
    }

    // Substitute tags if user typed any directly
    const paidAmt = feeData?.amount || 0;
    const dueAmt = Math.max((feeData?.monthlyFee || 600) - paidAmt, 0);

    let messageToSend = customMessage
      .replace(/{student_name}/g, student.name)
      .replace(/{amount}/g, String(paidAmt))
      .replace(/{due}/g, String(dueAmt))
      .replace(/{library}/g, libraryName);

    openDirectWhatsApp(student.mobile, messageToSend);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="text-base font-bold">WhatsApp Message Templates</h3>
              <p className="text-xs text-emerald-200">
                To: <span className="font-bold text-white">{student.name}</span> ({student.mobile || 'No Phone'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {warningText && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-bold text-amber-900 flex items-center justify-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{warningText}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs">
          <div>
            <p className="text-slate-600 font-semibold mb-2">Select Message Template:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'welcome', label: '🎉 Welcome' },
                { id: 'payment', label: '✅ Payment' },
                { id: 'reminder', label: '⏰ Fee Reminder' },
                { id: 'inactive', label: '⚠️ Inactive Alert' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectTemplate(item.id as TemplateKey)}
                  className={`py-2 px-2.5 rounded-xl font-bold text-xs text-center border transition-all ${
                    activeTemplate === item.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">Customized Message Preview:</label>
              <span className="text-[10px] text-slate-400 font-mono">
                {customMessage.length} characters
              </span>
            </div>
            <textarea
              rows={8}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden leading-relaxed resize-none font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              Supports tags: <code className="bg-white px-1 py-0.5 rounded border text-[10px] font-mono">{`{student_name}`}</code>,{' '}
              <code className="bg-white px-1 py-0.5 rounded border text-[10px] font-mono">{`{amount}`}</code>,{' '}
              <code className="bg-white px-1 py-0.5 rounded border text-[10px] font-mono">{`{due}`}</code>
            </span>
          </div>

          {/* Send via WhatsApp Button */}
          <button
            onClick={handleSendWhatsApp}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>Send via WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
