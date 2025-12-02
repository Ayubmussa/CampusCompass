'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase, useUser } from '@/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const supabase = useSupabase();
  const { user, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isLoadingAuthOrProfile = isUserLoading || isProfileLoading;

  useEffect(() => {
    if (isLoadingAuthOrProfile) {
      return;
    }
    
    if (user) {
      if (user.profile?.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, isLoadingAuthOrProfile, router]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!supabase) {
        setError("Authentication service is not available.");
        return;
    }
    if (!email || !password) {
        setError("Please enter both email and password.");
        return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Check error codes/messages
        const errorMessage = signInError.message?.toLowerCase() || '';
        const errorCode = signInError.status;
        
        // Check if it's an "invalid credentials" error (could be wrong password OR user doesn't exist)
        const isInvalidCredentials = errorCode === 400 && errorMessage.includes('invalid login credentials');
        
        if (isInvalidCredentials) {
            // Try to sign up - this will either:
            // 1. Create the user if they don't exist
            // 2. Fail with "User already registered" if they exist (wrong password)
            try {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) {
                    const signUpMsg = signUpError.message?.toLowerCase() || '';
                    // If user already exists, the original error was wrong password
                    if (signUpMsg.includes('user already registered') || 
                        signUpMsg.includes('already exists') ||
                        signUpMsg.includes('already been registered')) {
                        setError('Invalid password. Please check your password and try again.');
                    } else {
                        setError(signUpError.message || 'An unexpected error occurred during sign up.');
                    }
                    } else if (signUpData?.user) {
                    // User created successfully
                    const isAdmin = email === 'admin@example.com';
                    if (signUpData.user.email_confirmed_at) {
                      toast({ 
                        title: 'Account Created', 
                        description: 'Your account has been created successfully.',
                      });
                      if (isAdmin) {
                        toast({ title: 'Admin Account Created', description: 'You have admin privileges.' });
                      }
                      // Refresh to sync cookies
                      window.location.reload();
                    } else {
                      toast({ 
                        title: 'Please check your email',
                        description: 'We sent you a confirmation email. Please verify your email address to complete sign up.',
                      });
                    }
                }
            } catch (createError: any) {
                setError(createError.message || 'An unexpected error occurred during sign up.');
            }
        } else if (errorMessage.includes('email not confirmed')) {
            // Email confirmation required
            setError('Please check your email and confirm your account before signing in.');
        } else {
            // Other errors (network, server, etc.)
            setError(signInError.message || 'An unexpected error occurred during sign in.');
        }
      } else if (signInData?.user) {
        // Successful sign in
        toast({ title: 'Signed In', description: 'Welcome back!' });
        // Refresh the page to ensure middleware syncs cookies
        window.location.reload();
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.');
    } finally {
        setIsProcessing(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    if (!supabase) {
        setError("Authentication service is not available.");
        return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const { data, error: anonError } = await supabase.auth.signInAnonymously();
      
      if (anonError) {
        setError(anonError.message);
      } else {
        toast({
          title: 'Signed in Anonymously',
          description: 'You can now explore the campus tour.',
        });
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingAuthOrProfile || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-cover bg-center p-4" /*style={{ backgroundImage: "url('/login-background.jpg')"}}*/>
      <div className="absolute inset-0 bg-black/50" />
      <Card className="w-full max-w-sm z-10">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign In</CardTitle>
          <CardDescription>
            Enter email and password to sign in or create an account. Use <strong>admin@example.com</strong> to create an admin account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isProcessing || !supabase}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In / Sign Up
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAnonymousSignIn}
            disabled={isProcessing || !supabase}
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserIcon className="mr-2 h-4 w-4" />
            )}
            Anonymous Sign-In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
