'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/Modal';
import TransactionTable from '../../components/TransactionTable';
import SummaryDashboard from '../../components/SummaryDashboard';
import api from '../../lib/api';
import { formatCurrency, downloadCSV } from '../utils/helpers';
import CustomerSearch from '@/components/CustomerSearc';

// Animation variants for consistent transitions
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};


export const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];
const errorVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [CATEGORIES, setCategories] = useState([]);
  console.log('CATEGORIES', CATEGORIES);
  const [formData, setFormData] = useState({
    transactionType: '',
    customerId: '',
    customerName: '',
    phone: '',
    amount: '',
    description: '',
    category: '',
    type: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    image: null,
    user: null,
  });
  const [filters, setFilters] = useState({ startDate: '', endDate: '', category: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [userid, setUserid] = useState(null);
  const [role, setRole] = useState(null);

  // Initialize user ID from localStorage
  useEffect(() => {
    const id = localStorage.getItem('userid');
    const userRole = localStorage.getItem('role');
    if (userRole) setRole(userRole);
    if (id) setUserid(id);
  }, []);
  const today = new Date().toISOString().split('T')[0]; // format: yyyy-mm-dd
  // Update formData with user ID
  useEffect(() => {
    if (userid) setFormData((prev) => ({ ...prev, user: userid }));
  }, [userid]);

  // Fetch transactions, suggestions, and customers
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsRes, receiptsRes, suggestionsRes, customersRes, categoriesRes] = await Promise.all([
        api.get(`/payments?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}`),
        api.get(`/receipts?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}`),
        api.get('/payments/recurring-suggestions'),
        api.get('/customers'),
        api.get('/categories'),
      ]);

      const combinedTransactions = [
        ...paymentsRes.data.map((t) => ({ ...t, type: 'payment' })),
        ...receiptsRes.data.map((t) => ({ ...t, type: 'receipt' })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTransactions(combinedTransactions);
      setSuggestions(suggestionsRes.data);
      setCustomers(customersRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle transaction type selection
  const handleTransactionTypeSelect = (type) => {
    setFormData({ ...formData, transactionType: type });
    setEntryMode(null);
    setIsModalOpen(true);
  };

  // Handle entry mode selection
  const handleEntryModeSelect = (mode) => {
    setEntryMode(mode);
  };

  // Handle customer selection or creation
  const handleCustomerSelect = async (name) => {
    setFormData({ ...formData, customerName: name });
    if (!name) return;

    try {
      const { data } = await api.post('/customers/find-or-create', { name, phone: formData.phone });
      setFormData({ ...formData, customerId: data._id, customerName: data.name });
      setCustomers([...customers.filter((c) => c._id !== data._id), data]);
      setShowCustomerForm(false);
    } catch (err) {
      setError('Error processing customer. Please try again.');
    }
  };

  // Add new customer
  const handleAddCustomer = async () => {
    try {
      const { data } = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.phone,
      });
      setFormData({ ...formData, customerId: data._id, customerName: data.name });
      setCustomers([...customers, data]);
      setShowCustomerForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) form.append(key, value);
      });

      const endpoint = editingTransaction
        ? `/${formData.transactionType}s/${editingTransaction._id}`
        : `/${formData.transactionType}s`;
      const method = editingTransaction ? api.put : api.post;

      await method(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });

      // Reset form and modal
      setFormData({
        transactionType: '',
        customerId: '',
        customerName: '',
        phone: '',
        amount: '',
        description: '',
        category: '',
        type: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        image: null,
        user: userid,
      });
      setIsModalOpen(false);
      setEntryMode(null);
      setEditingTransaction(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || `Error saving ${formData.transactionType}.`);
      console.error('Submit error:', err);
    }
  };

  // Handle transaction edit
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transactionType: transaction.type,
      customerId: transaction.customerId._id,
      customerName: customers.find((c) => c._id === transaction.customerId._id)?.name || '',
      phone: '',
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      type: transaction.type || '',
      date: transaction.date.split('T')[0],
      isRecurring: transaction.isRecurring,
      image: null,
      user: userid,
    });
    setEntryMode('manual');
    setIsModalOpen(true);
  };

  // Handle transaction deletion
  const handleDelete = async (id, transactionType) => {
    try {
      await api.delete(`/${transactionType}s/${id}`);
      await fetchData();
    } catch (err) {
      setError(`Error deleting ${transactionType}.`);
      console.error('Delete error:', err);
    }
  };

  // Apply recurring suggestion
  const applySuggestion = (suggestion) => {
    setFormData({
      transactionType: 'payment',
      customerId: '',
      customerName: '',
      phone: '',
      amount: suggestion.amount,
      description: suggestion.description,
      category: suggestion.category,
      type: suggestion.type || '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: true,
      image: null,
      user: userid,
    });
    setEntryMode('manual');
    setIsModalOpen(true);
  };

  // Export transactions to CSV
  const handleExport = () => {
    const csvData = transactions.map((t) => ({
      Date: t.date,
      Type: t.type,
      Customer: customers.find((c) => c._id === t.customerId._id)?.name || '',
      Amount: formatCurrency(t.amount),
      Category: t.category,
      Description: t.description,
    }));
    downloadCSV(csvData, 'transactions.csv');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 py-28 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Transaction Management</h1>
          <p className="mt-2 text-lg text-gray-300">Track and manage your financial transactions seamlessly.</p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-red-900 bg-opacity-70 text-red-100 p-4 rounded-lg text-center"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Dashboard */}
        {!loading && (
          <motion.div variants={containerVariants}>
            <SummaryDashboard transactions={transactions} />
          </motion.div>
        )}

        {/* Filters and Actions */}
        <motion.div
          variants={containerVariants}
          className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Start Date"
              max={today}

            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="End Date"
              max={today}

            />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Category Filter"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat, index) => (
                <option key={index} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
              aria-label="Add Transaction"
            >
              Add Transaction
            </button>
            <button
              onClick={handleExport}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              aria-label="Export to CSV"
            >
              Export CSV
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <svg
              className="animate-spin h-8 w-8 text-indigo-400 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-label="Loading"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
              />
            </svg>
            <p className="text-white mt-2">Loading transactions...</p>
          </div>
        )}

        {/* Recurring Suggestions */}
        {!loading && suggestions.length > 0 && (
          <motion.div variants={containerVariants} className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Recurring Suggestions</h3>
            <ul className="space-y-3">
              {suggestions.map((s, index) => (
                <motion.li
                  key={s._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between items-center p-4 bg-gray-700 bg-opacity-50 rounded-lg"
                >
                  <span className="text-gray-200">
                    {s.description} ({s.category}) - {formatCurrency(s.amount)}
                  </span>
                  <button
                    onClick={() => applySuggestion(s)}
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition"
                    aria-label={`Apply suggestion: ${s.description}`}
                  >
                    Apply
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Transaction Table */}
        {!loading && (
          <motion.div variants={containerVariants} className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
            <TransactionTable transactions={transactions} onEdit={handleEdit} onDelete={handleDelete} />
          </motion.div>
        )}

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEntryMode(null);
            setEditingTransaction(null);
            setFormData({
              transactionType: '',
              customerId: '',
              customerName: '',
              phone: '',
              amount: '',
              description: '',
              category: '',
              type: '',
              date: new Date().toISOString().split('T')[0],
              isRecurring: false,
              image: null,
              user: userid,
            });
            setError('');
            setShowCustomerForm(false);
          }}
          title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
          aria-label="Transaction Modal"
        >
          {!formData.transactionType ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select Transaction Type</h3>
              <button
                onClick={() => handleTransactionTypeSelect('payment')}
                className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition"
                aria-label="Debit Transaction"
              >
                Debit (You Gave)
              </button>
              <button
                onClick={() => handleTransactionTypeSelect('receipt')}
                className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition"
                aria-label="Credit Transaction"
              >
                Credit (You Got)
              </button>
            </div>
          ) : !entryMode ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select Entry Mode</h3>
              <button
                onClick={() => handleEntryModeSelect('upload')}
                className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
                aria-label="Upload Image"
              >
                Upload Receipt Image
              </button>
              <button
                onClick={() => handleEntryModeSelect('manual')}
                className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
                aria-label="Manual Entry"
              >
                Manual Entry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-center bg-red-900 bg-opacity-30 p-2 rounded"
                    role="alert"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {entryMode === 'upload' && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg"
                  aria-label="Upload Receipt Image"
                />
              )}
              <input
                type="text"
                placeholder="Search or add customer"
                value={formData.customerName}
                onChange={(e) => {
                  setFormData({ ...formData, customerName: e.target.value });
                  setShowCustomerForm(
                    !customers.some(
                      (c) => c.name.toLowerCase() === e.target.value.toLowerCase()
                    )
                  );
                }}
                
                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                list="customers"
                required
                aria-label="Customer Name"
              />

              <datalist id="customers">
                {customers.map((c) => (
                  <option key={c._id} value={c.name} />
                ))}
              </datalist>

              <AnimatePresence>
                {showCustomerForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 p-4 rounded-xl bg-indigo-50 shadow-md border border-indigo-200 space-y-4"
                  >
                    <div className="flex flex-col">
                      <label className="text-sm text-indigo-700 font-medium mb-1">Phone (optional)</label>
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="p-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        aria-label="Customer Phone"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomer}
                      className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium shadow-sm"
                      aria-label="Add New Customer"
                    >
                      Add Customer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                required
                aria-label="Transaction Amount"
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                required
                aria-label="Transaction Description"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                required
                aria-label="Transaction Category"
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((cat, index) => (
                  <option key={index} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                required
                aria-label="Payment Method"
              >
                <option value="">Select Payment Method</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                aria-label="Transaction Date"
                max={today}

              />
              <label className="flex items-center text-gray-200">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                  className="mr-2 text-indigo-400 focus:ring-indigo-400"
                  aria-label="Recurring Transaction"
                />
                Recurring Transaction
              </label>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
                aria-label={editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              >
                {editingTransaction ? 'Update' : 'Add'}
              </button>
            </form>
          )}
        </Modal>
      </motion.div>
    </div>
  );
}