'use client';

import { useUser } from '@/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, Sparkles } from 'lucide-react';
import { LocationAdminPage } from '@/components/location-admin-page';
import { PlaceAdminPage } from '@/components/place-admin-page';
import { MapAdminPage } from '@/components/map-admin-page';
import { CollectionAdminPage } from '@/components/collection-admin-page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/back-button';
import { AdminManagementPage } from '@/components/admin-management-page';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { isAdmin, isSuperAdmin } from '@/lib/admin-helpers';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'motion/react';
import * as React from 'react';

export default function AdminPage() {
  // isUserLoading is for auth state, isProfileLoading is for Firestore profile data
  const { user, isUserLoading, isProfileLoading } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState('places');

  // We are only "done" loading when both are false.
  const isLoading = isUserLoading || isProfileLoading;

  React.useEffect(() => {
    // This effect should ONLY run when loading is fully complete.
    if (isLoading) {
      return; // Do nothing while loading.
    }
    
    // After all loading is done, if there's no user, or they aren't an admin, redirect.
    if (!user || !isAdmin(user.profile)) {
        router.push('/');
    }
  }, [isLoading, user, router]);


  // Show a loading spinner if ANY loading is in progress.
  // This is the gatekeeper that prevents the non-admin redirect from firing too early.
  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
        </div>
        <Loader2 className="h-12 w-12 animate-spin z-10" />
      </div>
    );
  }

  // After loading, if the user still isn't an admin, they are being redirected.
  // Render nothing here while the browser handles the redirection.
  // This prevents the admin page from flashing for non-admin users.
  if (!isAdmin(user?.profile)) {
    return null; 
  }

  const isSuper = isSuperAdmin(user?.profile);


  // Only render the admin content if loading is finished and the user is confirmed to be an admin.
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="flex h-14 items-center justify-between gap-4 px-4 lg:h-[60px] lg:px-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                Admin Panel
                <Sparkles className="w-4 h-4 text-sky-500" />
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2"
            >
              <ThemeToggle />
              <BackButton />
            </motion.div>
          </div>
        </header>
        
        <main className="p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 bg-gray-100/50 dark:bg-gray-700/50">
                {isSuper && (
                  <>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="admins">Admin Management</TabsTrigger>
                  </>
                )}
                <TabsTrigger value="places">Places</TabsTrigger>
                <TabsTrigger value="maps">Maps</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
                <TabsTrigger value="collections">Collections</TabsTrigger>
              </TabsList>
              {isSuper && (
                <>
                  <TabsContent value="analytics">
                    <AnalyticsDashboard />
                  </TabsContent>
                  <TabsContent value="admins">
                    <AdminManagementPage />
                  </TabsContent>
                </>
              )}
              <TabsContent value="places">
                <PlaceAdminPage />
              </TabsContent>
              <TabsContent value="maps">
                <MapAdminPage />
              </TabsContent>
              <TabsContent value="locations">
                <LocationAdminPage />
              </TabsContent>
              <TabsContent value="collections">
                <CollectionAdminPage />
              </TabsContent>
            </Tabs>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
