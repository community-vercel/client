// components/UserTable.js
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import UserForm from './UserForm';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function UserTable({ users, onUpdate, onDelete, shops, role }) {
  const [editUser, setEditUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);

  const handleEdit = (user) => setEditUser(user);

  const handleUpdate = (userData) => {
    onUpdate(editUser._id, userData);
    setEditUser(null);
  };

  const handleDelete = (id) => setDeleteUserId(id);

  const confirmDelete = () => {
    onDelete(deleteUserId);
    setDeleteUserId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-lg rounded-xl mt-2 w-full"
    >
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-green-800 text-white">
              <th className="py-2 px-2 sm:px-3 md:px-4 lg:px-6 text-left font-semibold text-sm sm:text-base truncate">Username</th>
              <th className="py-2 px-2 sm:px-3 md:px-4 lg:px-6 text-left font-semibold text-sm sm:text-base truncate">Role</th>
              <th className="py-2 px-2 sm:px-3 md:px-4 lg:px-6 text-left font-semibold text-sm sm:text-base truncate">Shop</th>
              <th className="py-2 px-2 sm:px-3 md:px-4 lg:px-6 text-left font-semibold text-sm sm:text-base truncate">Created At</th>
              <th className="py-2 px-2 sm:px-3 md:px-4 lg:px-6 text-left font-semibold text-sm sm:text-base truncate">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <motion.tr
                key={user._id}
                className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 transition-colors`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <td className="py-2 px-2 sm:px-3 md:px-4 lg:px-6 text-sm sm:text-base truncate">{user.username}</td>
                <td className="py-2 px-2 sm:px-3 md:px-4 lg:px-6">
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      user.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="py-2 px-2 sm:px-3 md:px-4 lg:px-6 text-sm sm:text-base truncate">
{typeof user.shopId === 'object'
  ? user.shopId?.name || 'N/A'
  : (shops.find(shop => shop._id === user.shopId)?.name || 'Unknown Shop')}
                </td>
                <td className="py-2 px-2 sm:px-3 md:px-4 lg:px-6 text-sm sm:text-base truncate">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                </td>
                {role === 'superadmin' && (
                  <td className="py-2 px-2 sm:px-3 md:px-4 lg:px-6 flex flex-col sm:flex-col md:flex-row md:space-x-3 gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm sm:text-base transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm sm:text-base transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {editUser && (
        <UserForm
          user={editUser}
          onSubmit={handleUpdate}
          onCancel={() => setEditUser(null)}
          isEdit
          shops={shops}
          role={role}
        />
      )}
      {deleteUserId && (
        <DeleteConfirmModal onConfirm={confirmDelete} onCancel={() => setDeleteUserId(null)} />
      )}
    </motion.div>
  );
}