import React, { useState } from 'react';
import {
  Building2,
  LogIn,
  UserPlus,
  Key,
  Mail,
  Phone,
  BookOpen,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Cloud,
} from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  database,
  ref,
  set,
  get,
} from '../utils/firebase';
import { defaultState, createBlankUserState, saveStoredState, normalizeAppState } from '../utils/initialData';
import { AppState } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (libraryData?: AppState, isDemo?: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('aniketkrooy@gmail.com');
  const [loginPassword, setLoginPassword] = useState('123456');

  // Register Form State
  const [regLibraryName, setRegLibraryName] = useState('ANIKET ROY LIBRARY');
  const [regPhone, setRegPhone] = useState('+918809474959');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to format Firebase errors
  const formatFirebaseError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/user-not-found':
        return 'इस ईमेल से कोई खाता नहीं मिला। कृपया "नया खाता बनाएं" पर क्लिक करें।';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'गलत ईमेल या पासवर्ड। कृपया दोबारा जांचें।';
      case 'auth/email-already-in-use':
        return 'यह ईमेल पहले से रजिस्टर्ड है। कृपया "लॉग इन करें" पर जाएं।';
      case 'auth/weak-password':
        return 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।';
      case 'auth/invalid-email':
        return 'कृपया सही ईमेल दर्ज करें।';
      case 'auth/network-request-failed':
        return 'इंटरनेट कनेक्शन में समस्या है। कृपया नेटवर्क जांचें।';
      default:
        return err?.message || 'प्रमाणीकरण में त्रुटि हुई। कृपया पुनः प्रयास करें।';
    }
  };

  // 1. Direct Firebase Login -> Instantly opens system (with seamless auto-register on first time)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrim = loginEmail.trim();
    if (!emailTrim || !loginPassword) {
      setErrorMessage('कृपया ईमेल और पासवर्ड दर्ज करें।');
      return;
    }

    setIsLoading(true);
    try {
      let userCred;
      let isNewUserCreated = false;

      try {
        userCred = await signInWithEmailAndPassword(auth, emailTrim, loginPassword);
      } catch (signInErr: any) {
        const code = signInErr?.code;
        // If account doesn't exist yet in Firebase (auth/invalid-credential or auth/user-not-found)
        // and password is at least 6 characters, automatically create the account for seamless first-time entry
        if ((code === 'auth/invalid-credential' || code === 'auth/user-not-found') && loginPassword.length >= 6) {
          try {
            userCred = await createUserWithEmailAndPassword(auth, emailTrim, loginPassword);
            isNewUserCreated = true;
          } catch (createErr: any) {
            if (createErr?.code === 'auth/email-already-in-use') {
              console.warn('Wrong password for existing email');
              setErrorMessage('इस ईमेल का पासवर्ड गलत है। कृपया सही पासवर्ड दर्ज करें।');
              return;
            }
            console.warn('Auto-create error:', createErr?.message);
            setErrorMessage(formatFirebaseError(createErr));
            return;
          }
        } else {
          console.warn('Sign in error:', signInErr?.code, signInErr?.message);
          setErrorMessage(formatFirebaseError(signInErr));
          return;
        }
      }

      if (!userCred?.user) {
        setErrorMessage('लॉग इन विफल रहा। कृपया पुनः प्रयास करें।');
        return;
      }

      const uid = userCred.user.uid;

      // Fetch user's direct isolated library data from Firebase Realtime Database
      try {
        const snap = await get(ref(database, `libraries/${uid}`));
        if (snap.exists()) {
          const cloudData = snap.val();
          const normalized = normalizeAppState(cloudData, 'ANIKET ROY LIBRARY', emailTrim);
          saveStoredState(normalized, uid);
          onLoginSuccess(normalized, false);
          return;
        }
      } catch (rtdbErr) {
        console.warn('RTDB read note on login:', rtdbErr);
      }

      // If user had no node yet (e.g. brand new user), create a fresh isolated library for this user
      const defaultLibName = emailTrim.includes('@') ? `${emailTrim.split('@')[0].toUpperCase()} LIBRARY` : 'MY LIBRARY';
      const freshUserState = createBlankUserState(defaultLibName, emailTrim);
      try {
        await set(ref(database, `libraries/${uid}`), freshUserState);
      } catch (err) {
        console.warn('RTDB seed note:', err);
      }
      saveStoredState(freshUserState, uid);
      onLoginSuccess(freshUserState, false);
    } catch (err: any) {
      console.warn('Login note:', err);
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Direct Firebase Account Creation -> Creates 100% UNIQUE isolated library in Firebase
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const libName = regLibraryName.trim();
    const phone = regPhone.trim();
    const email = regEmail.trim();

    if (!libName) {
      setErrorMessage('कृपया अपनी लाइब्रेरी का नाम दर्ज करें।');
      return;
    }
    if (!email) {
      setErrorMessage('कृपया ईमेल आईडी दर्ज करें।');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।');
      return;
    }

    setIsLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, regPassword);
      const uid = userCred.user.uid;

      // Create a brand new, completely isolated library state for this user UID
      // Starting clean with 0 students and 0 fees, exclusively owned by this UID
      const initialLibraryState: AppState = createBlankUserState(libName, email, phone);

      try {
        // Save strictly to libraries/${uid}
        await set(ref(database, `libraries/${uid}`), initialLibraryState);
      } catch (dbErr) {
        console.warn('RTDB write note on register:', dbErr);
      }

      // Cache strictly for this UID
      saveStoredState(initialLibraryState, uid);

      // Directly open system without delay
      onLoginSuccess(initialLibraryState, false);
    } catch (err: any) {
      console.warn('Register note:', err?.code, err?.message);
      setErrorMessage(formatFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Quick 1-Click Guest Access
  const handleQuickDemo = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      try {
        await signInAnonymously(auth);
      } catch (anonErr) {
        console.warn('Anonymous auth note:', anonErr);
      }
      onLoginSuccess(undefined, true);
    } catch (err: any) {
      console.error('Demo error:', err);
      onLoginSuccess(undefined, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative font-sans text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">ReadBench</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">लाइब्रेरी एवं स्टूडेंट मैनेजमेंट सिस्टम</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/80 text-[11px] text-emerald-400 mt-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firebase Cloud Realtime Database</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl">
          {/* Dual Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/70 rounded-2xl mb-5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>लॉग इन (Log In)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>नया खाता (Create)</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/70 text-rose-300 border border-rose-800/80 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* 1. LOGIN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ईमेल पता (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  पासवर्ड (Password)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>कनेक्ट हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>लॉग इन करें और सिस्टम खोलें</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. CREATE ACCOUNT TAB */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  लाइब्रेरी का नाम (Library Name) *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regLibraryName}
                    onChange={(e) => setRegLibraryName(e.target.value)}
                    placeholder="उदा. ANIKET ROY LIBRARY"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  मोबाइल नंबर (Mobile No.)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+918809474959"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ईमेल आईडी (Email) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="library@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  पासवर्ड (Password - कम से कम 6 अक्षर) *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-9 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Firebase में खाता बन रहा है...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>खाता बनाएं और सिस्टम खोलें</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <span className="relative px-3 bg-slate-800 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              या
            </span>
          </div>

          {/* 1-Click Instant Demo Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleQuickDemo}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>⚡ 1-क्लिक डायरेक्ट डेमो (Instant Guest Access)</span>
          </button>
        </div>

        <div className="text-center space-y-1 mt-4">
          <p className="text-[11px] text-emerald-400 font-medium flex items-center justify-center gap-1.5">
            <span>🔒</span>
            <span>100% डेटा आइसोलेशन: आपका डेटा केवल आपके अकाउंट के लिए प्राइवेट रहेगा।</span>
          </p>
          <p className="text-[10px] text-slate-500">
            कोई अन्य यूजर आपका डेटा (स्टूडेंट्स, फीस, सीट्स) नहीं देख सकता।
          </p>
        </div>
      </div>
    </div>
  );
};
