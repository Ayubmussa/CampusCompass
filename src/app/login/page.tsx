'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Loader2, Mail, Lock, Sparkles, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const supabase = useSupabase();
  const { user, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { toast } = useToast();

  const isLoadingAuthOrProfile = isUserLoading || isProfileLoading;
  const redirectTo = searchParams.get('redirect') || '/';
  const sessionExpired = searchParams.get('session') === 'expired';

  useEffect(() => {
    if (isLoadingAuthOrProfile) {
      return;
    }
    
    if (user) {
      if (user.profile?.adminLevel === 'super_admin' || user.profile?.adminLevel === 'sub_admin') {
        router.replace('/admin'); // prevent back navigation to login
      } else {
        router.replace(redirectTo || '/'); // prevent back navigation to login
      }
    }
  }, [user, isLoadingAuthOrProfile, router, redirectTo]);

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
                    const isSuperAdmin = email === 'admin@example.com';
                    if (signUpData.user.email_confirmed_at) {
                      toast({ 
                        title: 'Account Created', 
                        description: 'Your account has been created successfully.',
                      });
                      if (isSuperAdmin) {
                        toast({ title: 'Super Admin Account Created', description: 'You have super admin privileges.' });
                      }
                      // Redirect based on user role or redirect parameter
                      if (isSuperAdmin) {
                        router.replace('/admin');
                      } else {
                        router.replace(redirectTo || '/');
                      }
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
        // Redirect will be handled by useEffect when profile loads
        // The useEffect checks user.profile?.adminLevel
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.');
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-300 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-200 dark:bg-cyan-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-50"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-sky-400/20 dark:bg-sky-400/10 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <CardHeader className="space-y-1 pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            
            <CardTitle className="text-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2"
              >
                <span>Welcome Back</span>
                <Sparkles className="w-5 h-5 text-sky-500" />
              </motion.div>
            </CardTitle>
            
            <CardDescription className="text-center">
              Enter your credentials to continue
            </CardDescription>
            <div className="flex justify-center mt-2">
              <ThemeToggle />
            </div>

            {sessionExpired && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
              >
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                  Your session has expired due to inactivity. Please sign in again to continue.
                </p>
              </motion.div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors" 
                    style={{ color: focusedField === 'email' ? 'rgb(56 189 248)' : undefined }}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isProcessing}
                    className="pl-10 h-12 border-gray-200 dark:border-gray-700 focus:border-sky-400 focus:ring-sky-400 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-colors"
                    style={{ color: focusedField === 'password' ? 'rgb(56 189 248)' : undefined }}
                  />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isProcessing}
                    className="pl-10 h-12 border-gray-200 dark:border-gray-700 focus:border-sky-400 focus:ring-sky-400 transition-all duration-200"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isProcessing || !supabase}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Sign In / Sign Up'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">
                  Secure Authentication
                </span>
              </div>
            </div>
            
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Your credentials are encrypted and secured
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
