// pages/Transactions.js - Enhanced with proper shop management
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
import Link from 'next/link';

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
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const customerFuse = new Fuse(customers, { keys: ['name'], threshold: 0.3, includeScore: true });

  // Initialize user data and shop context
 useEffect(() => {
    const initializeUserData = async () => {
      try {
        const id = localStorage.getItem('userid');
        const userRole = localStorage.getItem('role');
        const shopId = localStorage.getItem('shopId');

        if (userRole) setRole(userRole);
        if (id) setUserid(id);

        if (userRole === 'superadmin') {
          await fetchShops();
          // For superadmin, set initial filter to 'all' or first shop
          if (shopId) {
            setFilters(prev => ({ ...prev, shopId }));
            setFormData(prev => ({ ...prev, shopId }));
          }
        } else if (shopId) {
          // For non-superadmin users, validate and set shop immediately
          await validateAndSetShop(shopId);
          // Set shopId in filters and formData to ensure data fetching and form submission work
          setFilters(prev => ({ ...prev, shopId }));
          setFormData(prev => ({ ...prev, shopId, user: id }));
        } else {
          setError('No shop assigned to user. Please contact administrator.');
          setLoading(false);
          return;
        }

        // Trigger data fetch after shop context is set
        if (shopId || userRole === 'superadmin') {
          await fetchData();
        }
      } catch (err) {
        console.error('Error initializing user data:', err);
        setError('Failed to initialize user data');
        setLoading(false);
      }
    };

    initializeUserData();
  }, []);

  // Validate and set shop for regular users
  const validateAndSetShop = async (shopId) => {
    try {
      const response = await api.get(`/shops/${shopId}`);
      setCurrentShop(response.data);
      setFilters(prev => ({ ...prev, shopId }));
      setFormData(prev => ({ ...prev, shopId }));
    } catch (err) {
      console.error('Error validating shop:', err);
      setError('Invalid shop assignment. Please contact administrator.');
    }
  };

  // Fetch shops (for superadmin)
  const fetchShops = async () => {
    try {
      const response = await api.get('/shops');
      setShops(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching shops:', err);
      setError('Failed to load shops');
      return [];
    }
  };

  // Fetch data based on current shop context
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const shopParam = filters.shopId || (role === 'superadmin' ? 'all' : currentShop?._id || '');

      // if ( role !== 'superadmin') {
      //   setError('No shop context available for data fetching.');
      //   setLoading(false);
      //   return;
      // }

      const [customersRes, categoriesRes] = await Promise.all([
        api.get(`/customers?shopId=${shopParam}`),
        api.get(`/categories?shopId=${shopParam}`),
      ]);

      setCustomers(customersRes.data || []);
      setCategories(categoriesRes.data || []);

      // Update customer search results when customers change
      setCustomerSearchResults(customersRes.data || []);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.shopId, role, currentShop]);

  // Fetch data when shop context changes
  useEffect(() => {
    if (filters.shopId || role === 'superadmin') {
      fetchData();
    }
  }, [filters.shopId, role, fetchData]);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const shopId = formData.shopId || filters.shopId;
    if (!shopId) {
      setError('Shop context required for transaction');
      return;
    }

    try {
      const form = new FormData();

      // Ensure shop context is included
      const transactionData = {
        ...formData,
        shopId,
        user: userid,
      };

      Object.entries(transactionData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          form.append(key === 'paymentMethod' ? 'type' : key, value);
        }
      });

      const endpoint = editingTransaction
        ? `/transactions/${editingTransaction._id}`
        : `/transactions`;
      const method = editingTransaction ? api.put : api.post;

      await method(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Reset form
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
        image: null,
        user: userid,
        shopId,
      });

      setIsModalOpen(false);
      setEntryMode(null);
      setEditingTransaction(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving transaction.');
      console.error('Submit error:', err);
    }
  };

  // Fetch data when shop context changes
  useEffect(() => {
    if ((filters.shopId && role !== 'superadmin') || role === 'superadmin') {
      fetchData();
    }
  }, [fetchData, filters.shopId, role]);

  // Handle shop change (for superadmin)
  const handleShopChange = (newShopId) => {
    setFilters(prev => ({ ...prev, shopId: newShopId, customerId: '' }));
    setFormData(prev => ({ ...prev, shopId: newShopId }));
    setCustomerSearchTerm('');
    setRefreshTrigger(prev => prev + 1);
  };

  // Customer search functionality
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
      setFilters(prev => ({ ...prev, customerId: '' }));
    }
  };

  const handleCustomerFilterSelect = (customer) => {
    setFilters(prev => ({ ...prev, customerId: customer._id }));
    setCustomerSearchTerm(customer.name || 'All Customers');
    setIsCustomerDropdownOpen(false);
  };

  const handleInputFocus = () => {
    setIsCustomerDropdownOpen(true);
    if (!customerSearchTerm.trim()) {
      setCustomerSearchResults(customers);
    }
  };

  // Transaction type selection
  const handleTransactionTypeSelect = (type) => {
    setFormData(prev => ({ 
      ...prev, 
      transactionType: type, 
      payable: '', 
      receivable: '',
      shopId: filters.shopId || prev.shopId 
    }));
    setEntryMode(null);
    setIsModalOpen(true);
  };

  const handleEntryModeSelect = (mode) => {
    setEntryMode(mode);
  };

  // Customer selection in form
  const handleCustomerSelect = async (name) => {
    if (!name) return;
    
    try {
      const shopId = formData.shopId || filters.shopId;
      if (!shopId) {
        setError('Shop context required for customer operations');
        return;
      }
      
      const { data } = await api.post('/customers/find-or-create', { 
        name, 
        phone: formData.phone,
        shopId 
      });
      
      setFormData(prev => ({ 
        ...prev, 
        customerId: data._id, 
        customerName: data.name 
      }));
      
      // Update customers list if new customer was created
      const existingCustomer = customers.find(c => c._id === data._id);
      if (!existingCustomer) {
        setCustomers(prev => [...prev, data]);
      }
      
      setShowCustomerForm(false);
    } catch (err) {
      setError('Error processing customer. Please try again.');
      console.error('Customer select error:', err);
    }
  };

  const handleAddCustomer = async () => {
    try {
      const shopId = formData.shopId || filters.shopId;
      if (!shopId) {
        setError('Shop context required for adding customers');
        return;
      }
      
      const { data } = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.phone,
        shopId,
      });
      
      setFormData(prev => ({ 
        ...prev, 
        customerId: data._id, 
        customerName: data.name 
      }));
      setCustomers(prev => [...prev, data]);
      setShowCustomerForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer.');
      console.error('Add customer error:', err);
    }
  };

  // Form submission
 

  // Edit transaction
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    
    const customer = customers.find(c => c._id === transaction.customerId._id) || 
                   transaction.customerId;
    
    setFormData({
      transactionType: transaction.transactionType,
      customerId: customer._id,
      customerName: customer.name || '',
      phone: '',
      totalAmount: transaction.totalAmount || '',
      payable: transaction.payable || '',
      receivable: transaction.receivable || '',
      description: transaction.description,
      category: transaction.category,
      paymentMethod: transaction.type || '',
      date: transaction.date.split('T')[0],
      dueDate: transaction.dueDate 
        ? transaction.dueDate.split('T')[0] 
        : new Date().toISOString().split('T')[0],
      image: null,
      user: userid,
      shopId: transaction.shopId,
    });
    
    setEntryMode('manual');
    setIsModalOpen(true);
  };

  // Delete transaction
  const handleDelete = async (id) => {
    try {
      await api.delete(`/transactions/${id}`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError('Error deleting transaction.');
      console.error('Delete error:', err);
    }
  };

  // Export functionality
  const handleExport = async () => {
    try {
      const shopParam = filters.shopId || (role === 'superadmin' ? 'all' : '');
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        category: filters.category,
        customerId: filters.customerId,
        shopId: shopParam,
      });
      
      const response = await api.get(`/transactions/export?${queryParams}`, {
        responseType: 'json'
      });
      
      const transactions = response.data.transactions || [];
      
      const csvData = transactions.map((t) => ({
        Date: new Date(t.date).toLocaleDateString(),
        TransactionType: t.transactionType,
        Customer: t.customerId?.name || 'Unknown',
        TotalAmount: formatCurrency(t.totalAmount),
        Payable: formatCurrency(t.payable),
        Receivable: formatCurrency(t.receivable),
        DueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
        Category: t.category,
        Description: t.description,
        Shop: shops.find(s => s._id === t.shopId)?.name || currentShop?.name || '',
      }));
      
      downloadCSV(csvData, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    } catch (err) {
      setError('Error exporting transactions.');
      console.error('Export error:', err);
    }
  };

  // Customer search in form
  const fuse = new Fuse(customers, { keys: ['name'], threshold: 0.3, includeScore: true });

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, customerName: value }));
    
    const customerExists = customers.some(c => 
      c.name.toLowerCase() === value.toLowerCase()
    );
    setShowCustomerForm(!customerExists && value.trim() !== '');
    
    if (value.trim()) {
      const results = fuse.search(value).map(result => result.item);
      setSearchResults(results);
      setIsDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    setFormData(prev => ({ 
      ...prev, 
      customerId: customer._id, 
      customerName: customer.name 
    }));
    setShowCustomerForm(false);
    setIsDropdownOpen(false);
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerInputRef.current && !customerInputRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
      }
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update customer search term based on filter
  useEffect(() => {
    if (filters.customerId) {
      const selectedCustomer = customers.find(c => c._id === filters.customerId);
      if (selectedCustomer) {
        setCustomerSearchTerm(selectedCustomer.name);
      }
    } else {
      setCustomerSearchTerm('All Customers');
    }
  }, [filters.customerId, customers]);

  // Show loading state while initializing
  if (loading && !shops.length && role === 'superadmin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
          </svg>
          <p className="text-white mt-2">Initializing transaction system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-purple-950 py-28 px-4 sm:px-6 lg:px-8">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">Transaction Management</h1>
          <p className="mt-2 text-lg text-gray-300">
            Track and manage your financial transactions seamlessly
            {currentShop && ` - ${currentShop.name}`}
            {role === 'superadmin' && filters.shopId === 'all' && ' - All Shops'}
          </p>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={{ 
                hidden: { opacity: 0, scale: 0.95 }, 
                visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } } 
              }}
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
        <motion.div variants={containerVariants}>
          <SummaryDashboard filters={filters} refresh={refreshTrigger} />
        </motion.div>

        {/* Filters and Actions */}
        <motion.div
          variants={containerVariants}
          className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 overflow-visible"
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Date Filters */}
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Start Date"
              max={new Date().toISOString().split('T')[0]}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="End Date"
              max={new Date().toISOString().split('T')[0]}
            />
            
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Category Filter"
            >
              <option value="">All Categories</option>
              {categories.map((cat, index) => (
                <option key={cat._id || index} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            
            {/* Shop Filter (Superadmin only) */}
            {role === 'superadmin' && (
              <select
                value={filters.shopId}
                onChange={(e) => handleShopChange(e.target.value)}
                className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                aria-label="Shop Filter"
              >
                <option value="">Select Shop</option>
                <option value="all">All Shops</option>
                {shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            )}
            
            {/* Customer Filter */}
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
              {customerSearchTerm && customerSearchTerm !== 'All Customers' && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearchTerm('All Customers');
                    setFilters(prev => ({ ...prev, customerId: '' }));
                    setCustomerSearchResults(customers);
                    setIsCustomerDropdownOpen(true);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label="Clear customer search"
                >
                  ✕
                </button>
              )}
              
              {/* Customer Dropdown */}
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
                        top: (customerInputRef.current?.getBoundingClientRect().bottom + window.scrollY + 4) || 0,
                        left: (customerInputRef.current?.getBoundingClientRect().left + window.scrollX) || 0,
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
          
          {/* Action Buttons */}
           <div className="flex gap-4">
            <Link
              href="/payments/add-transaction"
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
              aria-label="Add Transaction"
            >
              Add Transaction
            </Link>
            <button
              onClick={handleExport}
              disabled={loading}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50"
              aria-label="Export to CSV"
            >
              Export CSV
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <svg className="animate-spin h-8 w-8 text-indigo-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
            </svg>
            <p className="text-white mt-2">Loading transactions...</p>
          </div>
        )}

        {/* Transaction Table */}
        {!loading && (filters.shopId || role === 'superadmin') && (
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

        {/* No Shop Selected State */}
        {!loading && !filters.shopId && role !== 'superadmin' && (
          <motion.div variants={containerVariants} className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-8 rounded-xl shadow-xl text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0v-1a1 1 0 011-1h1m0 0V9a2 2 0 012-2h2a2 2 0 012 2v8.1M9 21h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Shop Context</h3>
            <p className="text-gray-300 mb-4">Please contact your administrator to assign you to a shop.</p>
          </motion.div>
        )}

        {/* Transaction Modal */}
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
              image: null,
              user: userid,
              shopId: filters.shopId,
            });
            setError('');
            setShowCustomerForm(false);
          }}
          title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
          aria-label="Transaction Modal"
        >
          {!formData.transactionType ? (
            /* Transaction Type Selection */
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select Transaction Type</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleTransactionTypeSelect('payable')}
                  className="w-full bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                  aria-label="Payable Transaction"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2M7 7h10" />
                  </svg>
                  Payable (You Owe Money)
                </button>
                <button
                  onClick={() => handleTransactionTypeSelect('receivable')}
                  className="w-full bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                  aria-label="Receivable Transaction"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Receivable (Money Owed to You)
                </button>
              </div>
            </div>
          ) : !entryMode ? (
            /* Entry Mode Selection */
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Select Entry Mode</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleEntryModeSelect('upload')}
                  className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                  aria-label="Upload Image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Receipt Image
                </button>
                <button
                  onClick={() => handleEntryModeSelect('manual')}
                  className="w-full bg-indigo-500 text-white p-4 rounded-lg hover:bg-indigo-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                  aria-label="Manual Entry"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Manual Entry
                </button>
              </div>
            </div>
          ) : (
            /* Transaction Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-center bg-red-900 bg-opacity-30 p-3 rounded-lg"
                    role="alert"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Shop Context Display */}
              {(currentShop || (role === 'superadmin' && filters.shopId)) && (
                <div className="bg-indigo-900 bg-opacity-30 p-3 rounded-lg">
                  <p className="text-sm text-indigo-200">
                    <strong>Shop:</strong> {
                      currentShop?.name || 
                      shops.find(s => s._id === filters.shopId)?.name || 
                      'Unknown Shop'
                    }
                  </p>
                </div>
              )}

              {/* Image Upload */}
              {entryMode === 'upload' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Upload Receipt</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    aria-label="Upload Receipt Image"
                  />
                </div>
              )}

              {/* Customer Selection */}
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-300">Customer</label>
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
                
                {/* Customer Suggestions Dropdown */}
                <AnimatePresence>
                  {isDropdownOpen && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
                    >
                      {searchResults.map((customer) => (
                        <div
                          key={customer._id}
                          onClick={() => handleSelectCustomer(customer)}
                          className="px-4 py-3 text-gray-800 hover:bg-indigo-50 cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{customer.name}</div>
                          {customer.phone && (
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* New Customer Form */}
              <AnimatePresence>
                {showCustomerForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-indigo-50 shadow-md border border-indigo-200 space-y-4">
                      <h4 className="text-lg font-semibold text-indigo-800">Add New Customer</h4>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-indigo-700">Phone (optional)</label>
                        <input
                          type="tel"
                          placeholder="Enter phone number"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full p-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                          aria-label="Customer Phone"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleAddCustomer}
                        className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium shadow-sm transform hover:scale-105"
                        aria-label="Add New Customer"
                      >
                        Add Customer
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Amount Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalAmount}
                    onChange={(e) => {
                      const totalAmount = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        totalAmount,
                        [prev.transactionType === 'payable' ? 'payable' : 'receivable']: totalAmount,
                      }));
                    }}
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    required
                    aria-label="Total Amount"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    {formData.transactionType === 'payable' ? 'Amount Payable' : 'Amount Receivable'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.transactionType === 'payable' ? formData.payable : formData.receivable}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        [prev.transactionType === 'payable' ? 'payable' : 'receivable']: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    required
                    aria-label={formData.transactionType === 'payable' ? 'Amount Payable' : 'Amount Receivable'}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  placeholder="Enter transaction description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder-gray-400 resize-none"
                  rows={3}
                  aria-label="Transaction Description"
                />
              </div>

              {/* Category and Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    aria-label="Transaction Category"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat, index) => (
                      <option key={cat._id || index} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
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
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Transaction Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    aria-label="Transaction Date"
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Due Date (optional)</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    aria-label="Due Date"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition transform hover:scale-105 flex items-center justify-center gap-2"
                aria-label={editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              >
                {editingTransaction ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Update Transaction
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Transaction
                  </>
                )}
              </button>
            </form>
          )}
        </Modal>
      </motion.div>
    </div>
  );
}