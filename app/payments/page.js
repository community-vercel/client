// pages/Transactions.js
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../../components/Modal';
import TransactionTable from '../../components/TransactionTable';
import SummaryDashboard from '../../components/SummaryDashboard';
import api from '../../lib/api';
import { formatCurrency, downloadCSV } from '../utils/helpers';
import Fuse from 'fuse.js';
import ReactDOM from 'react-dom';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const DropdownPortal = ({ children, isOpen }) => {
  if (!isOpen) return null;
  return ReactDOM.createPortal(children, document.body);
};

export const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];

export default function Transactions() {
  const [suggestions, setSuggestions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [CATEGORIES, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
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
    shopId: null,
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    customerId: '',
    shopId: '',
  });
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [userid, setUserid] = useState(null);
  const [role, setRole] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const customerInputRef = useRef(null);
  const inputRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);

  const customerFuse = new Fuse(customers, { keys: ['name'], threshold: 0.3, includeScore: true });
const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('userid');
    const userRole = localStorage.getItem('role');
    const shopId = localStorage.getItem('shopId');
    if (userRole) setRole(userRole);
    if (id) setUserid(id);
    if (shopId) {
      setFormData((prev) => ({ ...prev, shopId }));
      setFilters((prev) => ({ ...prev, shopId }));
    }
    if (userRole === 'superadmin') {
      fetchShops();
    }
  }, []);

  const fetchShops = async () => {
    try {
      const response = await api.get('/shops');
      setShops(response.data);
    } catch (err) {
      console.error('Error fetching shops:', err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [suggestionsRes, customersRes, categoriesRes] = await Promise.all([
        api.get('/transactions/recurring'),
        api.get('/customers'),
        api.get('/categories'),
      ]);
      setSuggestions(suggestionsRes.data);
      setCustomers(customersRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    if (value.trim()) {
      const results = customerFuse.search(value).map((result) => result.item);
      setCustomerSearchResults(results);
      setIsCustomerDropdownOpen(true);
    } else {
      setCustomerSearchResults(customers);
      setIsCustomerDropdownOpen(true);
      setFilters({ ...filters, customerId: '' });
    }
  };

  const handleCustomerFilterSelect = (customer) => {
    setFilters({ ...filters, customerId: customer._id });
    setCustomerSearchTerm(customer.name || 'All Customers');
    setIsCustomerDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerInputRef.current && !customerInputRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (filters.customerId) {
      const selectedCustomer = customers.find((c) => c._id === filters.customerId);
      if (selectedCustomer) {
        setCustomerSearchTerm(selectedCustomer.name);
      }
    } else {
      setCustomerSearchTerm('All Customers');
    }
  }, [filters.customerId, customers]);

  const handleInputFocus = () => {
    setIsCustomerDropdownOpen(true);
    if (!customerSearchTerm.trim()) {
      setCustomerSearchResults(customers);
    }
  };

  const handleTransactionTypeSelect = (type) => {
    setFormData({ ...formData, transactionType: type, payable: '', receivable: '' });
    setEntryMode(null);
    setIsModalOpen(true);
  };

  const handleEntryModeSelect = (mode) => {
    setEntryMode(mode);
  };

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

  const handleAddCustomer = async () => {
    try {
      const { data } = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.phone,
        shopId: formData.shopId,
      });
      setFormData({ ...formData, customerId: data._id, customerName: data.name });
      setCustomers([...customers, data]);
      setShowCustomerForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer.');
    }
  };

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
        shopId: formData.shopId,
      });
      setIsModalOpen(false);
      setEntryMode(null);
      setEditingTransaction(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving transaction.');
      console.error('Submit error:', err);
    }
  };

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
      shopId: transaction.shopId,
    });
    setEntryMode('manual');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError('Error deleting transaction.');
      console.error('Delete error:', err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get(
        `/transactions/export?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}&customerId=${filters.customerId}&shopId=${filters.shopId}`,
        { responseType: 'blob' }
      );
      const transactions = response.data.transactions;
      const csvData = transactions.map((t) => ({
        Date: t.date,
        TransactionType: t.transactionType,
        Customer: customers.find((c) => c._id === t.customerId._id)?.name || t.customerId.name || '',
        TotalAmount: formatCurrency(t.totalAmount),
        Payable: formatCurrency(t.payable),
        Receivable: formatCurrency(t.receivable),
        DueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
        Category: t.category,
        Description: t.description,
        Shop: shops.find((s) => s._id === t.shopId)?.name || '',
      }));
      downloadCSV(csvData, 'transactions.csv');
    } catch (err) {
      setError('Error exporting transactions.');
      console.error('Export error:', err);
    }
  };

  const fuse = new Fuse(customers, { keys: ['name'], threshold: 0.3, includeScore: true });

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 py-28 px-4 sm:px-6 lg:px-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Transaction Management</h1>
          <p className="mt-2 text-lg text-gray-300">Track and manage your financial transactions seamlessly.</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } } }}
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

        <motion.div variants={containerVariants}>
          <SummaryDashboard filters={filters} refresh={refreshTrigger} />
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 overflow-visible"
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Start Date"
              max={new Date().toISOString().split('T')[0]}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="End Date"
              max={new Date().toISOString().split('T')[0]}
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Category Filter"
            >
              <option value="">All Categories</option>
              {CATEGORIES?.map((cat, index) => (
                <option key={index} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {role === 'superadmin' && (
              <select
                value={filters.shopId}
                onChange={(e) => setFilters({ ...filters, shopId: e.target.value })}
                className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                aria-label="Shop Filter"
              >
                <option value="">All Shops</option>
                {shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            )}
            <div className="relative w-full sm:w-auto" ref={customerInputRef}>
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearchTerm}
                onChange={handleCustomerSearchChange}
                onFocus={handleInputFocus}
                className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition w-full pr-10"
                aria-label="Customer Filter"
              />
              {customerSearchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearchTerm('');
                    setFilters({ ...filters, customerId: '' });
                    setCustomerSearchResults(customers);
                    setIsCustomerDropdownOpen(true);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label="Clear customer search"
                >
                  ✕
                </button>
              )}
              <AnimatePresence>
                {isCustomerDropdownOpen && (
                  <DropdownPortal isOpen={isCustomerDropdownOpen}>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      style={{
                        position: 'fixed',
                        top: customerInputRef.current?.getBoundingClientRect().bottom + window.scrollY + 4 || 0,
                        left: customerInputRef.current?.getBoundingClientRect().left + window.scrollX || 0,
                        width: customerInputRef.current?.offsetWidth || 'auto',
                        zIndex: 9999,
                      }}
                    >
                      <div
                        className="px-4 py-2 text-white hover:bg-indigo-600 cursor-pointer transition-colors"
                        onClick={() => handleCustomerFilterSelect({ _id: '', name: 'All Customers' })}
                      >
                        All Customers
                      </div>
                      {customerSearchResults.map((customer) => (
                        <div
                          key={customer._id}
                          className="px-4 py-2 text-white hover:bg-indigo-600 cursor-pointer transition-colors"
                          onClick={() => handleCustomerFilterSelect(customer)}
                        >
                          {customer.name}
                        </div>
                      ))}
                    </motion.div>
                  </DropdownPortal>
                )}
              </AnimatePresence>
            </div>
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
            <p className="text-white mt-2">Loading data...</p>
          </div>
        )}

        {!loading && suggestions.length > 0 && (
          <motion.div
            variants={containerVariants}
            className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl relative"
            style={{ zIndex: 1 }}
          >
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
                    {s.description} ({s.category}) - {formatCurrency(s.totalAmount)}
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

        {!loading && (
          <motion.div variants={containerVariants} className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl z-[10]">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
            <TransactionTable
              filters={filters}
              onEdit={handleEdit}
              onDelete={handleDelete}
              refresh={refreshTrigger}
            />
          </motion.div>
        )}

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
              shopId: formData.shopId,
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
                onClick={() => handleTransactionTypeSelect('payable')}
                className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition"
                aria-label="Payable Transaction"
              >
                Payable (You Owe)
              </button>
              <button
                onClick={() => handleTransactionTypeSelect('receivable')}
                className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition"
                aria-label="Receivable Transaction"
              >
                Receivable (Owed to You)
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
                  name="transactionImage"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg"
                  aria-label="Upload Receipt Image"
                />
              )}
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
                placeholder="Total Amount"
                value={formData.totalAmount}
                onChange={(e) => {
                  const totalAmount = e.target.value;
                  setFormData({
                    ...formData,
                    totalAmount,
                    [formData.transactionType === 'payable' ? 'payable' : 'receivable']: totalAmount,
                  });
                }}
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
                aria-label="Transaction Description"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
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
                max={new Date().toISOString().split('T')[0]}
                required
              />
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                aria-label="Due Date"
              />
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