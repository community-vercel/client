'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/Modal';
import TransactionTable from '../../components/TransactionTable';
import { createPayment, getPayments, updatePayment, deletePayment, getRecurringSuggestions } from '../../lib/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  console.log('Payments component rendered',suggestions); // Debugging line
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
  type: '', // Renamed from paymenttype
    date: '',
    isRecurring: false,
  });
  const [filters, setFilters] = useState({ startDate: '', endDate: '', category: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Predefined options for category and payment method
  const categories = [

  'Utilities',
  'Salaries & Wages',
  'Marketing & Advertising',
  'Transportation',
  'Packaging Supplies',
  'Maintenance & Repairs',
  'Software Subscriptions',
  'Bank Charges',
  'Loan Repayment',
  'Taxes',
    'Inventory Purchase',
  'Rent',
  'Office Supplies',
  'Professional Services',
  'Other',
];
  const paymentMethods = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [paymentsRes, suggestionsRes] = await Promise.all([
          getPayments(filters),
          getRecurringSuggestions(),
        ]);
        console.log('Payments fetched:', paymentsRes.data); // Debugging line
        console.log('Suggestions fetched:', suggestionsRes.data); // 
        setPayments(paymentsRes.data);
        setSuggestions(suggestionsRes.data);
      } catch (error) {
        setError('Failed to fetch payments or suggestions. Please try again.');
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingPayment) {
        await updatePayment(editingPayment._id, formData);
      } else {
        await createPayment(formData);
      }
      setFormData({ amount: '', description: '', category: '', type: '', date: '', isRecurring: false });
      setIsModalOpen(false);
      setEditingPayment(null);
      const res = await getPayments(filters);
      setPayments(res.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Error submitting payment');
      console.error('Error submitting payment:', error);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      amount: payment.amount,
      description: payment.description,
      category: payment.category,
    type: payment.type || '', // Handle if type is not in older data
      date: payment.date.split('T')[0],
      isRecurring: payment.isRecurring,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deletePayment(id);
      const res = await getPayments(filters);
      setPayments(res.data);
    } catch (error) {
      setError('Error deleting payment');
      console.error('Error deleting payment:', error);
    }
  };

  const applySuggestion = (suggestion) => {
    setFormData({
      amount: suggestion.amount,
      description: suggestion.description,
      category: suggestion.category,
    type: suggestion.type || '', // Handle if suggestion doesn't include type
      date: '',
      isRecurring: true,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-extrabold text-white text-center mb-8">Payments</h1>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Filters and Add Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
          >
            Add Payment
          </button>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <svg
              className="animate-spin h-8 w-8 text-indigo-400 mx-auto"
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
            <p className="text-white mt-2">Loading...</p>
          </div>
        )}

        {/* Recurring Suggestions */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-8"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Recurring Suggestions</h3>
            {suggestions.length > 0 ? (
              <ul className="space-y-3">
                {suggestions.map((s, index) => (
                  <motion.li
                    key={s._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex justify-between items-center p-3 bg-gray-700 bg-opacity-50 rounded-lg"
                  >
                    <span className="text-gray-200">
                      {s.description} ({s.category}) ({s.type})  - ${s.amount}
                    </span>
                    <button
                      onClick={() => applySuggestion(s)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
                    >
                      Apply
                    </button>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center">No suggestions available.</p>
            )}
          </motion.div>
        )}

        {/* Transaction Table */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Recent Payments</h3>
            <TransactionTable
              transactions={payments}
              onEdit={handleEdit}
              onDelete={(id) => handleDelete(id)}
            />
          </motion.div>
        )}

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPayment(null);
            setFormData({ amount: '', description: '', category: '', type: '', date: '', isRecurring: false });
            setError('');
          }}
          title={editingPayment ? 'Edit Payment' : 'Add Payment'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-red-400 text-center bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>
            )}
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Payment Method</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <label className="flex items-center text-gray-200">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="mr-2 text-indigo-500 focus:ring-indigo-500"
              />
              Recurring Expense
            </label>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
            >
              {editingPayment ? 'Update' : 'Add'}
            </button>
          </form>
        </Modal>
      </motion.div>
    </div>
  );
}