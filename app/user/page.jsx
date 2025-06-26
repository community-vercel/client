'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import UserTable from '../../components/UserTable';
import UserForm from '../../components/UserForm';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 4000 });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to add user';
      setError(errorMessage);
    }
  };

  const handleUpdateUser = async (id, userData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update user';
      setError(errorMessage);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete user';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 py-28">
      <div className="container mx-auto p-6 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
            <span className="bg-clip-text text-white to-indigo-800">
              User Management
            </span>
          </h1>
          <p className="mt-2 text-gray-200 text-lg">Manage your users with ease and efficiency.</p>
        </motion.div>

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
              <UserForm onSubmit={handleAddUser} />
              <UserTable users={users} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* <Toaster position="top-right" /> */}
      </div>
    </div>
  );
}