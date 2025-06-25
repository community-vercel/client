'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../lib/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await getCategories();
    setCategories(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateCategory(editingId, form);
      setEditingId(null);
    } else {
      await createCategory(form);
    }
    setForm({ name: '', description: '' });
    fetchCategories();
  };

  const handleEdit = (category) => {
    setForm({ name: category.name, description: category.description });
    setEditingId(category._id);
  };

  const handleDelete = async (id) => {
    await deleteCategory(id);
    fetchCategories();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex flex-col items-center py-28 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.h1
        className="text-4xl font-extrabold text-white mb-8 tracking-tight drop-shadow-md"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        Manage Your Categories
      </motion.h1>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-8 mb-10 space-y-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <input
            type="text"
            placeholder="Category Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400 text-gray-800"
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300 placeholder-gray-400 text-gray-800"
          />
        </div>
        <motion.button
          type="submit"
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={18} />
          {editingId ? 'Update Category' : 'Add Category'}
        </motion.button>
      </motion.form>

      {/* Categories List */}
      <motion.ul
        className="w-full max-w-2xl space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
      >
        <AnimatePresence>
          {categories.map((category) => (
            <motion.li
              key={category._id}
              className="bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 rounded-xl p-6 flex items-center justify-between hover:shadow-xl transition-all duration-300"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <p className="font-semibold text-gray-800 text-lg">{category.name}</p>
                <p className="text-sm text-gray-600">{category.description || 'No description'}</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  onClick={() => handleEdit(category)}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Pencil size={20} />
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(category._id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 size={20} />
                </motion.button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  )}