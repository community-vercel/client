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

  const logout = async () => {
    try {
      await api.logout(localStorage.getItem('refreshToken'));
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userid');
      localStorage.removeItem('role');
      localStorage.removeItem('shopId');
      setIsAuthenticated(false);
      router.push('/login');
      toast.info('Logged out successfully', {
        position: 'top-right',
      });
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userid');
      localStorage.removeItem('role');
      localStorage.removeItem('shopId');
      setIsAuthenticated(false);
      router.push('/login');
      toast.error('Logout failed, but session cleared', {
        position: 'top-right',
      });
    }
  };

  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('token');

      if (!token && !isAuthPage) {
        logout();
        return;
      }

      if (isAuthPage) {
        setIsAuthenticated(false);
        return;
      }

      try {
        await api.get('/auth/validate-token');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        logout();
      }
    };

    checkTokenValidity();
  }, [pathname]);

  if (isAuthPage) return children;

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gradient-to-br from-gray-50 to-gray-100">
        Checking authentication...
      </div>
    );
  }

  return (
    <>
      <ToastContainer theme="colored" />
      <Navbar onLogout={logout} /> {/* Pass logout to Navbar if needed */}
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}