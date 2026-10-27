import React, { useState } from 'react';
import {
  Building2,
  QrCode,
  Clock,
  Download,
  Upload,
  User as UserIcon,
  Trash2,
  Save,
  CheckCircle2,
  Smartphone,
  Sparkles,
  Cloud,
  RefreshCw,
  Database,
  ExternalLink,
} from 'lucide-react';
import { HeaderConfig, LibraryConfig, AppState } from '../types';
import { compressToMaxSize } from '../utils/imageCompressor';
import { generateDynamicUpiQr } from '../utils/upi';
import type { User } from '../utils/firebase';

interface SettingsSectionProps {
  header: HeaderConfig;
  library: LibraryConfig;
  fullState: AppState;
  onSaveHeader: (newHeader: HeaderConfig) => void;
  onSaveShifts: (shiftsText: string) => void;
  onSaveTotalSets: (total: number) => void;
  onImportBackup: (importedState: AppState) => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  onSyncToFirebase?: () => Promise<void>;
  onPullFromFirebase?: () => Promise<void>;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  header,
  library,
  fullState,
  onSaveHeader,
  onSaveShifts,
  onSaveTotalSets,
  onImportBackup,
  currentUser,
  onOpenAuth,
  onSignOut,
  onSyncToFirebase,
  onPullFromFirebase,
}) => {
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncMsg, setCloudSyncMsg] = useState<string | null>(null);
  // Local form state
  const [ownerName, setOwnerName] = useState(header.ownerName || '');
  const [address, setAddress] = useState(header.address || '');
  const [phone, setPhone] = useState(header.phone || '');
  const [email, setEmail] = useState(header.email || '');
  const [logoUrl, setLogoUrl] = useState(header.logoUrl || '');
  const [staticQrUrl, setStaticQrUrl] = useState(header.qrCodeUrl || '');
  const [upiId, setUpiId] = useState(header.upiId || '');

  // User Profile
  const [userName, setUserName] = useState(header.userName || '');
  const [userAvatar, setUserAvatar] = useState(header.userAvatar || '');

  // Shifts text
  const initialShiftsText = (library.shifts || []).map((s) => s.label).join('\n');
  const [shiftsText, setShiftsText] = useState(initialShiftsText);
  const [totalSets, setTotalSets] = useState(library.totalSets || 10);

  // Live UPI test QR
  const [testUpiQr, setTestUpiQr] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerNotice({ text, type });
    setTimeout(() => setBannerNotice(null), 4000);
  };

  // Logo file upload with 15KB compression
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressToMaxSize(file, 15);
      setLogoUrl(compressed);
      notify('✅ Logo image uploaded and compressed successfully!');
    } catch (err) {
      notify('Error compressing image: ' + (err as Error).message, 'error');
    }
  };

  // Static QR file upload
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressToMaxSize(file, 20);
      setStaticQrUrl(compressed);
      notify('✅ UPI QR image uploaded successfully!');
    } catch (err) {
      notify('Error reading QR file: ' + (err as Error).message, 'error');
    }
  };

  // User Avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressToMaxSize(file, 15);
      setUserAvatar(compressed);
      notify('✅ Profile avatar uploaded successfully!');
    } catch (err) {
      notify('Error compressing avatar: ' + (err as Error).message, 'error');
    }
  };

  // Test UPI QR generation
  const handleTestUpi = async () => {
    if (!upiId) {
      notify('Please enter a valid UPI ID first', 'error');
      return;
    }
    const qr = await generateDynamicUpiQr(upiId, ownerName || 'Library', 100);
    setTestUpiQr(qr);
  };

  const handleSaveHeaderData = () => {
    const updated: HeaderConfig = {
      ...header,
      ownerName: ownerName.trim() || 'ReadBench Library',
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      logoUrl,
      qrCodeUrl: staticQrUrl,
      upiId: upiId.trim(),
      userName: userName.trim() || 'Admin User',
      userAvatar,
    };
    onSaveHeader(updated);
    notify('✅ Library & Header profile settings saved successfully!');
  };

  // Export full JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `readbench_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.students && parsed.library) {
          onImportBackup(parsed);
          notify('✅ Backup restored successfully!');
        } else {
          notify('❌ Invalid backup JSON file format.', 'error');
        }
      } catch (err) {
        notify('❌ Error reading JSON backup: ' + (err as Error).message, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-8 text-xs">
      {/* Banner notification */}
      {bannerNotice && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            bannerNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bannerNotice.text}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Library Configuration & Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage library branding, dynamic UPI payments, shift timings, and data backup.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* 1. Header & Branding Customization */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Library Branding & Contact</span>
            </h3>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Owner / Library Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. ANIKET ROY LIBRARY"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Library Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Gandhi Chowk, Station Road, Patna"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+918809474959"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="library@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden"
                />
              </div>
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Library Logo (Auto-compressed &lt;15KB)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">No logo</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold cursor-pointer text-slate-700">
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Static QR upload */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Static Standee QR Code (Optional for receipts)
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {staticQrUrl ? (
                    <img src={staticQrUrl} alt="QR preview" className="w-full h-full object-cover" />
                  ) : (
                    <QrCode className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold cursor-pointer text-slate-700">
                    Upload Standee QR
                    <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                  </label>
                  {staticQrUrl && (
                    <button
                      type="button"
                      onClick={() => setStaticQrUrl('')}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveHeaderData}
              className="mt-3 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Library Details</span>
            </button>
          </div>
        </div>

        {/* 2. Dynamic UPI QR Payment Configuration */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Dynamic UPI QR Payments</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Zero Transaction Fee
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Library Owner UPI ID (VPA)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. 8809474959@paytm or library@okhdfcbank"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-mono font-bold text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Students scan this QR to pay directly to your bank account via PhonePe, Google Pay, or Paytm.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleTestUpi}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Generate Test QR (₹100)</span>
              </button>

              <button
                onClick={handleSaveHeaderData}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Save UPI ID
              </button>
            </div>

            {testUpiQr && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                <p className="text-[11px] font-bold text-slate-700 mb-2">Live Test QR for ₹100</p>
                <img src={testUpiQr} alt="Test UPI QR" className="w-36 h-36 rounded-xl border shadow-sm" />
                <p className="text-[10px] text-slate-400 mt-2 font-mono">{upiId}</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Shifts & Timings Configuration */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Library Shifts & Capacity</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Shift Timings (One shift per line)
              </label>
              <textarea
                rows={4}
                value={shiftsText}
                onChange={(e) => setShiftsText(e.target.value)}
                placeholder="6AM-10AM&#10;10AM-2PM&#10;2PM-6PM&#10;6PM-10PM"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Edit shifts to match your library opening timings.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Total Library Sets / Desks
              </label>
              <input
                type="number"
                min={1}
                max={250}
                value={totalSets}
                onChange={(e) => setTotalSets(parseInt(e.target.value) || 1)}
                className="w-32 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-bold"
              />
            </div>

            <button
              onClick={() => {
                onSaveShifts(shiftsText);
                onSaveTotalSets(totalSets);
                notify('✅ Shifts and capacity updated successfully!');
              }}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Shifts & Sets</span>
            </button>
          </div>
        </div>

        {/* 4. User Profile & Account */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              <span>Admin Profile</span>
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Admin Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Aniket Roy"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Admin Avatar
              </label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <label className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold cursor-pointer text-slate-700">
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveHeaderData}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
            >
              Update Profile
            </button>
          </div>
        </div>

        {/* 5. Firebase Realtime Cloud Database Card (Full row) */}
        <div className="md:col-span-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Firebase Realtime Cloud Database</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Synchronizes all students, shift seats, payment records, and receipts in real time across devices.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  लॉग आउट (Log Out)
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Firebase Project</span>
              <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 block truncate">
                student-management-syste-205c4
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Realtime Cloud DB</span>
              <span className="text-xs font-semibold text-emerald-700 mt-0.5 block flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Direct Auto-Sync Active
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Account</span>
              <span className="text-xs font-semibold text-slate-800 mt-0.5 block truncate">
                {currentUser?.email || (currentUser?.isAnonymous ? 'Guest Admin' : 'Connected')}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Isolation Path</span>
              <span className="text-xs font-mono font-bold text-indigo-700 mt-0.5 block truncate" title={`libraries/${currentUser?.uid || 'guest'}`}>
                libraries/{currentUser?.uid ? `${currentUser.uid.slice(0, 10)}...` : 'guest'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">🔒 100% डेटा आइसोलेशन और प्राइवेसी सक्रिय:</p>
              <p className="text-[11px] text-emerald-800">
                हर अकाउंट का डेटा पूरी तरह अलग और यूनिक है। कोई अन्य यूजर आपका डेटा (छात्र, सीट्स, फीस रिकॉर्ड्स) कभी नहीं देख सकता। सिर्फ आप ही अपने इस लाइब्रेरी अकाउंट को मैनेज कर सकते हैं।
              </p>
            </div>
          </div>
        </div>

        {/* 6. Data Backup (Export / Import) & PWA banner (Full row) */}
        <div className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-3xl border border-indigo-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Backup & Data Migration</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Download your entire library database (students, shifts, fee history) as JSON or restore anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export JSON Backup</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-200">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore from JSON</span>
              <input type="file" accept="application/json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
