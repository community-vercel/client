'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import UserForm from './UserForm';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function UserTable({ users, onUpdate, onDelete }) {
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

  const role = localStorage.getItem('role');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-lg rounded-xl overflow-hidden mt-2"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full ">
          <thead>
            <tr className="bg-green-800 text-white">
              <th className="py-4 px-6 text-left font-semibold">Username</th>
              <th className="py-4 px-6 text-left font-semibold">Role</th>
              <th className="py-4 px-6 text-left font-semibold">Created At</th>
              <th className="py-4 px-6 text-left font-semibold">Actions</th>
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
                <td className="py-4 px-6">{user.username}</td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6">
                  {new Date(user.createdAt).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi' })}
                </td>
                {role === 'admin' && (
                <td className="py-4 px-6 flex space-x-3">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="text-red-600 hover:text-red-800 font-medium transition-colors"
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
        />
      )}
      {deleteUserId && (
        <DeleteConfirmModal onConfirm={confirmDelete} onCancel={() => setDeleteUserId(null)} />
      )}
    </motion.div>
  );
}