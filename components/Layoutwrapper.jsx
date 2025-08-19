// components/LayoutWrapper.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import api from '../lib/api';

export default function LayoutWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userid');
    localStorage.removeItem('role');
    localStorage.removeItem('shopId');
    setIsAuthenticated(false);
    toast.error('Session expired. Please login again.');
    router.push('/login');
  };

  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('token');

      // If no token and not on auth page, redirect immediately
      if (!token && !isAuthPage) {
        router.push('/login');
        return;
      }

      if (isAuthPage) {
        setIsAuthenticated(false);
        return;
      }

      // Only validate token if we have one
      try {
        await api.get('/auth/validate-token', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        logout();
      }
    };

    checkTokenValidity();
  }, [pathname, isAuthPage, router]);

  // If on auth pages, render them directly
  if (isAuthPage) return children;

  // Check for token immediately - no loading state for unauthenticated users
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // If no token, don't render anything (redirect is already happening in useEffect)
  if (!token) {
    return null;
  }

  // Show loading only when we have a token but haven't validated it yet
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700 bg-gradient-to-br from-gray-50 to-gray-100">
        Checking authentication...
      </div>
    );
  }

  return (
    <>
      <ToastContainer theme="colored" />
      <Navbar logout={logout} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}