'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '../../lib/api';
import { motion } from 'framer-motion';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login({ username: formData.username, password: formData.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userid', res.data.user.id);
        localStorage.setItem('role', res.data.user.role);
        localStorage.setItem('shopId', res.data.user.shopId); // Store shopId
        router.push('/dashboard');
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const res = await register({ username: formData.username, password: formData.password });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userid', res.data.user.id);
        localStorage.setItem('role', res.data.user.role);
        localStorage.setItem('shopId', res.data.user.shopId); // Store shopId
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.error || (isLogin ? 'Login failed' : 'Registration failed'));
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white bg-opacity-10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white border-opacity-20"
      >
        <h2 className="text-3xl font-extrabold text-center text-white mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-center mb-4 bg-red-900 bg-opacity-30 p-2 rounded"
          >
            {error}
          </motion.p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full p-4 bg-gray-800 bg-opacity-50 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-4 bg-gray-800 bg-opacity-50 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              required
            />
          </div>
          {!isLogin && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <input
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full p-4 bg-gray-800 bg-opacity-50 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                required
              />
            </motion.div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition duration-300 flex items-center justify-center ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                ></path>
              </svg>
            ) : null}
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleToggle}
            className="text-purple-300 hover:text-white transition duration-200"
          >
            {/* {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'} */}
          </button>
        </div>
      </motion.div>
    </div>
  );
}