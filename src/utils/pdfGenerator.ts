import jsPDF from 'jspdf';
import { generateDynamicUpiQr } from './upi';

export interface InvoicePdfData {
  receiptNo: string;
  dateStr: string;
  studentName: string;
  mobile: string;
  aadhar?: string;
  seat: number | null;
  admissionDate?: string;
  monthlyFee: number;
  totalPaid: number;
  totalDue: number;
  libraryName: string;
  libraryAddress: string;
  libraryPhone: string;
  libraryEmail: string;
  upiId: string;
  paymentHistory?: { date: string; amount: number; method: string }[];
}

/**
 * Converts a number to words (Indian Rupees)
 */
function numberToWords(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero Rupees Only';
  if (num < 20) return `${a[num]} Rupees Only`;
  if (num < 100) return `${b[Math.floor(num / 10)]} ${a[num % 10]} Rupees Only`.trim();
  if (num < 1000) {
    const remainder = num % 100;
    return `${a[Math.floor(num / 100)]} Hundred ${remainder > 0 ? (remainder < 20 ? a[remainder] : `${b[Math.floor(remainder / 10)]} ${a[remainder % 10]}`) : ''} Rupees Only`.trim();
  }
  const thousands = Math.floor(num / 1000);
  const remainder = num % 1000;
  return `${thousands > 0 ? `${numberToWords(thousands).replace(' Rupees Only', '')} Thousand ` : ''}${remainder > 0 ? numberToWords(remainder) : 'Rupees Only'}`.trim();
}

/**
 * Generates an official, executive vector A4 PDF receipt using native jsPDF
 * This is 100% independent of html2canvas/CSS so it NEVER crashes on modern CSS or oklch colors!
 */
