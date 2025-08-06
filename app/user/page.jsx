// pages/UserManagement.js
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import UserTable from '../../components/UserTable';
import UserForm from '../../components/UserForm';
import 'react-toastify/dist/ReactToastify.css';

export default function UserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    const shopId = localStorage.getItem('shopId');
    const token = localStorage.getItem('token');

    if (!token) {
      setError('No authentication token found. Please log in.');
      toast.error('Please log in to continue.', { duration: 4000 });
      router.push('/login');
      return;
    }

    setRole(userRole);
  
  }, [router]);

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShops(response.data);
   
    } catch (err) {
      console.error('Error fetching shops:', err);
      const errorMessage = err.response?.data?.error || 'Failed to fetch shops';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = role === 'superadmin' && selectedShopId ? { shopId: selectedShopId } : {};
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('shopId');
        router.push('/login');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'superadmin') {
      fetchShops();
    }
    fetchUsers();
  }, [role, selectedShopId]);

  const handleAddUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      if (role === 'superadmin' && selectedShopId) {
        userData.shopId = selectedShopId;
      } else if (role !== 'superadmin') {
        userData.shopId = localStorage.getItem('shopId');
      }
      if (!userData.shopId && role === 'superadmin') {
        throw new Error('Please select a shop');
      }
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      toast.success('User added successfully', { duration: 4000 });
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to add user';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('shopId');
        router.push('/login');
      }
    }
  };

  const handleUpdateUser = async (id, userData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      if (role === 'superadmin' && selectedShopId) {
        userData.shopId = selectedShopId;
      }
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      toast.success('User updated successfully', { duration: 4000 });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update user';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('shopId');
        router.push('/login');
      }
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      toast.success('User deleted successfully', { position: 'top-right', duration: 4000 });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete user';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'top-right', duration: 4000 });
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('shopId');
        router.push('/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 py-22 px-4 sm:px-4 md:px-6 lg:p-6">
      <div className="w-full max-w-7xl mx-auto overflow-x-hidden sm:p-4 md:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-6 md:mb-6 lg:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            User Management
          </h1>
          <p className="text-base sm:text-base md:text-base lg:text-lg text-gray-200 mt-2">
            Manage your users with ease and efficiency.
          </p>
        </motion.div>

        {role === 'superadmin' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <label htmlFor="shopSelect" className="block text-sm font-medium text-gray-200 mb-2">
              Select Shop
            </label>
            <select
              id="shopSelect"
              value={selectedShopId || ''}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">All Shops</option>
              {shops.map((shop) => (
                <option key={shop._id} value={shop._id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6 text-center"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <UserForm onSubmit={handleAddUser} shops={shops} role={role} />
              <UserTable
                users={users}
                onUpdate={handleUpdateUser}
                onDelete={handleDeleteUser}
                shops={shops}
                role={role}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
}