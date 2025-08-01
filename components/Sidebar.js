'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Download, Upload, BarChart, UserCheck2, LucideMenuSquare, UserSquareIcon, Settings, LogOut, Database, Sparkles } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  // Handle SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    setIsOpen(false);
    router.push('/login');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  let links = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home size={24} />, color: 'from-blue-500 to-cyan-500' },
    { href: '/payments', label: 'Record Management', icon: <Database size={24} />, color: 'from-emerald-500 to-teal-500' },
    { href: '/customers', label: 'Customer Management', icon: <UserCheck2 size={24} />, color: 'from-purple-500 to-pink-500' },
    { href: '/reports', label: 'Reports', icon: <BarChart size={24} />, color: 'from-orange-500 to-red-500' },
    { href: '/categories', label: 'Category Management', icon: <LucideMenuSquare size={24} />, color: 'from-indigo-500 to-purple-500' },
    { href: '/products', label: 'Inventory Management', icon: <Database size={24} />, color: 'from-green-500 to-emerald-500' },
    { href: '/user', label: 'User Management', icon: <UserSquareIcon size={24} />, color: 'from-yellow-500 to-orange-500' },
    { href: '/settings', label: 'Settings', icon: <Settings size={24} />, color: 'from-gray-500 to-slate-500' },
    { href: '#', label: 'Logout', icon: <LogOut size={24} />, onClick: handleLogout, color: 'from-red-500 to-pink-500' },
  ];

  // Filter links based on role
  if (role !== 'admin') {
    links = links.filter(link => link.href !== '/user' && link.href !== '/settings');
  }

  // Animation variants for sidebar
  const sidebarVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 120, 
        damping: 20,
        staggerChildren: 0.1,
        delayChildren: 0.1
      },
    },
    closed: {
      x: '100%',
      opacity: 0,
      transition: { 
        type: 'spring', 
        stiffness: 120, 
        damping: 20,
        staggerChildren: 0.05,
        staggerDirection: -1
      },
    },
  };

  // Animation variants for links
  const linkVariants = {
    hidden: { 
      opacity: 0, 
      x: -30,
      scale: 0.9
    },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { 
        delay: i * 0.08, 
        duration: 0.4, 
        ease: [0.4, 0, 0.2, 1],
        type: 'spring',
        stiffness: 100
      },
    }),
  };

  const sparkleVariants = {
    animate: {
      scale: [1, 1.2, 1],
      rotate: [0, 180, 360],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <motion.button
        onClick={toggleSidebar}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className="md:hidden fixed top-4 right-4 z-50 p-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl hover:shadow-purple-500/50 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-offset-2 backdrop-blur-sm"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.div>
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          initial="closed"
          animate={isOpen || (isClient && window.innerWidth >= 768) ? 'open' : 'closed'}
          exit="closed"
          variants={sidebarVariants}
          className="fixed md:sticky top-0 right-0 h-screen w-72 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 shadow-2xl z-40 border-l border-purple-500/20"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 -left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
          </div>

          <div className="relative p-6 flex flex-col h-full backdrop-blur-sm">
            {/* Logo/Title */}
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 120, delay: 0.2 }}
              className="mb-10 flex items-center justify-center gap-3 relative"
            >
              <div className="relative">
                <motion.img
                  src="/logo.png"
                  alt="FinanceHub Logo"
                  className="h-12 w-12 rounded-2xl border-2 border-gradient-to-r from-purple-400 to-pink-400 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />
                <motion.div
                  variants={sparkleVariants}
                  animate="animate"
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles size={12} className="text-yellow-400" />
                </motion.div>
              </div>
              <div className="text-center">
                <motion.h2 
                  className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 tracking-wide"
                  whileHover={{ scale: 1.05 }}
                >
                  Sharplogicians
                </motion.h2>
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent mt-1"></div>
              </div>
            </motion.div>

            {/* Navigation Links */}
            <motion.ul className="space-y-3 flex-1" variants={sidebarVariants}>
              {links.map((link, index) => (
                <motion.li
                  key={link.href}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={linkVariants}
                  whileHover={{ scale: 1.02, x: 5 }}
                  onHoverStart={() => setHoveredLink(index)}
                  onHoverEnd={() => setHoveredLink(null)}
                >
                  {link.onClick ? (
                    <button
                      onClick={link.onClick}
                      className={`relative flex items-center p-4 rounded-2xl transition-all duration-500 w-full text-left group overflow-hidden ${
                        pathname === link.href
                          ? `bg-gradient-to-r ${link.color} text-white shadow-2xl shadow-purple-500/30`
                          : 'text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Animated background for hover effect */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${link.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl`}
                        initial={false}
                        animate={{ opacity: hoveredLink === index ? 0.2 : 0 }}
                      />
                      
                      <motion.span 
                        className="relative mr-4 z-10"
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                      >
                        {link.icon}
                      </motion.span>
                      <span className="relative font-semibold text-sm tracking-wide z-10">{link.label}</span>
                      
                      {/* Glow effect */}
                      {pathname === link.href && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            background: `linear-gradient(45deg, ${link.color.split(' ')[1]}, ${link.color.split(' ')[3]})`,
                            filter: 'blur(20px)',
                            opacity: 0.3,
                          }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={`relative flex items-center p-4 rounded-2xl transition-all duration-500 group overflow-hidden ${
                        pathname === link.href
                          ? `bg-gradient-to-r ${link.color} text-white shadow-2xl shadow-purple-500/30`
                          : 'text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      {/* Animated background for hover effect */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${link.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl`}
                        initial={false}
                        animate={{ opacity: hoveredLink === index ? 0.2 : 0 }}
                      />
                      
                      <motion.span 
                        className="relative mr-4 z-10"
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                        transition={{ duration: 0.5 }}
                      >
                        {link.icon}
                      </motion.span>
                      <span className="relative font-semibold text-sm tracking-wide z-10">{link.label}</span>
                      
                      {/* Glow effect */}
                      {pathname === link.href && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          style={{
                            background: `linear-gradient(45deg, ${link.color.split(' ')[1]}, ${link.color.split(' ')[3]})`,
                            filter: 'blur(20px)',
                            opacity: 0.3,
                          }}
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </Link>
                  )}
                </motion.li>
              ))}
            </motion.ul>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-auto pt-6 border-t border-purple-500/30 relative"
            >
              <motion.p 
                className="text-sm text-gray-400 text-center font-medium tracking-wide hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r hover:from-purple-400 hover:to-pink-400 transition-all duration-300 cursor-default"
                whileHover={{ scale: 1.05 }}
              >
                © 2025 Sharplogicians
              </motion.p>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
            </motion.div>
          </div>
        </motion.aside>

        {/* Enhanced Overlay for mobile */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 md:hidden z-30 backdrop-blur-sm"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>
    </>
  );
}