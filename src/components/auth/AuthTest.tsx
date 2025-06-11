'use client';

import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';

export default function AuthTest() {
  const { user, signIn, signUp, signOut } = useAuthStore();

  const handleSignIn = async () => {
    try {
      await signIn('test@example.com', 'password123');
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignUp = async () => {
    try {
      await signUp('test@example.com', 'password123', 'Test User');
    } catch (error) {
      console.error('Sign up error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Auth Test</h2>
        <p>Current user: {user ? user.email : 'None'}</p>
      </div>

      <div className="space-x-4">
        <Button onClick={handleSignIn}>Sign In</Button>
        <Button onClick={handleSignUp}>Sign Up</Button>
        <Button onClick={signOut}>Sign Out</Button>
      </div>
    </div>
  );
} 