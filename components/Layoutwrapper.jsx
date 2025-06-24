'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function LayoutWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, false = not logged in

  useEffect(() => {
    // Simulate auth check (you can also fetch from a real auth endpoint or use cookies)
    const token = localStorage.getItem('token');
    if (!token && !isAuthPage) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname]);

  if (isAuthPage) return children;

  // Optional: loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Checking authentication...
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}