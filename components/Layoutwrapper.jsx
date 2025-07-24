'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, false = not logged in

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/login');
    toast.info('Session expired. Please log in again.', {
      position: 'top-right',
    });
  };

  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('token');

      // If no token and not on an auth page, redirect to login
      if (!token && !isAuthPage) {
        logout();
        return;
      }

      // If on an auth page, render children directly
      if (isAuthPage) {
        setIsAuthenticated(false);
        return;
      }

      try {
        await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/validate-token`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthenticated(true);
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error('Invalid or expired token. Logging out.', {
            position: 'top-right',
          });
          logout();
        } else {
          toast.error('Failed to validate session. Please try again.', {
            position: 'top-right',
          });
          logout();
        }
      }
    };

    checkTokenValidity();
  }, [pathname, router]);

  if (isAuthPage) return children;

  // Loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gradient-to-br from-gray-50 to-gray-100">
        Checking authentication...
      </div>
    );
  }

  // Render layout only if authenticated
  return (
    <>
      <ToastContainer theme="colored" />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}