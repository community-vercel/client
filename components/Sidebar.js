'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api'; // Import api for customer creation
import { toast } from 'react-toastify';

import { Menu, X, Home, Download, Upload, BarChart, UserCheck2, LucideMenuSquare, UserSquareIcon, Settings, LogOut, Database, Sparkles } from 'lucide-react';

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
// components/Navbar.jsx (or wherever handleLogout is used)
const handleLogout = async () => {
  try {
    // Optionally notify backend to invalidate refresh token
    await api.post('/auth/logout', {
      refreshToken: localStorage.getItem('refreshToken'),
    });

    // Clear all localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    localStorage.removeItem('shopId');

    setIsOpen(false);
    router.push('/login');
    toast.info('Logged out successfully', {
      position: 'top-right',
    });
  } catch (error) {
    console.error('Logout failed:', error);
    // Proceed with client-side cleanup even if backend call fails
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    localStorage.removeItem('shopId');

    setIsOpen(false);
    router.push('/login');
    toast.error('Logout failed, but session cleared', {
      position: 'top-right',
    });
  }
};

  const toggleSidebar = () => setIsOpen(!isOpen);

  let links = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { href: '/payments', label: 'Record Management', icon: <Database size={20} /> },
    { href: '/customers', label: 'Customer Management', icon: <UserCheck2 size={20} /> },
    { href: '/reports', label: 'Reports', icon: <BarChart size={20} /> },
    { href: '/categories', label: 'Category Management', icon: <LucideMenuSquare size={20} /> },
    { href: '/products', label: 'Inventory Management', icon: <Database size={20} /> },
    { href: '/user', label: 'User Management', icon: <UserSquareIcon size={20} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
    { href: '#', label: 'Logout', icon: <LogOut size={20} />, onClick: handleLogout },
  ];

  // Filter links based on role
  if (role !== 'superadmin') {
    links = links.filter(link => link.href !== '/user' && link.href !== '/settings');
  }

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 right-4 z-50 p-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          initial={{ x: '100%' }}
          animate={isOpen || (isClient && window.innerWidth >= 768) ? { x: 0 } : { x: '100%' }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="fixed md:sticky top-0 right-0 h-screen w-64 bg-gray-900 shadow-lg z-40 border-l border-gray-700"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="p-6 flex flex-col h-full">
            {/* Logo/Title */}
            <div className="mb-8 flex items-center gap-3">
              <img
                src="/logo.png"
                alt="FinanceHub Logo"
                className="h-10 w-10 rounded-lg"
              />
              <div>
                <h2 className="text-xl font-bold text-white">
                  Sharplogicians
                </h2>
              </div>
            </div>

            {/* Navigation Links */}
            <ul className="space-y-2 flex-1">
              {links.map((link, index) => (
                <li key={link.href}>
                  {link.onClick ? (
                    <button
                      onClick={link.onClick}
                      className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 text-left ${
                        pathname === link.href
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <span className="mr-3">
                        {link.icon}
                      </span>
                      <span className="font-medium text-sm">{link.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                        pathname === link.href
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="mr-3">
                        {link.icon}
                      </span>
                      <span className="font-medium text-sm">{link.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="mt-auto pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-400 text-center">
                © 2025 Sharplogicians
              </p>
            </div>
          </div>
        </motion.aside>

        {/* Overlay for mobile */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>
    </>
  );
}