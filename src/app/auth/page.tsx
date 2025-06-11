'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, error, signIn, signUp, resetPassword, clearError, initialize } = useAuthStore();
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
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error,
      });
    }
  }, [error, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      if (isResetPassword) {
        await resetPassword(formData.email);
        setResetEmailSent(true);
        toast({
          title: "Password Reset Email Sent",
          description: "Please check your email for instructions to reset your password.",
        });
        return;
      }

      if (isLogin) {
        await signIn(formData.email, formData.password);
        toast({
          title: "Success",
          description: "You have been signed in successfully.",
        });
      } else {
        await signUp(formData.email, formData.password, formData.name);
        toast({
          title: "Success",
          description: "Your account has been created successfully.",
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const renderForm = () => {
    if (resetEmailSent) {
      return (
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
          <p className="text-gray-600">
            We've sent a password reset link to {formData.email}
          </p>
          <button
            onClick={() => {
              setIsResetPassword(false);
              setResetEmailSent(false);
            }}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Back to sign in
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && !isResetPassword && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              disabled={isSubmitting}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
            disabled={isSubmitting}
          />
        </div>

        {!isResetPassword && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              disabled={isSubmitting}
              minLength={6}
            />
          </div>
        )}

        {isLogin && !isResetPassword && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsResetPassword(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
              disabled={isSubmitting}
            >
              Forgot your password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isResetPassword ? 'Sending...' : isLogin ? 'Signing in...' : 'Creating account...'}
            </div>
          ) : (
            isResetPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setIsResetPassword(false);
              setResetEmailSent(false);
              clearError();
            }}
            className="text-sm text-indigo-600 hover:text-indigo-500"
            disabled={isSubmitting}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to home
        </button>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isResetPassword ? 'Reset Password' : isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}
