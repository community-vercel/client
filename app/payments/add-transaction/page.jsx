'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../lib/api';
import Fuse from 'fuse.js';

const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];

export default function AddTransaction() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [role, setRole] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);
  const [userid, setUserid] = useState(null);
  
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
  
  const [entryMode, setEntryMode] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const inputRef = useRef(null);

  // Initialize user data and shop context
  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const userRole = localStorage.getItem('role');
        const storedShopId = localStorage.getItem('shopId');
        const userId = localStorage.getItem('userid');

        if (userRole) setRole(userRole);
        if (storedShopId) setShopId(storedShopId);
        if (userId) {
          setUserid(userId);
          setFormData(prev => ({ ...prev, user: userId }));
        }

        if (!token) {
          router.push('/auth/signin');
          return;
        }

        if (userRole !== 'superadmin' && !storedShopId) {
          setError('No shop assigned to user. Please contact administrator.');
          setLoading(false);
          return;
        }

        if (userRole === 'superadmin') {
          const response = await api.get('/shops');
          setShops(response.data || []);
        } else if (storedShopId) {
          // For non-superadmin users, set the shop context immediately
          setFormData(prev => ({ ...prev, shopId: storedShopId }));
        }

        // Fetch data based on user role and shop context
        const shopParam = userRole === 'superadmin' && formData.shopId 
          ? formData.shopId 
          : storedShopId;
          
        if (shopParam) {
          await fetchShopSpecificData(shopParam);
        }
      } catch (err) {
        console.error('Error initializing user data:', err);
        setError('Failed to initialize user data');
        setLoading(false);
      }
    };

    initializeUserData();
  }, [router, token]);

  // Fetch customers and categories for specific shop only
  const fetchShopSpecificData = useCallback(async (selectedShopId) => {
    if (!selectedShopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const [customersRes, categoriesRes] = await Promise.all([
        api.get(`/customers?shopId=${selectedShopId}`),
        api.get(`/categories?shopId=${selectedShopId}`),
      ]);

      setCustomers(customersRes.data || []);
      setCategories(categoriesRes.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load shop data. Please try again later.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle shop change (for superadmin) - fetch shop-specific data
  const handleShopChange = (newShopId) => {
    setFormData(prev => ({ ...prev, shopId: newShopId }));
    if (newShopId) {
      fetchShopSpecificData(newShopId);
    } else {
      setCustomers([]);
      setCategories([]);
    }
  };

  // Transaction type selection
  const handleTransactionTypeSelect = (type) => {
    setFormData(prev => ({ 
      ...prev, 
      transactionType: type, 
      payable: '', 
      receivable: '',
    }));
  };

  // Entry mode selection
  const handleEntryModeSelect = (mode) => {
    setEntryMode(mode);
  };

  // Customer search in form - only searches current shop's customers
  const fuse = new Fuse(customers, { keys: ['name'], threshold: 0.3, includeScore: true });

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, customerName: value }));
    
    // Check if customer exists in current shop's customer list only
    const customerExists = customers.some(c => 
      c.name.toLowerCase() === value.toLowerCase()
    );
    setShowCustomerForm(!customerExists && value.trim() !== '');
    
    if (value.trim()) {
      // Search only in current shop's customers
      const results = fuse.search(value).map(result => result.item);
      setSearchResults(results);
      setIsDropdownOpen(results.length > 0);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleSelectCustomer = (customer) => {
    console.log('Selecting customer:', customer);
    setFormData(prev => ({ 
      ...prev, 
      customerId: customer._id, 
      customerName: customer.name 
    }));
    setShowCustomerForm(false);
    setIsDropdownOpen(false);
    setSearchResults([]);
    
    // Stop event propagation to prevent any parent handlers
    event.stopPropagation();
  };

  // Add new customer - only to current shop
  const handleAddCustomer = async () => {
    try {
      const shopIdToUse = formData.shopId || shopId;
      if (!shopIdToUse) {
        setError('Shop context required for adding customers');
        return;
      }
      
      const { data } = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.phone,
        shopId: shopIdToUse, // Add customer to current shop only
      });
      
      setFormData(prev => ({ 
        ...prev, 
        customerId: data._id, 
        customerName: data.name 
      }));
      // Add new customer to current shop's customer list
      setCustomers(prev => [...prev, data]);
      setShowCustomerForm(false);
      toast.success('Customer added successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer.');
      console.error('Add customer error:', err);
    }
  };

  // Form submission
  const handleSubmit = async (e, addAnother = false) => {
    e.preventDefault();
    setError('');
    setSaveAndAddAnother(addAnother);

    const shopIdToUse = formData.shopId || shopId;
    if (!shopIdToUse) {
      setError('Shop context required for transaction');
      return;
    }

    try {
      const form = new FormData();

      // Ensure shop context is included
      const transactionData = {
        ...formData,
        shopId: shopIdToUse,
        user: userid,
      };

      Object.entries(transactionData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          form.append(key === 'paymentMethod' ? 'type' : key, value);
        }
      });

      await api.post('/transactions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Transaction added successfully!');
      
      if (addAnother) {
        // Reset form but keep shop context and current customer
        const currentCustomer = {
          customerId: formData.customerId,
          customerName: formData.customerName
        };
        
        setFormData({
          transactionType: '',
          customerId: currentCustomer.customerId,
          customerName: currentCustomer.customerName,
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
          shopId: shopIdToUse,
        });
        setEntryMode(null);
        setShowCustomerForm(false);
        setIsDropdownOpen(false);
        setSearchResults([]);
      } else {
        // Redirect back to transactions page
        setTimeout(() => {
          router.push('/dashboard/transactions');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving transaction.');
      console.error('Submit error:', err);
    } finally {
      setSaveAndAddAnother(false);
    }
  };

  // Click outside handler - Fixed to properly handle dropdown closing
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        // Only close if not clicking on a dropdown item
        const isDropdownClick = event.target.closest('.customer-dropdown-item');
        if (!isDropdownClick) {
          setIsDropdownOpen(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch shop-specific data when formData.shopId changes (for superadmin)
  useEffect(() => {
    if (role === 'superadmin' && formData.shopId) {
      fetchShopSpecificData(formData.shopId);
    }
  }, [formData.shopId, role, fetchShopSpecificData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-sans py-20">
      <ToastContainer theme="colored" position="top-right" />
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center" role="alert">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Transaction</h2>
          
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading...</p>
            </div>
          ) : (
            <>
              {/* Shop Selection for Superadmin */}
              {role === 'superadmin' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Shop</label>
                  <select
                    value={formData.shopId || ''}
                    onChange={(e) => handleShopChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  >
                    <option value="">Select Shop</option>
                    {shops.map((shop) => (
                      <option key={shop._id} value={shop._id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Show form only if shop is selected or user is not superadmin */}
              {((role === 'superadmin' && formData.shopId) || role !== 'superadmin') && (
                <>
                  {!formData.transactionType ? (
                    /* Transaction Type Selection */
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Select Transaction Type</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => handleTransactionTypeSelect('payable')}
                          className="bg-red-500 text-white p-4 rounded-lg hover:bg-red-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                        >
                          Payable (You Owe Money)
                        </button>
                        <button
                          onClick={() => handleTransactionTypeSelect('receivable')}
                          className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                        >
                          Receivable (Money Owed to You)
                        </button>
                      </div>
                    </div>
                  ) : !entryMode ? (
                    /* Entry Mode Selection */
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Select Entry Mode</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => handleEntryModeSelect('upload')}
                          className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                        >
                          Upload Receipt Image
                        </button>
                        <button
                          onClick={() => handleEntryModeSelect('manual')}
                          className="bg-indigo-500 text-white p-4 rounded-lg hover:bg-indigo-600 transition transform hover:scale-105 flex items-center justify-center gap-3"
                        >
                          Manual Entry
                        </button>
                      </div>
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, transactionType: '' }))}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        ← Back to Transaction Type
                      </button>
                    </div>
                  ) : (
                    /* Transaction Form */
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Transaction Details</h3>
                        <button
                          type="button"
                          onClick={() => setEntryMode(null)}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          ← Back to Entry Mode
                        </button>
                      </div>

                      {/* Image Upload */}
                      {entryMode === 'upload' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Upload Receipt</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          />
                        </div>
                      )}

                      {/* Customer Selection - Shows only current shop's customers */}
                      <div className="space-y-2 relative">
                        <label className="block text-sm font-medium text-gray-700">Customer</label>
                        <input
                          type="text"
                          placeholder="Search or add customer"
                          value={formData.customerName}
                          onChange={handleInputChange}
                          onFocus={() => {
                            if (formData.customerName.trim()) {
                              const results = fuse.search(formData.customerName).map(result => result.item);
                              setSearchResults(results);
                              setIsDropdownOpen(results.length > 0);
                            }
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          required
                          ref={inputRef}
                        />
                        
                        {/* Customer Suggestions Dropdown - Only current shop's customers */}
                        {isDropdownOpen && searchResults.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                            {searchResults.map((customer) => (
                              <div
                                key={customer._id}
                                onClick={() => handleSelectCustomer(customer)}
                                className="customer-dropdown-item px-4 py-3 text-gray-800 hover:bg-blue-50 cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium">{customer.name}</div>
                                {customer.phone && (
                                  <div className="text-sm text-gray-500">{customer.phone}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* New Customer Form */}
                      {showCustomerForm && (
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-4">
                          <h4 className="text-lg font-semibold text-blue-800">Add New Customer</h4>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-blue-700">Phone (optional)</label>
                            <input
                              type="tel"
                              placeholder="Enter phone number"
                              value={formData.phone}
                              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={handleAddCustomer}
                            className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                          >
                            Add Customer
                          </button>
                        </div>
                      )}

                      {/* Amount Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            required
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          placeholder="Enter transaction description..."
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                          rows={3}
                        />
                      </div>

                      {/* Category and Payment Method */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Category</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
                          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                          <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
                          <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            max={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Due Date (optional)</label>
                          <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          />
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-4 pt-6">
                        <button
                          type="submit"
                          onClick={(e) => handleSubmit(e, false)}
                          className="flex-1 bg-blue-500 text-white p-4 rounded-lg font-semibold hover:bg-blue-600 transition"
                        >
                          Save Transaction
                        </button>
                        
                        <button
                          type="button"
                          onClick={(e) => handleSubmit(e, true)}
                          className="flex-1 bg-green-500 text-white p-4 rounded-lg font-semibold hover:bg-green-600 transition"
                        >
                          Save & Add Another
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => router.back()}
                          className="px-6 py-4 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* No Shop Selected Message */}
              {role === 'superadmin' && !formData.shopId && (
                <div className="text-center py-10 text-gray-500">
                  <p>Please select a shop to create transactions.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}