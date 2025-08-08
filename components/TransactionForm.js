'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import Fuse from 'fuse.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];

const TransactionForm = ({
  formData,
  setFormData,
  customers,
  setCustomers,
  categories,
  shops,
  customerSearchTerm,
  setCustomerSearchTerm,
  customerSearchResults,
  setCustomerSearchResults,
  showCustomerForm,
  setShowCustomerForm,
  isDropdownOpen,
  setIsDropdownOpen,
  inputRef,
  role,
  shopId,
  isEditing = false,
  transactionId,
}) => {
  const router = useRouter();
  const [error, setError] = useState('');
  const [entryMode, setEntryMode] = useState(null);
  const dropdownRef = useRef(null);
  const shopIdToUse = formData.shopId || shopId;

  // Filter customers by shopId
  const filteredCustomers = customers.filter(customer => customer.shopId === shopIdToUse);
  const customerFuse = new Fuse(filteredCustomers, { keys: ['name'], threshold: 0.3, includeScore: true });

  // Update customer search results when filteredCustomers or shopIdToUse changes
  useEffect(() => {
    setCustomerSearchResults(filteredCustomers);
  }, [filteredCustomers, shopIdToUse]);

  // Customer search functionality
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    setFormData(prev => ({ ...prev, customerName: value }));

    const customerExists = filteredCustomers.some(c => c.name.toLowerCase() === value.toLowerCase());
    setShowCustomerForm(!customerExists && value.trim() !== '');

    if (value.trim()) {
      const results = customerFuse.search(value).map(result => result.item);
      setCustomerSearchResults(results.length > 0 ? results : filteredCustomers);
      setIsDropdownOpen(true);
    } else {
      setCustomerSearchResults(filteredCustomers);
      setIsDropdownOpen(false);
    }
  };

  const handleCustomerSelect = async (e, customer) => {
    e.stopPropagation();
    console.log('Selected customer:', customer);
    try {
      if (!shopIdToUse) {
        setError('Shop context required for customer operations');
        return;
      }

      const { data } = await api.post('/customers/find-or-create', {
        name: customer.name,
        phone: customer.phone || '',
        shopId: shopIdToUse,
      });

      setFormData(prev => ({
        ...prev,
        customerId: data._id,
        customerName: data.name,
      }));
      setCustomerSearchTerm(data.name);
      setShowCustomerForm(false);
      setIsDropdownOpen(false);

      const existingCustomer = customers.find(c => c._id === data._id);
      if (!existingCustomer) {
        setCustomers(prev => [...prev, data]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing customer.');
      console.error('Customer select error:', err);
    }
  };

  const handleClearCustomer = () => {
    setFormData(prev => ({
      ...prev,
      customerId: '',
      customerName: '',
      phone: '',
    }));
    setCustomerSearchTerm('');
    setShowCustomerForm(false);
    setIsDropdownOpen(false);
  };

  const handleAddCustomer = async () => {
    try {
      if (!shopIdToUse) {
        setError('Shop context required for adding customers');
        return;
      }

      const { data } = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.phone,
        shopId: shopIdToUse,
      });

      setFormData(prev => ({
        ...prev,
        customerId: data._id,
        customerName: data.name,
      }));
      setCustomerSearchTerm(data.name);
      setCustomerSearchResults(prev => [...prev, data]);
      setCustomers(prev => [...prev, data]);
      setShowCustomerForm(false);
      setIsDropdownOpen(false);
      toast.success('Customer added successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer.');
      console.error('Add customer error:', err);
    }
  };

  const handleSubmit = async (e, addAnother = false) => {
    e.preventDefault();
    setError('');

    if (!formData.customerId) {
      setError('Please select or add a customer');
      return;
    }
    if (!formData.totalAmount || formData.totalAmount <= 0) {
      setError('Please enter a valid total amount');
      return;
    }
    if (!formData.paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    if (!shopIdToUse) {
      setError('Shop context required for transaction');
      return;
    }

    try {
      const form = new FormData();
      const transactionData = {
        ...formData,
        shopId: shopIdToUse,
      };

      Object.entries(transactionData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          form.append(key === 'paymentMethod' ? 'type' : key, value);
        }
      });

      if (isEditing && transactionId) {
        await api.put(`/transactions/${transactionId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Transaction updated successfully');
        router.push('/transactions');
      } else {
        await api.post('/transactions', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Transaction created successfully');

        if (addAnother) {
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
            user: formData.user,
            shopId: shopIdToUse,
          });
          setCustomerSearchTerm('');
          setCustomerSearchResults(filteredCustomers);
          setShowCustomerForm(false);
          setIsDropdownOpen(false);
          setEntryMode(null);
        } else {
          router.push('/transactions');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving transaction.');
      console.error('Submit error:', err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-red-100 text-red-700 p-4 rounded-lg text-center"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!formData.transactionType ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Select Transaction Type</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, transactionType: 'payable', payable: '', receivable: '' }))}
                className="w-full bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                aria-label="Payable Transaction"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2M7 7h10" />
                </svg>
                Payable (You Owe Money)
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, transactionType: 'receivable', payable: '', receivable: '' }))}
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Select Entry Mode</h3>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setEntryMode('upload')}
                className="w-full bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                aria-label="Upload Image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Receipt Image
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('manual')}
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
          <div className="space-y-6">
            {role === 'superadmin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Shop</label>
                <select
                  name="shopId"
                  value={formData.shopId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, shopId: e.target.value }))}
                  className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                >
                  <option value="">Select Shop</option>
                  <option value="all">All Shops</option>
                  {shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700">Customer</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search or add customer"
                  value={customerSearchTerm}
                  onChange={handleCustomerSearchChange}
                  onFocus={() => setIsDropdownOpen(!!customerSearchTerm || filteredCustomers.length > 0)}
                  className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors pr-10"
                  required
                  ref={inputRef}
                />
                {customerSearchTerm && (
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear customer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {isDropdownOpen && customerSearchResults.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {customerSearchResults.map((customer) => (
                    <div
                      key={customer._id}
                      onClick={(e) => handleCustomerSelect(e, customer)}
                      className="px-4 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
                    >
                      {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence>
              {showCustomerForm && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-lg bg-indigo-50 shadow-md border border-indigo-200 space-y-4">
                    <h4 className="text-lg font-semibold text-indigo-800">Add New Customer</h4>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-indigo-700">Phone (optional)</label>
                      <input
                        type="tel"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full p-3 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomer}
                      className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium shadow-sm transform hover:scale-105"
                    >
                      Add Customer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {entryMode === 'upload' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Upload Receipt</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
                  className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Amount</label>
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
                  className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
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
                  className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                placeholder="Enter transaction description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat, index) => (
                    <option key={cat._id || index} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date (optional)</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 text-sm font-medium transition-colors shadow-md"
              >
                {isEditing ? 'Update Transaction' : 'Save Transaction'}
              </button>
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  className="flex-1 p-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:from-teal-600 hover:to-cyan-700 text-sm font-medium transition-colors shadow-md"
                >
                  Save and Add Another
                </button>
              )}
              <Link
                href="/transactions"
                className="flex-1 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default TransactionForm;