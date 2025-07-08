'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import api from '../lib/api';
import Fuse from 'fuse.js';

const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];

const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialCustomer,
  customers,
  userId,
  error,
  setError,
}) => {
  const [formData, setFormData] = useState({
    transactionType: '',
    customerId: initialCustomer?.customerId || '',
    customerName: initialCustomer?.customerName || '',
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
    user: userId || '',
  });
  const [categories, setCategories] = useState([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load categories.');
      }
    };
    fetchCategories();
  }, [setError]);

  // Initialize Fuse.js for customer search
  const fuse = new Fuse(customers, {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true,
  });

  // Update formData with userId and initialCustomer
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      user: userId || '',
      customerId: initialCustomer?.customerId || '',
      customerName: initialCustomer?.customerName || '',
    }));
  }, [userId, initialCustomer]);

  // Handle customer input change
  const handleCustomerInput = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, customerName: value });

    const customerExists = customers.some((c) => c.name.toLowerCase() === value.toLowerCase());
    setShowCustomerForm(!customerExists && value.trim() !== '');

    if (value.trim()) {
      const results = fuse.search(value).map((result) => result.item);
      setSearchResults(results);
      setIsDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setFormData({
      ...formData,
      customerId: customer._id,
      customerName: customer.name,
      phone: customer.phone || '',
    });
    setShowCustomerForm(false);
    setIsDropdownOpen(false);
  };

  // Handle new customer creation
  const handleAddCustomer = async () => {
    try {
      const { data } = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.phone,
        user: userId,
      });
      setFormData({
        ...formData,
        customerId: data._id,
        customerName: data.name,
        phone: data.phone || '',
      });
      setShowCustomerForm(false);
      setIsDropdownOpen(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer.');
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'transactionType') {
      setFormData({
        ...formData,
        transactionType: value,
        payable: '',
        receivable: '',
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (formData.transactionType === 'payable' && Number(formData.totalAmount) !== Number(formData.payable)) {
      setError('Total Amount must equal Payable for payable transactions.');
      return;
    }
    if (formData.transactionType === 'receivable' && Number(formData.totalAmount) !== Number(formData.receivable)) {
      setError('Total Amount must equal Receivable for receivable transactions.');
      return;
    }

    try {
      if (showCustomerForm) {
        const newCustomer = await handleAddCustomer();
        if (!newCustomer) return; // Stop if customer creation fails
        setFormData((prev) => ({ ...prev, customerId: newCustomer._id }));
      }
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          form.append(key === 'paymentMethod' ? 'type' : key, value);
        }
      });
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Error submitting ${formData.transactionType} transaction.`);
    }
  };

  // Handle click outside for dropdown
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
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setFormData({
          transactionType: '',
          customerId: initialCustomer?.customerId || '',
          customerName: initialCustomer?.customerName || '',
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
          user: userId || '',
        });
        setShowCustomerForm(false);
        setIsDropdownOpen(false);
        setSearchResults([]);
        setError('');
      }}
      title="New Transaction"
      aria-label="Transaction Modal"
    >
      {!formData.transactionType ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Select Transaction Type</h3>
          <button
            onClick={() => setFormData({ ...formData, transactionType: 'payable' })}
            className="w-full bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition"
            aria-label="Payable Transaction"
          >
            Payable (You Owe)
          </button>
          <button
            onClick={() => setFormData({ ...formData, transactionType: 'receivable' })}
            className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition"
            aria-label="Receivable Transaction"
          >
            Receivable (Owed to You)
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

          <div className="relative">
            <input
              type="text"
              name="customerName"
              placeholder="Search or add customer"
              value={formData.customerName}
              onChange={handleCustomerInput}
              onFocus={() => setIsDropdownOpen(!!formData.customerName)}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder-gray-400"
              required
              aria-label="Customer Name"
              disabled={!!initialCustomer}
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
                      onClick={() => handleCustomerSelect(customer)}
                      className="px-4 py-2 text-gray-800 hover:bg-indigo-100 cursor-pointer transition-colors duration-200"
                    >
                      {customer.name}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showCustomerForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-indigo-50 shadow-md border border-indigo-200 space-y-4"
              >
                <div className="flex flex-col">
                  <label className="text-sm text-indigo-700 font-medium mb-1">Phone (optional)</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
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
            name="totalAmount"
            placeholder="Total Amount"
            value={formData.totalAmount}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            required
            aria-label="Total Amount"
          />
          <input
            type="number"
            name={formData.transactionType === 'payable' ? 'payable' : 'receivable'}
            placeholder={formData.transactionType === 'payable' ? 'Amount Payable' : 'Amount Receivable'}
            value={formData.transactionType === 'payable' ? formData.payable : formData.receivable}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            required
            aria-label={formData.transactionType === 'payable' ? 'Amount Payable' : 'Amount Receivable'}
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            required
            aria-label="Transaction Description"
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            required
            aria-label="Transaction Category"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
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
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            max={today}
            required
            aria-label="Transaction Date"
          />
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            aria-label="Due Date"
          />
          <label className="flex items-center text-gray-200">
            <input
              type="checkbox"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleInputChange}
              className="mr-2 text-indigo-400 focus:ring-indigo-400"
              aria-label="Recurring Transaction"
            />
            Recurring Transaction
          </label>
          <input
            type="file"
            accept="image/*"
            name="image"
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg"
            aria-label="Upload Receipt Image"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
            aria-label="Add Transaction"
          >
            Add Transaction
          </button>
        </form>
      )}
    </Modal>
  );
};

export default TransactionModal;