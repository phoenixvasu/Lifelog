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
  reload,
  sendEmailVerification,
  applyActionCode,
  checkActionCode
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  verificationEmailSent: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (actionCode: string) => Promise<void>;
  clearError: () => void;
  clearVerificationEmailSent: () => void;
  initialize: () => () => void;
}

const handleAuthError = (error: unknown) => {
  console.error('Firebase Auth Error:', error);
  if (error instanceof Error) {
    const authError = error as AuthError;
    switch (authError.code) {
      // Sign Up Errors
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in or use a different email address.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address (e.g., name@example.com).';
      case 'auth/operation-not-allowed':
        return 'Email/password sign up is currently disabled. Please contact support for assistance.';
      case 'auth/weak-password':
        return 'Your password is too weak. Please use at least 6 characters with a mix of letters, numbers, and symbols.';
      
      // Sign In Errors
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support for assistance.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please check your email or sign up for a new account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or use the "Forgot Password" option.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      
      // Rate Limiting & Network Errors
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a few minutes before trying again or reset your password.';
      case 'auth/network-request-failed':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      
      // Email Verification Errors
      case 'auth/expired-action-code':
        return 'The verification link has expired. Please request a new verification email.';
      case 'auth/invalid-action-code':
        return 'The verification link is invalid or has already been used. Please request a new verification email.';
      
      // Password Reset Errors
      case 'auth/missing-email':
        return 'Please enter your email address to reset your password.';
      
      // General Errors
      case 'auth/popup-closed-by-user':
        return 'The sign-in popup was closed before completing the process. Please try again.';
      case 'auth/popup-blocked':
        return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/cancelled-popup-request':
        return 'The sign-in process was cancelled. Please try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email but different sign-in credentials. Please try a different sign-in method.';
      
      // Custom Errors
      case 'auth/email-not-verified':
        return 'Please verify your email address before signing in. Check your inbox for the verification link.';
      case 'auth/verification-email-sent':
        return 'A verification email has been sent. Please check your inbox and verify your email address.';
      case 'auth/verification-email-failed':
        return 'Failed to send verification email. Please try again or contact support.';
      
      // Permission Errors
      case 'permission-denied':
        return 'You do not have permission to perform this action. Please contact support if you believe this is an error.';
      
      default:
        // For unknown errors, provide a more helpful message
        if (authError.message.includes('email')) {
          return 'There was an issue with your email. Please check the format and try again.';
        } else if (authError.message.includes('password')) {
          return 'There was an issue with your password. Please ensure it meets the requirements and try again.';
        } else if (authError.message.includes('network')) {
          return 'Network error. Please check your internet connection and try again.';
        }
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
};

const createUserDocument = async (user: User, name: string) => {
  const userRef = doc(db, 'users', user.uid);
  const userData = {
    email: user.email,
    name,
    emailVerified: user.emailVerified,
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
  verificationEmailSent: false,

  signUp: async (email: string, password: string, name: string) => {
    try {
      set({ loading: true, error: null });
      console.log('Attempting to create user account...', { email, name });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address (e.g., name@example.com).');
      }

      // Check if email already exists
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods && methods.length > 0) {
        throw new Error('This email is already registered. Please sign in or use a different email address.');
      }

      // Validate password strength
      if (password.length < 6) {
        throw new Error('Password should be at least 6 characters long. For better security, use a mix of letters, numbers, and symbols.');
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        // Set displayName in Firebase Auth profile
        await updateProfile(user, { displayName: name });
        
        // Send verification email
        await sendEmailVerification(user);
        set({ verificationEmailSent: true });

        // Create user document
        await createUserDocument(user, name);

        // Sign out the user until they verify their email
        await firebaseSignOut(auth);
        set({ user: null, loading: false });
      } catch (error) {
        // If anything fails after user creation, clean up
        console.error('Error during user setup:', error);
        await firebaseSignOut(auth);
        throw new Error('Failed to complete account setup. Please try again or contact support.');
      }

    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = handleAuthError(error);
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      console.log('Attempting to sign in...', { email });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address (e.g., name@example.com).');
      }

      // Validate password
      if (!password || password.length < 6) {
        throw new Error('Please enter your password.');
      }

      // Attempt sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        await firebaseSignOut(auth);
        // Try to resend verification email
        try {
          await sendEmailVerification(user);
          throw new Error('Please verify your email before signing in. A new verification link has been sent to your inbox.');
        } catch (verificationError) {
          throw new Error('Please verify your email before signing in. Check your inbox for the verification link or request a new one.');
        }
      }

      // Update last login time
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          emailVerified: user.emailVerified
        });
      } catch (updateError) {
        console.error('Error updating last login:', updateError);
        // Don't throw error here, as the user is still signed in
      }

      console.log('Sign in successful:', { uid: user.uid, email: user.email });
      set({ user, loading: false });
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = handleAuthError(error);
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
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

  sendVerificationEmail: async () => {
    try {
      set({ loading: true, error: null });
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No user is currently signed in.');
      }

      if (user.emailVerified) {
        throw new Error('Email is already verified.');
      }

      await sendEmailVerification(user);
      set({ verificationEmailSent: true, loading: false });
    } catch (error) {
      console.error('Send verification email error:', error);
      set({ error: handleAuthError(error), loading: false });
      throw error;
    }
  },

  verifyEmail: async (actionCode: string) => {
    try {
      set({ loading: true, error: null });
      
      // Verify the action code
      await checkActionCode(auth, actionCode);
      
      // Apply the email verification code
      await applyActionCode(auth, actionCode);
      
      // Get the user
      const user = auth.currentUser;
      if (user) {
        // Reload the user to get the updated emailVerified status
        await reload(user);
        
        // Update the user document
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          emailVerified: user.emailVerified
        });
        
        set({ user, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Verify email error:', error);
      set({ error: handleAuthError(error), loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  
  clearVerificationEmailSent: () => set({ verificationEmailSent: false }),

  initialize: () => {
    console.log('Initializing auth state...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Reload user to get the latest emailVerified status
        await reload(user);
        
        // Only set user if email is verified
        if (user.emailVerified) {
          set({ user: auth.currentUser, loading: false });
        } else {
          // If email is not verified, sign out and clear user state
          await firebaseSignOut(auth);
          set({ user: null, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    });
    return unsubscribe;
  }
}));