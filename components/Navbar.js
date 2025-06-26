'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState,useEffect } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { getSettings} from '../lib/api';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({ siteName: '', phone: '', logo: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await getSettings();
    if (data) setSettings(data);
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
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/receipts', label: 'Receipts' },
    { href: '/payments', label: 'Payments' },
    { href: '/reports', label: 'Reports' },
  ];


  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-900 text-white shadow-lg backdrop-blur-md bg-opacity-80 transition-shadow duration-300 hover:shadow-xl">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo and App Title */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
<img
  
  src={settings?.logo && settings.logo.trim() !== '' ? settings.logo : '/default-logo.png'}
  alt={settings?.siteName || 'Logo'}
  className="h-14 w-14 aspect-square object-cover rounded-full border-2 border-white group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ease-in-out shadow-md group-hover:shadow-yellow-500/50"
/>

          <span className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-yellow-400 group-hover:scale-105 transition-transform duration-300">
            {settings.siteName || 'Digital Cashbook'}
          </span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full p-2 hover:bg-white/10 transition-colors duration-200"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? <X size={30} /> : <Menu size={30} />}
        </button>

        {/* Navigation Links */}
        <div
          className={`absolute md:static top-16 left-0 w-full md:w-auto bg-blue-900/95 md:bg-transparent transition-all duration-500 ease-in-out ${
            isOpen
              ? 'max-h-screen opacity-100 translate-y-0'
              : 'max-h-0 opacity-0 translate-y-[-20px] md:max-h-screen md:opacity-100 md:translate-y-0'
          } md:flex md:items-center md:space-x-8 overflow-hidden md:overflow-visible shadow-lg md:shadow-none`}
        >
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8 p-6 md:p-0">
          
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 py-2 px-6 text-lg font-medium bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 rounded-lg transition-all duration-300 hover:scale-105 shadow-md hover:shadow-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-blue-900"
            >
              <LogOut size={18} />
              Logout
            </button>
         
          </div>
        </div>
      </div>
    </nav>
  )}