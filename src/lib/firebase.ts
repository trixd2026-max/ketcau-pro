/**
 * Firebase Auth — bật khi có đủ biến môi trường VITE_FIREBASE_*
 * Không cấu hình → app dùng auth local (localStorage) như cũ.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.authDomain && config.projectId && config.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(config as Required<typeof config>);
  auth = getAuth(app);
}

export { auth, app };

export async function fbLogin(email: string, password: string) {
  if (!auth) throw new Error('Firebase chưa cấu hình');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function fbRegister(name: string, email: string, password: string) {
  if (!auth) throw new Error('Firebase chưa cấu hình');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred.user;
}

export async function fbLogout() {
  if (!auth) return;
  await signOut(auth);
}

export function fbOnAuth(cb: (user: FirebaseUser | null) => void) {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

export function mapFirebaseUser(u: FirebaseUser) {
  return {
    id: u.uid,
    email: u.email || '',
    name: u.displayName || u.email?.split('@')[0] || 'User',
    createdAt: u.metadata.creationTime || new Date().toISOString(),
    provider: 'firebase' as const,
  };
}
