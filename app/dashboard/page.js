'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from '../../components/Chart';
import api from '../../lib/api';
import TransactionTable from '@/components/TransactionTable';
import { formatCurrency } from '../utils/helpers';
import Modal from '../../components/Modal';
import Fuse from 'fuse.js';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const errorVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];

export default function Dashboard() {
  const [data, setData] = useState({
    totalPayables: 0,
    totalReceivables: 0,
    balance: 0,
    openingBalance: 0,
    alerts: [],
  });
  const [filters, setFilters] = useState({ startDate: '', endDate: '', category: '' });
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    transactionType: '',
    customerId: '',
    customerName: '',
    phone: '',
    totalAmount: '',
    payable: '',
    receivable: '',
    description: '',
    category: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    image: null,
    user: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userid, setUserid] = useState(null);
  const [role, setRole] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  // Initialize user ID and role from localStorage
  useEffect(() => {
    const id = localStorage.getItem('userid');
    const userRole = localStorage.getItem('role');
    if (userRole) setRole(userRole);
    if (id) setUserid(id);
  }, []);

  // Update formData with user ID
  useEffect(() => {
    if (userid) setFormData((prev) => ({ ...prev, user: userid }));
  }, [userid]);

  // Fetch dashboard data, customers, and categories
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardRes, customersRes, categoriesRes] = await Promise.all([
        api.get(`/dashboard/summary/?startDate=${filters.startDate}&endDate=${filters.endDate}`),
        api.get('/customers'),
        api.get('/categories'),
      ]);
      setData({
        totalPayables: dashboardRes.data.totalPayables || 0,
        totalReceivables: dashboardRes.data.totalReceivables || 0,
        balance: dashboardRes.data.balance || 0,
        openingBalance: dashboardRes.data.openingBalance || 0,
        alerts: dashboardRes.data.alerts || [],
      });
      setCustomers(customersRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Handle transaction edit
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transactionType: transaction.transactionType,
      customerId: transaction.customerId._id,
      customerName: customers.find((c) => c._id === transaction.customerId._id)?.name || transaction.customerId.name || '',
      phone: '',
      totalAmount: transaction.totalAmount || '',
      payable: transaction.payable || '',
      receivable: transaction.receivable || '',
      description: transaction.description,
      category: transaction.category,
      paymentMethod: transaction.type || '',
      date: transaction.date.split('T')[0],
      dueDate: transaction.dueDate ? transaction.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
      isRecurring: transaction.isRecurring,
      image: null,
      user: userid,
    });
    setIsModalOpen(true);
  };

  // Handle transaction deletion
  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError('Error deleting transaction.');
      console.error('Delete error:', err);
    }
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
        if (value !== null && value !== '') form.append(key === 'paymentMethod' ? 'type' : key, value);
      });

      const endpoint = editingTransaction ? `/transactions/${editingTransaction._id}` : `/transactions`;
      const method = editingTransaction ? api.put : api.post;

      await method(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });

      setFormData({
        transactionType: '',
        customerId: '',
        customerName: '',
        phone: '',
        totalAmount: '',
        payable: '',
        receivable: '',
        description: '',
        category: '',
        paymentMethod: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        isRecurring: false,
        image: null,
        user: userid,
      });
      setIsModalOpen(false);
      setEditingTransaction(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving transaction.');
      console.error('Submit error:', err);
    }
  };

  // Chart data
  const barChartData = {
    labels: ['Credits', 'Debits', 'Balance'],
    datasets: [
      {
        label: 'Financial Overview',
        data: [data.totalReceivables || 0, data.totalPayables || 0, data.balance || 0],
        backgroundColor: ['#4f46e5', '#ef4444', '#10b981'],
        borderRadius: 8,
        hoverBackgroundColor: ['#4338ca', '#dc2626', '#059669'],
      },
    ],
  };

  const pieChartData = {
    labels: ['Credits', 'Debits'],
    datasets: [
      {
        data: [data.totalReceivables || 0, data.totalPayables || 0],
        backgroundColor: ['#4f46e5', '#ef4444'],
        hoverBackgroundColor: ['#4338ca', '#dc2626'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#e5e7eb' } },
      tooltip: { backgroundColor: '#1f2937', titleColor: '#ffffff', bodyColor: '#ffffff' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#e5e7eb' },
        grid: { color: '#374151' },
      },
      x: {
        ticks: { color: '#e5e7eb' },
        grid: { display: false },
      },
    },
  };

  // Fuse.js for customer search
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef(null);

  const fuse = new Fuse(customers, {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true,
  });

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, customerName: value });

    const customerExists = customers.some((c) => c.name.toLowerCase() === value.toLowerCase());
    setShowCustomerForm(!customerExists);

    if (value.trim()) {
      const results = fuse.search(value).map((result) => result.item);
      setSearchResults(results);
      setIsDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setFormData({ ...formData, customerId: customer._id, customerName: customer.name });
    setShowCustomerForm(false);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-extrabold text-white text-center mb-8 mt-14">
          Financial Dashboard
        </h1>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Filter Transactions</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              max={today}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Start Date"
            />
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              max={today}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="End Date"
            />
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Category Filter"
            >
              <option value="">All Categories</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={errorVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6 text-center"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

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
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
              />
            </svg>
            <p className="text-white mt-2">Loading...</p>
          </div>
        )}

        {/* Alerts */}
        {!loading && data.alerts?.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6"
          >
            {data.alerts.map((alert, index) => (
              <p key={index} className="text-sm">{alert}</p>
            ))}
          </motion.div>
        )}

        {/* Financial Metrics */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {[
              { title: 'Opening Balance', value: data.openingBalance || 0 },
              { title: 'Total Credits', value: data.totalReceivables || 0 },
              { title: 'Total Debits', value: data.totalPayables || 0 },
              { title: 'Closing Balance', value: data.balance || 0 },
            ].map((metric, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg text-center"
              >
                <h3 className="text-lg font-semibold text-gray-300">{metric.title}</h3>
                <p className="text-2xl font-bold text-indigo-400">{formatCurrency(metric.value.toFixed(2))}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Financial Overview</h3>
              <Chart type="bar" data={barChartData} options={chartOptions} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Credits vs Debits</h3>
              <Chart type="pie" data={pieChartData} options={chartOptions} />
            </motion.div>
          </div>
        )}

        {/* Transaction Table */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
            <TransactionTable
              filters={filters}
              onEdit={handleEdit}
              onDelete={handleDelete}
              refresh={refreshTrigger}
            />
          </motion.div>
        )}

        {/* Modal for Editing Transaction */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
            setFormData({
              transactionType: '',
              customerId: '',
              customerName: '',
              phone: '',
              totalAmount: '',
              payable: '',
              receivable: '',
              description: '',
              category: '',
              paymentMethod: '',
              date: new Date().toISOString().split('T')[0],
              dueDate: new Date().toISOString().split('T')[0],
              isRecurring: false,
              image: null,
              user: userid,
            });
            setError('');
            setShowCustomerForm(false);
          }}
          title="Edit Transaction"
          aria-label="Edit Transaction Modal"
        >
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

            <input
              type="text"
              placeholder="Search or add customer"
              value={formData.customerName}
              onChange={handleInputChange}
              onFocus={() => setIsDropdownOpen(!!formData.customerName)}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder-gray-400"
              required
              aria-label="Customer Name"
              ref={inputRef}
            />

            {/* Dropdown for Search Results */}
            <AnimatePresence>
              {isDropdownOpen && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
                >
                  {searchResults.map((customer) => (
                    <div
                      key={customer._id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="px-4 py-2 text-gray-800 hover:bg-indigo-100 cursor-pointer transition-colors duration-200"
                    >
                      {customer.name}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Customer Form */}
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

            <select
              value={formData.transactionType}
              onChange={(e) => setFormData({ ...formData, transactionType: e.target.value, payable: '', receivable: '' })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              required
              aria-label="Transaction Type"
            >
              <option value="">Select Transaction Type</option>
              <option value="payable">Payable (You Owe)</option>
              <option value="receivable">Receivable (Owed to You)</option>
            </select>

            <input
              type="number"
              placeholder="Total Amount"
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              required
              aria-label="Total Amount"
            />
            <input
              type="number"
              placeholder={formData.transactionType === 'payable' ? 'Amount Payable' : 'Amount Receivable'}
              value={formData.transactionType === 'payable' ? formData.payable : formData.receivable}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [formData.transactionType === 'payable' ? 'payable' : 'receivable']: e.target.value,
                })
              }
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              required
              aria-label={formData.transactionType === 'payable' ? 'Amount Payable' : 'Amount Receivable'}
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
              {categories.map((cat, index) => (
                <option key={index} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
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
              required
            />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Due Date"
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
            <input
              type="file"
              accept="image/*"
              name="transactionImage"
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg"
              aria-label="Upload Receipt Image"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
              aria-label="Update Transaction"
            >
              Update
            </button>
          </form>
        </Modal>
      </motion.div>
    </div>
  );
}