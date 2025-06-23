'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Ensure localStorage is only accessed on the client side
  useEffect(() => {
    setIsClient(true); // Mark that we're on the client side
  }, []);

  // Check token only after component is mounted on client
  useEffect(() => {
    if (isClient) {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
      }
    }
  }, [isClient, router]);

  // Render nothing or a loading state during SSR
  if (!isClient) {
    return null; // Or a loading spinner if preferred
  }

  // Only render children if token exists
  return localStorage.getItem('token') ? children : null;
}