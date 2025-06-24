'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/Modal';
import TransactionTable from '../../components/TransactionTable';
import api from '../../lib/api';

export default function Transaction() {
  const [transactions, setTransactions] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState({
    transactionType: '', // 'payment' or 'receipt'
    customerId: '',
    customerName: '',
    phone: '',
    amount: '',
    description: '',
    category: '',
    type: '',
    date: '',
    isRecurring: false,
    image: null,
    user: null,
  });
  const [filters, setFilters] = useState({ startDate: '', endDate: '', category: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState(null); // 'upload' or 'manual'
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [userid, setUserid] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('userid');
    if (id) {
      setUserid(id);
    }
  }, []);

  useEffect(() => {
    if (userid) {
      setFormData((prev) => ({
        ...prev,
        user: userid,
      }));
    }
  }, [userid]);
  // Predefined options
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
        const [paymentsRes, receiptsRes, suggestionsRes, customersRes] = await Promise.all([
          api.get(`/payments?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}`),
          api.get(`/receipts?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}`),
          api.get('/payments/recurring-suggestions'),
          api.get('/customers'),
        ]);
        const combinedTransactions = [
          ...paymentsRes.data.map((t) => ({ ...t, type: 'payment' })),
          ...receiptsRes.data.map((t) => ({ ...t, type: 'receipt' })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(combinedTransactions);
        setSuggestions(suggestionsRes.data);
        setCustomers(customersRes.data);
      } catch (error) {
        setError('Failed to fetch data. Please try again.');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const handleTransactionTypeSelect = (type) => {
    setFormData({ ...formData, transactionType: type });
    setEntryMode(null);
    setIsModalOpen(true);
  };

  const handleEntryModeSelect = (mode) => {
    setEntryMode(mode);
  };

  const handleCustomerSelect = async (name) => {
    setFormData({ ...formData, customerName: name });
    if (name) {
      try {
        const { data } = await api.post('/customers/find-or-create', { name, phone: formData.phone });
        setFormData({ ...formData, customerId: data._id, customerName: data.name });
        setCustomers([...customers.filter((c) => c._id !== data._id), data]);
        setShowCustomerForm(false);
      } catch (error) {
        setError('Error finding or creating customer');
      }
    }
  };

  const handleAddCustomer = async () => {
    try {
      const { data } = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.phone,
      });
      setFormData({ ...formData, customerId: data._id, customerName: data.name });
      setCustomers([...customers, data]);
      setShowCustomerForm(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add customer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const form = new FormData();
      form.append('customerId', formData.customerId);
      form.append('customerName', formData.customerName);
      form.append('phone', formData.phone);
      form.append('amount', formData.amount);
      form.append('description', formData.description);
      form.append('category', formData.category);
      form.append('type', formData.type);
        form.append('user', userid);
      form.append('isRecurring', formData.isRecurring);
      form.append('date', formData.date);
      if (formData.image) form.append(formData.transactionType === 'payment' ? 'paymentImage' : 'receiptImage', formData.image);

      if (editingTransaction) {
        await api.put(`/${formData.transactionType}s/${editingTransaction._id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/${formData.transactionType}s`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setFormData({
        transactionType: '',
        customerId: '',
        customerName: '',
        phone: '',
        amount: '',
        description: '',
        category: '',
        type: '',
        date: '',
        isRecurring: false,
        image: null,
      });
      setIsModalOpen(false);
      setEntryMode(null);
      setEditingTransaction(null);
      const [paymentsRes, receiptsRes] = await Promise.all([
        api.get(`/payments?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}`),
        api.get(`/receipts?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}`),
      ]);
      const combinedTransactions = [
        ...paymentsRes.data.map((t) => ({ ...t, type: 'payment' })),
        ...receiptsRes.data.map((t) => ({ ...t, type: 'receipt' })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(combinedTransactions);
    } catch (error) {
      setError(error.response?.data?.message || `Error submitting ${formData.transactionType}`);
      console.error('Error submitting transaction:', error);
    }
  };

  const handleEdit = (transaction) => {
    console.log('Editing transaction:', customers.find((c) => c._id === transaction.customerId._id)?.name || '');
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
    });
    setEntryMode('manual');
    setIsModalOpen(true);
  };

  const handleDelete = async (id, transactionType) => {
    try {
      await api.delete(`/${transactionType}s/${id}`);
      const [paymentsRes, receiptsRes] = await Promise.all([
        api.get(`/payments?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}`),
        api.get(`/receipts?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}`),
      ]);
      const combinedTransactions = [
        ...paymentsRes.data.map((t) => ({ ...t, type: 'payment' })),
        ...receiptsRes.data.map((t) => ({ ...t, type: 'receipt' })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(combinedTransactions);
    } catch (error) {
      setError(`Error deleting ${transactionType}`);
      console.error('Error deleting transaction:', error);
    }
  };

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
      date: '',
      isRecurring: true,
      image: null,
    });
    setEntryMode('manual');
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
        <h1 className="text-4xl font-extrabold text-white text-center mb-8">Transactions</h1>

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
            Add Transaction
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
                      {s.description} ({s.category}) ({s.type}) - ${s.amount}
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
            <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
            <TransactionTable
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={(id, type) => handleDelete(id, type)}
            />
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
              transactionType: 'payment',
              customerId: '',
              customerName: '',
              phone: '',
              amount: '',
              description: '',
              category: '',
              type: '',
              date: '',
              isRecurring: false,
              image: null,
            });
            setError('');
            setShowCustomerForm(false);
          }}
          title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        >
          {!formData.transactionType ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select Transaction Type</h3>
              <button
                onClick={() => handleTransactionTypeSelect('payment')}
                className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition"
              >
                You Gave (Debit)
              </button>
              <button
                onClick={() => handleTransactionTypeSelect('receipt')}
                className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition"
              >
                You Got (Credit)
              </button>
            </div>
          ) : !entryMode ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select Entry Mode</h3>
              <button
                onClick={() => handleEntryModeSelect('upload')}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
              >
                Upload Image
              </button>
              <button
                onClick={() => handleEntryModeSelect('manual')}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
              >
                Enter Manually
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-red-400 text-center bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>
              )}
              {entryMode === 'upload' ? (
                <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg"
                />
                <input
                    type="text"
                    placeholder="Search or add customer"
                    value={formData.customerName}
                    onChange={(e) => {
                      setFormData({ ...formData, customerName: e.target.value });
                      setShowCustomerForm(!customers.some((c) => c.name.toLowerCase() === e.target.value.toLowerCase()));
                    }}
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    list="customers"
                    required
                  />
                  <datalist id="customers">
                    {customers.map((c) => (
                      <option key={c._id} value={c.name} />
                    ))}
                  </datalist>
                  {showCustomerForm && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Phone (optional)"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomer}
                        className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition"
                      >
                        Add New Customer
                      </button>
                    </div>
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

                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search or add customer"
                    value={formData.customerName}
                    onChange={(e) => {
                      setFormData({ ...formData, customerName: e.target.value });
                      setShowCustomerForm(!customers.some((c) => c.name.toLowerCase() === e.target.value.toLowerCase()));
                    }}
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    list="customers"
                    required
                  />
                  <datalist id="customers">
                    {customers.map((c) => (
                      <option key={c._id} value={c.name} />
                    ))}
                  </datalist>
                  {showCustomerForm && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Phone (optional)"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomer}
                        className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition"
                      >
                        Add New Customer
                      </button>
                    </div>
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
                </>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
              >
                {editingTransaction ? 'Update' : 'Add'}
              </button>
            </form>
          )}
        </Modal>
      </motion.div>
    </div>
  )}