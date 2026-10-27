import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  off,
  Database,
  DataSnapshot,
} from 'firebase/database';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  User,
  Auth,
} from 'firebase/auth';
import { AppState, Student, StudentFee, HeaderConfig, LibraryConfig } from '../types';

export const firebaseConfig = {
  apiKey: 'AIzaSyCKPxqUsdJDTtaKCWTZB6shqKXF43f3eBg',
  authDomain: 'student-management-syste-205c4.firebaseapp.com',
  databaseURL: 'https://student-management-syste-205c4-default-rtdb.firebaseio.com',
  projectId: 'student-management-syste-205c4',
  storageBucket: 'student-management-syste-205c4.firebasestorage.app',
  messagingSenderId: '482114689921',
  appId: '1:482114689921:web:e5187835b7c7f8de1c2680',
};

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const database: Database = getDatabase(app);
export const auth: Auth = getAuth(app);

/**
 * Saves complete state to Firebase Realtime Database
 */
export async function syncStateToFirebase(libraryId: string, state: AppState): Promise<void> {
  if (!libraryId) return;
  try {
    const libRef = ref(database, `libraries/${libraryId}`);
    await set(libRef, {
      students: state.students || [],
      fees: state.fees || {},
      library: state.library,
      header: state.header,
      monthlyCollectionByYear: state.monthlyCollectionByYear || {},
      subscriptionExpiry: state.subscriptionExpiry || null,
      subscriptionPlan: state.subscriptionPlan || null,
      subscriptionHistory: state.subscriptionHistory || [],
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Failed to sync state to Firebase:', error);
  }
}

/**
 * Saves subscription data specifically
 */
export async function syncSubscriptionToFirebase(
  libraryId: string,
  subscriptionExpiry: string,
  subscriptionPlan: string,
  subscriptionHistory: any[]
): Promise<void> {
  if (!libraryId) return;
  try {
    await set(ref(database, `libraries/${libraryId}/subscriptionExpiry`), subscriptionExpiry);
    await set(ref(database, `libraries/${libraryId}/subscriptionPlan`), subscriptionPlan);
    await set(ref(database, `libraries/${libraryId}/subscriptionHistory`), subscriptionHistory);
  } catch (err) {
    console.warn('Failed to sync subscription to Firebase:', err);
  }
}


/**
 * Saves students specifically
 */
export async function syncStudentsToFirebase(libraryId: string, students: Student[]): Promise<void> {
  if (!libraryId) return;
  try {
    await set(ref(database, `libraries/${libraryId}/students`), students);
  } catch (err) {
    console.warn('Failed to sync students to Firebase:', err);
  }
}

/**
 * Saves fees specifically
 */
export async function syncFeesToFirebase(libraryId: string, fees: Record<string, StudentFee>): Promise<void> {
  if (!libraryId) return;
  try {
    await set(ref(database, `libraries/${libraryId}/fees`), fees);
  } catch (err) {
    console.warn('Failed to sync fees to Firebase:', err);
  }
}

/**
 * Saves header specifically
 */
export async function syncHeaderToFirebase(libraryId: string, header: HeaderConfig): Promise<void> {
  if (!libraryId) return;
  try {
    await set(ref(database, `libraries/${libraryId}/header`), header);
  } catch (err) {
    console.warn('Failed to sync header to Firebase:', err);
  }
}

/**
 * Saves library settings specifically
 */
export async function syncLibraryConfigToFirebase(libraryId: string, library: LibraryConfig): Promise<void> {
  if (!libraryId) return;
  try {
    await set(ref(database, `libraries/${libraryId}/library`), library);
  } catch (err) {
    console.warn('Failed to sync library config to Firebase:', err);
  }
}

/**
 * Saves monthly collection specifically
 */
export async function syncMonthlyCollectionToFirebase(
  libraryId: string,
  monthlyCollectionByYear: Record<string, number[]>
): Promise<void> {
  if (!libraryId) return;
  try {
    await set(ref(database, `libraries/${libraryId}/monthlyCollectionByYear`), monthlyCollectionByYear);
  } catch (err) {
    console.warn('Failed to sync monthly collection to Firebase:', err);
  }
}

/**
 * Loads library data from Firebase Realtime Database
 */
export async function loadLibraryFromFirebase(libraryId: string): Promise<AppState | null> {
  if (!libraryId) return null;
  try {
    const snapshot = await get(ref(database, `libraries/${libraryId}`));
    if (snapshot.exists()) {
      return snapshot.val() as AppState;
    }
    return null;
  } catch (err) {
    console.warn('Failed to load from Firebase Realtime Database:', err);
    return null;
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
  ref,
  set,
  get,
  onValue,
  off,
};
export type { User };
