'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../lib/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchSettings();
    
    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    setIsOpen(false);
    router.push('/login');
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Navigation links
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', color: 'from-blue-400 to-cyan-400' },
    { href: '/payments', label: 'Records', color: 'from-purple-400 to-pink-400' },
    { href: '/reports', label: 'Reports', color: 'from-orange-400 to-red-400' },
  ];

  const logoVariants = {
    animate: {
      rotate: [0, 5, -5, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const sparkleVariants = {
    animate: {
      scale: [1, 1.3, 1],
      rotate: [0, 180, 360],
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl shadow-2xl shadow-purple-500/20' 
          : 'bg-gradient-to-r from-slate-900/80 via-purple-900/80 to-slate-900/80 backdrop-blur-lg shadow-lg'
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            background: [
              'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
      </div>

      <div className="relative container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and App Title */}
          <Link href="/dashboard" className="flex items-center gap-4 group relative">
            <div className="relative">
              {isLoading ? (
                <div className="h-16 w-16 bg-gradient-to-br from-purple-300 to-pink-300 rounded-2xl animate-pulse"></div>
              ) : (
                <motion.div
                  variants={logoVariants}
                  animate="animate"
                  className="relative"
                >
                  <img
                    src={settings?.logo && settings.logo.trim() !== '' ? settings.logo : '/default-logo.png'}
                    alt={settings?.siteName || 'Logo'}
                    className="h-16 w-16 aspect-square object-cover rounded-2xl border-2 border-gradient-to-br from-purple-400 to-pink-400 shadow-2xl group-hover:shadow-purple-500/50 transition-all duration-500 group-hover:scale-110"
                  />
                  
                  {/* Sparkle effects */}
                  <motion.div
                    variants={sparkleVariants}
                    animate="animate"
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles size={14} className="text-yellow-400 drop-shadow-lg" />
                  </motion.div>
                  
                  <motion.div
                    variants={{ ...sparkleVariants, animate: { ...sparkleVariants.animate, transition: { ...sparkleVariants.animate.transition, delay: 1 } } }}
                    animate="animate"
                    className="absolute -bottom-1 -left-1"
                  >
                    <Zap size={12} className="text-cyan-400 drop-shadow-lg" />
                  </motion.div>

                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-lg group-hover:blur-xl transition-all duration-500 group-hover:scale-125"></div>
                </motion.div>
              )}
            </div>

            <div className="flex flex-col">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="w-40 h-8 bg-gradient-to-r from-purple-300 to-pink-300 animate-pulse rounded-lg"></div>
                  <div className="w-32 h-2 bg-gradient-to-r from-purple-200 to-pink-200 animate-pulse rounded"></div>
                </div>
              ) : (
                <>
                  <motion.span 
                    className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 via-cyan-400 to-purple-400 bg-size-200 animate-gradient group-hover:scale-105 transition-transform duration-300"
                    whileHover={{ scale: 1.05 }}
                    style={{ backgroundSize: '200% 200%' }}
                  >
                    {settings?.siteName || 'Digital Cashbook'}
                  </motion.span>
                  <motion.div 
                    className="w-full h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </>
              )}
            </div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                  animate={{
                    x: [0, 30, -20, 0],
                    y: [0, -15, 10, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    delay: i * 1.3,
                    ease: "easeInOut"
                  }}
                  style={{
                    left: `${20 + i * 30}%`,
                    top: `${30 + i * 10}%`,
                  }}
                />
              ))}
            </div>
          </Link>

          {/* Desktop Navigation (if needed) */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={link.href}
                  className={`relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    pathname === link.href
                      ? `bg-gradient-to-r ${link.color} text-white shadow-lg shadow-purple-500/30`
                      : 'text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                  {pathname === link.href && (
                    <motion.div
                      className="absolute inset-0 rounded-xl blur-lg opacity-40"
                      style={{
                        background: `linear-gradient(45deg, ${link.color.split(' ')[1]}, ${link.color.split(' ')[3]})`,
                      }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Additional decorative elements */}
          <div className="hidden md:flex items-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-purple-400/30 rounded-full mr-4"
            >
              <div className="w-full h-full border-2 border-pink-400/50 rounded-full border-dashed"></div>
            </motion.div>
            
            <div className="flex flex-col items-end">
              <div className="text-xs text-gray-400 font-medium"> Sharplogicians</div>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        .bg-size-200 {
          background-size: 200% 200%;
        }
      `}</style>
    </motion.nav>
  );
}