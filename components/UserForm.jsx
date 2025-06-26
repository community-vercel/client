'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function UserForm({ user = {}, onSubmit, onCancel, isEdit = false }) {
  const [formData, setFormData] = useState({
    username: user.username || '',
    password: '',
    role: user.role || 'user',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ username: '', password: '', role: 'user' }); // Reset form after submission
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1,

System: 1 }}
      transition={{ duration: 0.5 }}
            className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl space-y-5"
      onSubmit={handleSubmit}
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {isEdit ? 'Edit User' : 'Add New User'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
            required
          />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-200">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
              required
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-200">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 w-full p-3 text-gray-200 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors"
          >
            <option className='text-gray-800' value="user">User</option>
            <option className='text-gray-800' value="admin">Admin</option>
          </select>
        </div>
      </div>
      <div className="mt-6 flex space-x-4">
        <button
          type="submit"
              className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
        >
          {isEdit ? 'Update' : 'Add'} User
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  );
}