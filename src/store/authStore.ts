import { create } from 'zustand';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  AuthError,
  updateProfile,
  reload
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initialize: () => () => void;
}

const handleAuthError = (error: unknown) => {
  console.error('Firebase Auth Error:', error);
  if (error instanceof Error) {
    const authError = error as AuthError;
    switch (authError.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'permission-denied':
        return 'Permission denied. Please try again or contact support.';
      default:
        return `Authentication error: ${authError.message}`;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};

const createUserDocument = async (user: User, name: string) => {
  const userRef = doc(db, 'users', user.uid);
  const userData = {
    email: user.email,
    name,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    preferences: {
      theme: 'light',
      notifications: {
        enabled: false,
        dailyReminders: false,
        weeklyDigest: false,
        achievements: false,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '07:00'
        }
      }
    }
  };

  try {
    await setDoc(userRef, userData);
    console.log('User document created successfully:', { uid: user.uid });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new Error('Failed to create user profile. Please try again.');
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  signUp: async (email: string, password: string, name: string) => {
    try {
      set({ loading: true, error: null });
      console.log('Attempting to create user account...', { email, name });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.');
      }

      // Check if email already exists
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        throw new Error('This email is already registered. Please sign in instead.');
      }

      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password should be at least 6 characters long.');
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set displayName in Firebase Auth profile
      await updateProfile(user, { displayName: name });
      await reload(user); // reloads the user
      const updatedUser = auth.currentUser; // get the latest user with displayName

      // Create user document
      if (!updatedUser) {
        throw new Error('Failed to retrieve user after sign up.');
      }
      await createUserDocument(updatedUser, name);

      set({ user: updatedUser, loading: false }); // set the updated user in store
    } catch (error) {
      console.error('Sign up error:', error);
      set({ error: handleAuthError(error), loading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      console.log('Attempting to sign in...', { email });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.');
      }

      // Attempt sign in directly
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login time
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });

      console.log('Sign in successful:', { uid: user.uid, email: user.email });
      set({ user, loading: false });
    } catch (error) {
      console.error('Sign in error:', error);
      set({ error: handleAuthError(error), loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await firebaseSignOut(auth);
      set({ user: null, loading: false });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ error: handleAuthError(error), loading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ loading: true, error: null });
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address.');
      }

      // Check if email exists
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (!methods || methods.length === 0) {
        throw new Error('No account found with this email. Please sign up first.');
      }

      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (error) {
      console.error('Reset password error:', error);
      set({ error: handleAuthError(error), loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  initialize: () => {
    console.log('Initializing auth state...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
    return unsubscribe;
  }
}));