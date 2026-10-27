import QRCode from 'qrcode';

/**
 * Builds standard UPI payment intent string:
 * upi://pay?pa=<UPI_ID>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR
 */
export function buildUpiUri(upiId: string, payeeName: string, amount: number | string): string {
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(payeeName.trim() || 'Library Management');
  const cleanAmount = typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount || '0').toFixed(2);

  return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${cleanName}&am=${cleanAmount}&cu=INR`;
}

/**
 * Generates dynamic QR code data URL (offline-capable)
 */
export async function generateDynamicUpiQr(
  upiId: string,
  payeeName: string,
  amount: number | string
): Promise<string | null> {
  if (!upiId || !upiId.trim()) return null;
  const amt = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(amt) || amt <= 0) return null;

  const upiUrl = buildUpiUri(upiId, payeeName, amt);

  try {
    const dataUrl = await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (error) {
    console.warn('Local QRCode generator failed, falling back to online server', error);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;
  }
}
