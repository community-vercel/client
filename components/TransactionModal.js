'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import api from '../lib/api';
 const CATEGORIES = [
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

const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];

const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialCustomer,
  customers,

  error,
  setError,
}) => {
  const [formData, setFormData] = useState({
    transactionType: '',
    customerId: initialCustomer?.customerId || '',
    customerName: initialCustomer?.customerName || '',
    phone: '',
    amount: '',
    description: '',
    category: '',
    type: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    image: null,
    user: '',
  });
  const [entryMode, setEntryMode] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [userid, setUserid] = useState(null);
  useEffect(() => {
    const id = localStorage.getItem('userid');
    if (id) setUserid(id);
  }, []);

  // Update formData with user ID
 
  useEffect(() => {
    if (initialCustomer) {
      setFormData((prev) => ({
        ...prev,
         user: userid,
        customerId: initialCustomer.customerId,
        customerName: initialCustomer.customerName,
      }));
    }
  }, [initialCustomer]);

  const handleTransactionTypeSelect = (type) => {
    setFormData({ ...formData, transactionType: type });
    setEntryMode(null);
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
        setShowCustomerForm(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error finding or creating customer');
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
      setShowCustomerForm(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (showCustomerForm) {
        const newCustomer = await handleAddCustomer();
        setFormData((prev) => ({ ...prev, customerId: newCustomer._id }));
      }
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) form.append(key, value);
      });
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || `Error submitting ${formData.transactionType}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
  };

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
          amount: '',
          description: '',
          category: '',
          type: '',
          date: new Date().toISOString().split('T')[0],
          isRecurring: false,
          image: null,
          user: userId,
        });
        setEntryMode(null);
        setShowCustomerForm(false);
      }}
      title="New Transaction"
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
              name="image"
              accept="image/*"
              onChange={handleInputChange}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg"
              aria-label="Upload Receipt Image"
            />
          )}

          <input
            type="text"
            name="customerName"
            placeholder="Search or add customer"
            value={formData.customerName}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            list="customers"
            required
            aria-label="Customer Name"
            disabled={!!initialCustomer}
          />
          <datalist id="customers">
            {customers.map((c) => (
              <option key={c._id} value={c.name} />
            ))}
          </datalist>

          <AnimatePresence>
            {showCustomerForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone (optional)"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  aria-label="Customer Phone"
                />
                <button
                  type="button"
                  onClick={handleAddCustomer}
                  className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"
                  aria-label="Add New Customer"
                >
                  Add Customer
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={formData.amount}
            onChange={handleInputChange}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            required
            aria-label="Transaction Amount"
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
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            name="type"
            value={formData.type}
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
            aria-label="Transaction Date"
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
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
            aria-label="Add Transaction"
          >
            Add
          </button>
        </form>
      )}
    </Modal>
  );
};

export default TransactionModal;