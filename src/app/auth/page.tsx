'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Loader2, Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Separate the main auth component
function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    user, 
    loading, 
    error, 
    signIn, 
    signUp, 
    resetPassword, 
    clearError, 
    initialize,
    verificationEmailSent,
    sendVerificationEmail,
    verifyEmail,
    clearVerificationEmailSent
  } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (error) {
      // Removed toast notification for authentication error
    }
  }, [error]);

  // Handle email verification
  useEffect(() => {
    const actionCode = searchParams.get('oobCode');
    if (actionCode) {
      handleEmailVerification(actionCode);
    }
  }, [searchParams]);

  const handleEmailVerification = async (actionCode: string) => {
    try {
      setIsSubmitting(true);
      await verifyEmail(actionCode);
      setIsLogin(true);
      router.push('/auth');
    } catch (error) {
      console.error('Email verification error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      if (isResetPassword) {
        await resetPassword(formData.email);
        setResetEmailSent(true);
        return;
      }

      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.name);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (error) {
      clearError();
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderVerificationSent = () => (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
          <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Check your email</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We've sent a verification link to {formData.email}. Please click the link to verify your account.
      </p>
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={() => {
            clearError();
            clearVerificationEmailSent();
            setIsLogin(true);
            setFormData({ email: '', password: '', name: '' });
          }}
          className="w-full"
        >
          Back to sign in
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            try {
              await sendVerificationEmail();
            } catch (error) {
              console.error('Resend verification email error:', error);
            }
          }}
          className="w-full text-purple-600 dark:text-purple-400"
        >
          Resend verification email
        </Button>
      </div>
    </div>
  );

  const renderError = () => {
    if (!error) return null;

    // Determine if the error is related to email verification
    const isVerificationError = error.toLowerCase().includes('verify your email');
    const isPasswordResetError = error.toLowerCase().includes('reset your password');

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription className="flex items-start justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-2 p-1 hover:bg-destructive/10 rounded-full transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </AlertDescription>
        {isVerificationError && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await sendVerificationEmail();
                } catch (error) {
                  console.error('Resend verification email error:', error);
                }
              }}
              className="text-sm"
            >
              Resend Verification Email
            </Button>
          </div>
        )}
        {isPasswordResetError && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsResetPassword(true);
                clearError();
              }}
              className="text-sm"
            >
              Reset Password
            </Button>
          </div>
        )}
      </Alert>
    );
  };

  const renderForm = () => {
    useEffect(() => {
      clearError();
    }, [isLogin, isResetPassword, verificationEmailSent, resetEmailSent]);

    if (verificationEmailSent) {
      return renderVerificationSent();
    }

    if (resetEmailSent) {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
              <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Check your email</h3>
          <p className="text-gray-600 dark:text-gray-400">
            We've sent a password reset link to {formData.email}
          </p>
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPassword(false);
                setResetEmailSent(false);
                clearError();
              }}
              className="w-full"
            >
              Back to sign in
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                try {
                  await resetPassword(formData.email);
                } catch (error) {
                  console.error('Resend reset email error:', error);
                }
              }}
              className="w-full text-purple-600 dark:text-purple-400"
            >
              Resend reset link
            </Button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {renderError()}
        
        {!isLogin && !isResetPassword && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:focus:border-purple-400 dark:focus:ring-purple-400 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={isSubmitting}
              placeholder="Enter your full name"
              minLength={2}
              maxLength={50}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:focus:border-purple-400 dark:focus:ring-purple-400 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            required
            disabled={isSubmitting}
            placeholder="name@example.com"
            autoComplete="email"
          />
        </div>

        {!isResetPassword && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:focus:border-purple-400 dark:focus:ring-purple-400 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={isSubmitting}
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? "Enter your password" : "Create a password (min. 6 characters)"}
            />
            {!isLogin && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Use at least 6 characters with a mix of letters, numbers, and symbols
              </p>
            )}
          </div>
        )}

        {isLogin && !isResetPassword && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsResetPassword(true);
                clearError();
              }}
              className="text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Forgot your password?
            </button>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting || loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isResetPassword ? 'Sending...' : isLogin ? 'Signing in...' : 'Creating account...'}
            </div>
          ) : (
            isResetPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'
          )}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setIsResetPassword(false);
              setResetEmailSent(false);
              clearError();
              clearVerificationEmailSent();
            }}
            className="text-sm text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </Button>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {isResetPassword ? 'Reset Password' : isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderForm()}
        </Card>
      </div>
    </div>
  );
}

// Loading component for Suspense
function AuthPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageLoading />}>
      <AuthPageContent />
    </Suspense>
  );
}
