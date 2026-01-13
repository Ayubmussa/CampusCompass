'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useUser } from '@/supabase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Shield, 
  Zap, 
  Users, 
  MapPin, 
  TrendingUp, 
  Star,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Globe,
  Camera,
  Map,
  Wand2,
  Building2,
  Eye
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, isUserLoading, isProfileLoading } = useUser();
  const [particles, setParticles] = useState<Array<{ left: string; top: string }>>([]);

  const isLoading = isUserLoading || isProfileLoading;

  // Generate particle positions only on client to avoid hydration mismatch
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }))
    );
  }, []);

  // Redirect authenticated users away from landing page
  // Landing page is only for unauthenticated users
  useEffect(() => {
    if (isLoading) return;
    
    if (user) {
      // If user is authenticated (any role), redirect based on their role
      if (user.profile?.adminLevel === 'super_admin' || user.profile?.adminLevel === 'sub_admin') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [user, isLoading, router]);

  const handleGetStarted = () => {
    router.push('/login');
  };

  // Show loading while checking authentication
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

  // If user is authenticated, show loading (redirect will happen)
  if (user) {
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

  const features = [
    {
      icon: Eye,
      title: "360° Panoramic Views",
      description: "Immerse yourself in stunning 360° panoramic views of locations with interactive navigation and hotspots.",
      color: "from-sky-400 to-blue-500"
    },
    {
      icon: Map,
      title: "Interactive Map View",
      description: "Explore locations through detailed map views with zoom, pan, and fullscreen capabilities.",
      color: "from-cyan-400 to-sky-500"
    },
    {
      icon: Wand2,
      title: "AI-Powered Tours",
      description: "Get personalized tour recommendations powered by AI based on your interests and preferences.",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: Building2,
      title: "Multiple Places",
      description: "Explore multiple places and locations, each with unique collections and virtual experiences.",
      color: "from-sky-500 to-blue-600"
    },
    {
      icon: Camera,
      title: "Rich Media Content",
      description: "Experience locations with videos, audio guides, and detailed information about each place.",
      color: "from-cyan-500 to-sky-600"
    },
    {
      icon: Globe,
      title: "Accessible Anywhere",
      description: "Access your virtual tours from anywhere, on any device, at any time.",
      color: "from-blue-500 to-cyan-600"
    }
  ];

  const benefits = [
    "Explore locations before visiting in person",
    "AI-powered personalized tour recommendations",
    "Save and revisit your favorite tours",
    "Detailed location information and metadata",
    "Interactive navigation with hotspots",
    "Mobile-friendly responsive design"
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300 dark:bg-blue-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
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
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-300 dark:bg-sky-900/30 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70"
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
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-200 dark:bg-cyan-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-50"
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
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-sky-400/20 dark:bg-sky-400/10 rounded-full"
          style={{
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10">
        {/* Header with Theme Toggle */}
        <header className="container mx-auto px-4 pt-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-headline text-xl font-bold flex items-center gap-2">
                Virtuality
                <Sparkles className="w-5 h-5 text-sky-500" />
              </h1>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ThemeToggle />
            </motion.div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 dark:bg-sky-900/30 rounded-full mb-6 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-sm text-sky-700 dark:text-sky-300">Explore places in immersive 360° virtual tours</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold mb-6 bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
                Experience Places Like Never Before
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Discover locations through interactive 360° panoramas, AI-powered tour recommendations, and immersive virtual experiences. Explore before you visit.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                onClick={handleGetStarted}
                className="h-14 px-8 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                variant="outline"
                className="h-14 px-8 border-2 border-sky-400 dark:border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all duration-200"
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto"
            >
              {[
                { value: "360°", label: "Panoramic Views" },
                { value: "AI", label: "Tour Guide" },
                { value: "24/7", label: "Access" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4 bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
              Powerful Features for Virtual Exploration
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to explore and discover places through immersive virtual experiences.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-headline font-semibold mb-2 text-gray-900 dark:text-gray-100">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefits Section 
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-0 shadow-2xl backdrop-blur-sm bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full mb-6 shadow-sm">
                        <Star className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <span className="text-sm text-sky-700 dark:text-sky-300">Premium Experience</span>
                      </div>
                      
                      <h2 className="text-3xl font-headline font-bold mb-4 text-sky-900 dark:text-sky-100">
                        Why Choose Virtuality?
                      </h2>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Join users who are exploring places in new ways with our immersive virtual tour platform.
                      </p>

                      <Button
                        onClick={handleGetStarted}
                        className="h-12 px-6 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Start Exploring
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {benefits.map((benefit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                        >
                          <CheckCircle2 className="w-5 h-5 text-sky-500 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>*/}

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Card className="border-0 shadow-2xl backdrop-blur-sm bg-gradient-to-br from-sky-400 to-blue-600 text-white overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm"
                >
                  <MapPin className="w-8 h-8 text-white" />
                </motion.div>

                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4 text-white">
                  Ready to Start Your Virtual Journey?
                </h2>
                
                <p className="text-xl text-sky-50 mb-8 max-w-2xl mx-auto">
                  Join users exploring places through immersive 360° virtual tours and AI-powered recommendations.
                </p>

                <Button
                  onClick={handleGetStarted}
                  className="h-14 px-8 bg-white text-sky-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <p className="mt-4 text-sm text-sky-100">
                  Free to explore • No credit card required
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-sky-100 dark:border-gray-800">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2025 Virtuality. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

