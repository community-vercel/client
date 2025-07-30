'use client';

import { AlignRight, Lock, MoveRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 px-4">
      <div className="bg-white/70 backdrop-blur-md shadow-2xl rounded-2xl p-8 max-w-md w-full text-center animate-fadeIn border border-gray-200">
        <div className="mb-4 text-blue-600 text-4xl flex justify-center">
          <Lock />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-800 mb-4">Registration Disabled</h2>
        <p className="text-gray-600 mb-6">
          We are currently not accepting new registrations. Please contact support if you need help.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition duration-300"
        >
          Go to Login
          <MoveRight className="ml-2" />
        </button>
      </div>
    </div>
  );
}
