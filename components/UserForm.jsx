// components/UserForm.js
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function UserForm({ user = {}, onSubmit, onCancel, isEdit = false, shops = [], role, selectedShopId }) {
const [formData, setFormData] = useState({
  username: user.username || '',
  password: '',
  role: user.role || 'user',
  shopId: isEdit
    ? (typeof user.shopId === 'object' ? user.shopId._id : user.shopId || '')
    : (role === 'superadmin' ? selectedShopId || '' : ''),
});


  console.log("UserForm data:", user,formData,isEdit, role, selectedShopId);
  useEffect(() => {
    if (role === 'superadmin' && !isEdit) {
      setFormData((prev) => ({ ...prev, shopId: selectedShopId || '' }));
    }
  }, [selectedShopId, role, isEdit]);

  const handleChange = (e) => {
    console.log('Form field changed:', e.target.name, e.target.value);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || (!isEdit && !formData.password)) {
      toast.error('Username and password are required', { duration: 4000 });
      return;
    }
    if (role === 'superadmin' && !formData.shopId && !isEdit) {
      toast.error('Please select a shop', { duration: 4000 });
      return;
    }
    console.log('Submitting form with data:', formData);
    onSubmit(formData);
    setFormData({ username: '', password: '', role: 'user', shopId: role === 'superadmin' ? selectedShopId || '' : '' });
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-4 sm:p-4 md:p-6 lg:p-6 rounded-xl shadow-xl space-y-4 w-full"
      onSubmit={handleSubmit}
    >
      <h2 className="text-lg sm:text-lg md:text-xl lg:text-xl font-semibold text-white mb-4">
        {isEdit ? 'Edit User' : 'Add New User'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-white"
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
              className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-white"
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
            className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-white"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {role === 'superadmin' && (
          <div>
            <label className="block text-sm font-medium text-gray-200">Shop</label>
         <select
  name="shopId"
  value={formData.shopId}
  onChange={handleChange}
              className="mt-1 w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors text-white"
  required={!isEdit}
>
  <option value="">Select a Shop</option>
  {shops.map((shop) => (
    <option key={shop._id} value={shop._id}>
      {shop.name}
    </option>
  ))}
</select>

          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col sm:flex-col md:flex-row md:space-x-4 gap-4">
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
        >
          {isEdit ? 'Update' : 'Add'} User
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-full md:w-auto bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  );
}