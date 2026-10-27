import React, { useState } from 'react';
import {
  Building2,
  LogIn,
  UserPlus,
  Key,
  Mail,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Cloud,
} from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  syncStateToFirebase,
  database,
  ref,
  set,
  type User,
} from '../../utils/firebase';
import { defaultState } from '../../utils/initialData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (libraryId: string, email: string, ownerName?: string) => void;
  currentUser?: User | null;
  onSignOut?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  onSignOut,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [libraryName, setLibraryName] = useState('ANIKET ROY LIBRARY');
  const [ownerName, setOwnerName] = useState('Aniket Roy');
  const [email, setEmail] = useState('aniketkrooy@gmail.com');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickAnonymous = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const userCred = await signInAnonymously(auth);
      onLoginSuccess(userCred.user.uid, 'guest-admin@readbench.xyz', libraryName);
      onClose();
    } catch (err: any) {
      console.error('Anonymous sign in error:', err);
      // If anonymous auth is disabled on the project, fall back to demo mode gracefully
      onLoginSuccess('demo-library-id', email.trim(), libraryName);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!libraryName.trim()) {
          throw new Error('Please enter a library name');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCred.user.uid;

        // Initialize library data in Firebase
        const initialLibraryData = {
          ...defaultState,
          header: {
            ...defaultState.header,
            ownerName: libraryName.trim(),
            userName: ownerName.trim() || 'Admin User',
            email: email.trim(),
          },
        };

        await set(ref(database, `libraries/${uid}`), initialLibraryData);
        onLoginSuccess(uid, email.trim(), libraryName.trim());
        onClose();
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        onLoginSuccess(userCred.user.uid, email.trim());
        onClose();
      }
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. If you are new, click "Register new branch" below.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    onLoginSuccess('demo-library-id', 'aniketkrooy@gmail.com', 'ANIKET ROY LIBRARY');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl mx-auto mb-3 shadow-md shadow-indigo-200">
            RB
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            {isRegister ? 'Register Library on Firebase' : 'Sign in to ReadBench'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
            <Cloud className="w-3.5 h-3.5 text-indigo-500" />
            <span>Connected to Firebase Realtime Cloud Database</span>
          </p>
        </div>

        {/* Current Active Account Box */}
        {currentUser ? (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {currentUser.email || (currentUser.isAnonymous ? 'Guest Admin' : 'Active Account')}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-mono">
                    Firebase UID: {currentUser.uid.slice(0, 12)}...
                  </p>
                </div>
              </div>
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-[11px] border border-rose-200 cursor-pointer"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Quick Demo / Anonymous Connection Bar */
          <div className="mb-4 p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="text-[11px] text-indigo-950">
                <span className="font-bold">1-Click Live Cloud Sync</span>
                <p className="text-[10px] text-indigo-700">Connect to Firebase RTDB</p>
              </div>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleQuickAnonymous}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              Connect Now
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-2xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Library / Institute Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={libraryName}
                  onChange={(e) => setLibraryName(e.target.value)}
                  placeholder="e.g. ANIKET ROY LIBRARY"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-medium"
                />
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Owner Full Name
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. Aniket Roy"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="library@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Password *</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs outline-hidden font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all mt-2 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegister ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>
              {isLoading
                ? 'Connecting to Firebase...'
                : isRegister
                ? 'Register & Sync to Firebase'
                : 'Sign In & Auto-Sync'}
            </span>
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMessage(null);
              }}
              className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              {isRegister
                ? 'Already have an account? Sign in here'
                : 'Need a new account? Register library branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