export async function createInvoicePdf(data: InvoicePdfData): Promise<{ doc: jsPDF; blob: Blob; file: File }> {
  // A4 dimensions: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [30, 41, 59]; // slate-800
  const accentIndigo = [79, 70, 229]; // indigo-600
  const emeraldColor = [16, 185, 129]; // emerald-600
  const roseColor = [225, 29, 72]; // rose-600

  // 1. Top Decorative Bar
  doc.setFillColor(accentIndigo[0], accentIndigo[1], accentIndigo[2]);
  doc.rect(0, 0, 210, 6, 'F');

  // 2. Organization Header
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(15, 14, 16, 16, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RB', 19.5, 24.5);

  // Library Name
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text((data.libraryName || 'ANIKET ROY LIBRARY').toUpperCase(), 36, 20);

  // Address & Contacts
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(data.libraryAddress || 'Central Study Zone, Station Road, Patna - 800001', 36, 25);
  doc.text(`Phone: ${data.libraryPhone || '+918809474959'}   |   Email: ${data.libraryEmail || 'library@readbench.xyz'}`, 36, 29.5);

  // Top Right Badge
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(145, 14, 50, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('FEE INVOICE & RECEIPT', 151, 18.5);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('REG: RB-LIB-880947', 158, 26);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.6);
  doc.line(15, 34, 195, 34);

  // 3. Metadata Grid (Billed To & Invoice Details)
  // Billed To Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 38, 86, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('BILLED TO (MEMBER)', 19, 44);

  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.studentName || 'Student Name', 19, 50);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Mobile: ${data.mobile || '—'}`, 19, 55.5);
  if (data.aadhar) {
    doc.text(`Aadhar: ${data.aadhar}`, 19, 60);
  }

  // Seat Badge
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(19, 62, 45, 5, 1.5, 1.5, 'F');
  doc.setTextColor(67, 56, 202);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`SEAT ALLOTTED: ${data.seat != null ? `SET #${data.seat}` : 'SNA (FLOATING)'}`, 21, 65.5);

  // Invoice Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(109, 38, 86, 32, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('INVOICE METADATA', 113, 44);

  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Invoice No:', 113, 50);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.receiptNo, 142, 50);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Issue Date:', 113, 55.5);
  doc.text(data.dateStr, 142, 55.5);

  doc.text('Admission:', 113, 60);
  doc.text(data.admissionDate || '—', 142, 60);

  // Status Badge
  const isPaid = data.totalDue <= 0;
  if (isPaid) {
    doc.setFillColor(209, 250, 229);
    doc.roundedRect(113, 62, 32, 5, 1.5, 1.5, 'F');
    doc.setTextColor(6, 95, 70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PAID IN FULL', 116.5, 65.5);
  } else {
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(113, 62, 32, 5, 1.5, 1.5, 'F');
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PARTIAL DUE', 116.5, 65.5);
  }

  // 4. Services Table
  let currentY = 77;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, currentY, 180, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(15, currentY, 180, 8, 'S');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('#', 19, currentY + 5.5);
  doc.text('DESCRIPTION OF FACILITY / SERVICES', 32, currentY + 5.5);
  doc.text('SEAT / SHIFT', 135, currentY + 5.5);
  doc.text('FEE (INR)', 175, currentY + 5.5);

  // Row 1
  currentY += 8;
  doc.setFillColor(255, 255, 255);
  doc.rect(15, currentY, 180, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, currentY, 180, 14, 'S');

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('01', 19, currentY + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Library Study Desk Membership', 32, currentY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Silent Air-Conditioned Hall, High-Speed Wi-Fi & Power Sockets', 32, currentY + 10);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(data.seat != null ? `Set #${data.seat}` : 'SNA', 135, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${data.monthlyFee}`, 172, currentY + 7);

  // 5. Payment Breakdown & Calculations
  currentY += 19;

  // Left box: Payment Log
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, currentY, 95, 34, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENTS RECEIVED (LEDGER)', 19, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const history = data.paymentHistory || [];
  if (history.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text('No payment transactions logged yet.', 19, currentY + 14);
  } else {
    history.slice(0, 3).forEach((p, idx) => {
      const lineY = currentY + 12 + idx * 6.5;
      doc.setTextColor(71, 85, 105);
      doc.text(`${p.date} • ${p.method.toUpperCase()}`, 19, lineY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`+ INR ${p.amount}`, 85, lineY);
      doc.setFont('helvetica', 'normal');
    });
  }

  // Right: Calculation Summary
  const rightX = 120;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal Amount:', rightX, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${data.monthlyFee}`, 175, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Taxes / GST (Exempt):', rightX, currentY + 12);
  doc.text('INR 0.00', 175, currentY + 12);

  doc.setDrawColor(203, 213, 225);
  doc.line(rightX, currentY + 15, 195, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('Total Paid:', rightX, currentY + 20);
  doc.text(`INR ${data.totalPaid}`, 175, currentY + 20);

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(rightX, currentY + 23, 195, currentY + 23);

  doc.setFontSize(10.5);
  doc.setTextColor(data.totalDue > 0 ? roseColor[0] : 16, data.totalDue > 0 ? roseColor[1] : 185, data.totalDue > 0 ? roseColor[2] : 129);
  doc.text('Balance Due:', rightX, currentY + 29);
  doc.text(`INR ${data.totalDue}`, 173, currentY + 29);

  // 6. Amount in words box
  currentY += 38;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, currentY, 180, 9, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AMOUNT IN WORDS:', 19, currentY + 6);
  doc.setFont('helvetica', 'bolditalic');
  doc.setTextColor(15, 23, 42);
  doc.text(numberToWords(data.totalPaid > 0 ? data.totalPaid : data.monthlyFee), 55, currentY + 6);

  // 7. QR Code, Stamp & Signatures
  currentY += 14;

  // Embed Dynamic UPI QR Code
  if (data.upiId) {
    try {
      const qrDataUri = await generateDynamicUpiQr(
        data.upiId,
        data.libraryName,
        data.totalDue > 0 ? data.totalDue : data.monthlyFee
      );
      if (qrDataUri) {
        doc.addImage(qrDataUri, 'PNG', 15, currentY, 22, 22);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.text('Scan & Pay via UPI', 40, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`VPA: ${data.upiId}`, 40, currentY + 11);
        doc.text('Google Pay • PhonePe • Paytm', 40, currentY + 15);
      }
    } catch (e) {
      console.warn('QR code generation inside PDF skipped', e);
    }
  }

  // Official Stamp graphic
  const stampX = 105;
  const stampY = currentY + 11;
  doc.setDrawColor(isPaid ? 16 : 217, isPaid ? 185 : 119, isPaid ? 129 : 6);
  doc.setLineWidth(0.8);
  doc.circle(stampX, stampY, 11, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(isPaid ? 16 : 217, isPaid ? 185 : 119, isPaid ? 129 : 6);
  doc.text('READBENCH', stampX - 8, stampY - 4);
  doc.setFontSize(6.5);
  doc.text(isPaid ? 'PAID IN FULL' : 'PARTIAL DUE', stampX - 9, stampY);
  doc.setFontSize(5.5);
  doc.text(data.dateStr, stampX - 7, stampY + 4);

  // Signature on Right
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(10);
  doc.setTextColor(67, 56, 202);
  doc.text('Authorized Signatory', 160, currentY + 10);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(155, currentY + 13, 195, currentY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Library Administration Officer', 156, currentY + 17);

  // Footer Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer generated official invoice receipt. Valid without physical signature. Thank you for studying with us.',
    25,
    285
  );

  const cleanFileName = `Invoice_${(data.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_')}_${data.receiptNo}.pdf`;
  const blob = doc.output('blob');
  const file = new File([blob], cleanFileName, { type: 'application/pdf' });

  return { doc, blob, file };
}

/**
 * Downloads the generated PDF file directly to the user's device
 */
export async function downloadReceiptPdf(data: InvoicePdfData): Promise<void> {
  const { blob, file } = await createInvoicePdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Normalizes an Indian/international mobile phone number into WhatsApp international format without '+' or leading zeros
 * (e.g. "+91 88094-74959" -> "918809474959", "08809474959" -> "918809474959", "8809474959" -> "918809474959")
 */
export function normalizeWhatsAppNumber(mobile: string): string {
  if (!mobile) return '';
  let digits = mobile.replace(/\D/g, '');
  // Remove leading zeros
  while (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  // Standard Indian 10-digit number -> prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  // Already has country code 91
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

/**
 * Safely opens WhatsApp direct chat for a specific phone number.
 * Uses an anchor element click to guarantee that popup blockers or iframe restrictions
 * don't intercept opening WhatsApp for the exact contact.
 */
export function openDirectWhatsApp(phone: string, message: string): void {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  
  // Direct WhatsApp endpoint targeting the exact number
  const waUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
    : `https://api.whatsapp.com/send?text=${encodedMsg}`;

  // Safe navigation via anchor element to prevent popup-blocker issues inside iframes
  const a = document.createElement('a');
  a.href = waUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Shares the PDF directly on WhatsApp to the student's exact mobile number:
 * 1. Automatically downloads the PDF invoice to the device
 * 2. Opens WhatsApp chat directly targeting that student's mobile number
 * 3. Populates the complete official receipt text with breakdown, seat, and receipt ID
 */
export async function shareReceiptPdfOnWhatsApp(
  data: InvoicePdfData
): Promise<{ method: 'direct-whatsapp'; fileName: string; phone: string }> {
  // 1. Generate the official PDF invoice
  const { blob, file } = await createInvoicePdf(data);

  // 2. Trigger automatic download of the PDF file to user device
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  // 3. Format complete receipt message for WhatsApp
  const cleanPhone = normalizeWhatsAppNumber(data.mobile);
  const statusEmoji = data.totalDue <= 0 ? 'PAID IN FULL ✅' : 'PARTIAL DUE ⏳';

  const summaryText = `🧾 *Official Fee Receipt - ${data.libraryName}*
━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Member:* ${data.studentName}
📞 *Mobile:* ${data.mobile || '—'}
🪑 *Seat:* ${data.seat != null ? `Set #${data.seat}` : 'SNA (General)'}
📋 *Receipt No:* ${data.receiptNo}
📅 *Date:* ${data.dateStr}
━━━━━━━━━━━━━━━━━━━━━━━━
💵 *Monthly Fee:* ₹${data.monthlyFee}
✅ *Amount Paid:* ₹${data.totalPaid}
${data.totalDue > 0 ? `⏳ *Balance Due:* ₹${data.totalDue}` : '✨ *Balance Due:* ₹0 (Paid in Full)'}
📌 *Status:* ${statusEmoji}
━━━━━━━━━━━━━━━━━━━━━━━━
${data.upiId && data.totalDue > 0 ? `💳 *Pay Due via UPI:* ${data.upiId}\n━━━━━━━━━━━━━━━━━━━━━━━━\n` : ''}📎 *Official PDF Receipt (${file.name})* has been downloaded to your device!
🙏 Thank you for studying with ${data.libraryName}! 📚`;

  // 4. Directly open WhatsApp for this student's phone number
  openDirectWhatsApp(data.mobile, summaryText);

  return { method: 'direct-whatsapp', fileName: file.name, phone: cleanPhone };
}
