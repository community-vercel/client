'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Download, Upload, BarChart, UserCheck2, LucideMenuSquare, UserSquareIcon, Settings, LogOut, Database } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
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
    { href: '/dashboard', label: 'Dashboard', icon: <Home size={24} /> },
    { href: '/payments', label: 'Record Management', icon: <Home size={24} /> },
    { href: '/customers', label: 'Customer Management', icon: <UserCheck2 size={24} /> },
    { href: '/reports', label: 'Reports', icon: <BarChart size={24} /> },
    { href: '/categories', label: 'Category Management', icon: <LucideMenuSquare size={24} /> },
        { href: '/products', label: 'Inventory Management', icon: <Database size={24} /> },

    { href: '/user', label: 'User Management', icon: <UserSquareIcon size={24} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={24} /> },
    { href: '#', label: 'Logout', icon: <LogOut size={24} />, onClick: handleLogout },
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
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
    closed: {
      x: '100%',
      opacity: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

  // Animation variants for links
  const linkVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.3, ease: 'easeOut' },
    }),
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-2 right-4 z-50 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          initial="closed"
          animate={isOpen || (isClient && window.innerWidth >= 768) ? 'open' : 'closed'}
          exit="closed"
          variants={sidebarVariants}
          className="fixed md:sticky top-0 right-0 h-screen w-56 sm:w-64 bg-gradient-to-b from-blue-900 to-purple-900 bg-opacity-80 backdrop-blur-lg shadow-2xl z-40 md:bg-opacity-100 md:backdrop-blur-none"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="p-4 sm:p-6 flex flex-col h-full">
            {/* Logo/Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
              className="mb-8 flex items-center justify-center gap-2"
            >
              <img
                src="/logo.png"
                alt="FinanceHub Logo"
                className="h-10 w-10 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform duration-300"
              />
              <h2 className="text-xl sm:text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-green-300">
                FinanceHub
              </h2>
            </motion.div>

            {/* Navigation Links */}
            <ul className="space-y-2 flex-1">
              {links.map((link, index) => (
                <motion.li
                  key={link.href}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={linkVariants}
                >
                  {link.onClick ? (
                    <button
                      onClick={link.onClick}
                      className={`flex items-center p-3 rounded-lg transition-all duration-300 w-full text-left ${
                        pathname === link.href
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-200 hover:bg-gray-700/50 hover:text-yellow-400 hover:shadow-md'
                      } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-blue-900`}
                    >
                      <span className="mr-3 transform hover:scale-125 transition-transform duration-200">
                        {link.icon}
                      </span>
                      <span className="font-medium text-sm sm:text-base">{link.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                        pathname === link.href
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                          : 'text-gray-200 hover:bg-gray-700/50 hover:text-yellow-400 hover:shadow-md'
                      } focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-blue-900`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mr-3 transform hover:scale-125 transition-transform duration-200">
                        {link.icon}
                      </span>
                      <span className="font-medium text-sm sm:text-base">{link.label}</span>
                    </Link>
                  )}
                </motion.li>
              ))}
            </ul>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-auto pt-4 border-t border-gray-700"
            >
              <p className="text-xs sm:text-sm text-gray-400 text-center hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r hover:from-yellow-400 hover:to-green-300 transition-all duration-300">
                © 2025 FinanceHub
              </p>
            </motion.div>
          </div>
        </motion.aside>

        {/* Overlay for mobile */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black md:hidden z-30"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>
    </>
  );
}