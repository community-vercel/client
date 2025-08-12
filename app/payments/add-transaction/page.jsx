'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../../lib/api';
import Fuse from 'fuse.js';

const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];

export default function AddTransaction() {
  const router = useRouter();
  const inputRef = useRef(null);
  
  // Get initial values synchronously to avoid unnecessary re-renders
  const initialData = useMemo(() => {
    if (typeof window === 'undefined') return { token: null, role: null, shopId: null, userid: null };
    return {
      token: localStorage.getItem('token'),
      role: localStorage.getItem('role'),
      shopId: localStorage.getItem('shopId'),
      userid: localStorage.getItem('userid')
    };
  }, []);

  const [state, setState] = useState({
    role: initialData.role,
    shopId: initialData.shopId,
    userid: initialData.userid,
    error: '',
    loading: true,
    customers: [],
    categories: [],
    shops: [],
    showCustomerForm: false,
    isDropdownOpen: false,
    searchResults: [],
    saveAndAddAnother: false
  });
  
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
    image: null,
    user: initialData.userid,
    shopId: initialData.shopId,
  });

  // Optimized form validation - only recalculates when necessary fields change
  const isFormValid = useMemo(() => {
    const { customerName, transactionType, totalAmount, paymentMethod, date, shopId: formShopId } = formData;
    const { role } = state;
    
    // Fast check for empty required fields
    if (!customerName?.trim() || !transactionType || !totalAmount || !paymentMethod || !date) {
      return false;
    }

    // For superadmin, shopId is required
    if (role === 'superadmin' && !formShopId) {
      return false;
    }

    // Check amount field based on transaction type
    const amountField = transactionType === 'payable' ? formData.payable : formData.receivable;
    return amountField && amountField.toString().trim() !== '';
  }, [
    formData.customerName, 
    formData.transactionType, 
    formData.totalAmount, 
    formData.paymentMethod, 
    formData.date, 
    formData.shopId, 
    formData.payable, 
    formData.receivable, 
    state.role
  ]);

  // Optimized Fuse instance - only recreate when customers change
  const fuse = useMemo(() => {
    if (state.customers.length === 0) return null;
    return new Fuse(state.customers, { 
      keys: ['name'], 
      threshold: 0.3, 
      includeScore: true 
    });
  }, [state.customers]);

  // Batch state updates for better performance
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Optimized data fetching with abort controller
  const fetchShopSpecificData = useCallback(async (selectedShopId, abortSignal) => {
    if (!selectedShopId) {
      updateState({ loading: false });
      return;
    }

    try {
      updateState({ loading: true, error: '' });
      
      // Use Promise.allSettled for better error handling
      const [customersRes, categoriesRes] = await Promise.allSettled([
        api.get(`/customers?shopId=${selectedShopId}`, { signal: abortSignal }),
        api.get(`/categories?shopId=${selectedShopId}`, { signal: abortSignal }),
      ]);

      if (abortSignal?.aborted) return;

      const customers = customersRes.status === 'fulfilled' ? customersRes.value.data || [] : [];
      const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data || [] : [];

      updateState({ 
        customers, 
        categories, 
        loading: false,
        error: customersRes.status === 'rejected' || categoriesRes.status === 'rejected' 
          ? 'Failed to load some shop data' 
          : ''
      });
    } catch (err) {
      if (!abortSignal?.aborted) {
        updateState({ 
          error: 'Failed to load shop data. Please try again later.', 
          loading: false 
        });
        console.error('Fetch error:', err);
      }
    }
  }, [updateState]);

  // Initialize user data with abort controller
  useEffect(() => {
    if (!initialData.token) {
      router.push('/auth/signin');
      return;
    }

    const controller = new AbortController();
    
    const initializeUserData = async () => {
      try {
        if (initialData.role !== 'superadmin' && !initialData.shopId) {
          updateState({ 
            error: 'No shop assigned to user. Please contact administrator.', 
            loading: false 
          });
          return;
        }

        if (initialData.role === 'superadmin') {
          const response = await api.get('/shops', { signal: controller.signal });
          if (!controller.signal.aborted) {
            updateState({ shops: response.data || [] });
          }
        }

        const shopParam = initialData.role === 'superadmin' && formData.shopId 
          ? formData.shopId 
          : initialData.shopId;
          
        if (shopParam) {
          await fetchShopSpecificData(shopParam, controller.signal);
        } else {
          updateState({ loading: false });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error initializing user data:', err);
          updateState({ error: 'Failed to initialize user data', loading: false });
        }
      }
    };

    initializeUserData();

    return () => controller.abort();
  }, [router, fetchShopSpecificData, initialData.token, initialData.role, initialData.shopId, formData.shopId, updateState]);

  // Debounced input change handler
  const debounceTimeoutRef = useRef();
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    updateFormData({ customerName: value });
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce search to avoid excessive API calls
    debounceTimeoutRef.current = setTimeout(() => {
      const customerExists = state.customers.some(c => 
        c.name.toLowerCase() === value.toLowerCase()
      );
      
      updateState({ showCustomerForm: !customerExists && value.trim() !== '' });
      
      if (value.trim() && fuse) {
        const results = fuse.search(value).slice(0, 10).map(result => result.item); // Limit results
        updateState({ 
          searchResults: results, 
          isDropdownOpen: results.length > 0 
        });
      } else {
        updateState({ 
          searchResults: [], 
          isDropdownOpen: false 
        });
      }
    }, 150); // 150ms debounce
  }, [state.customers, fuse, updateFormData, updateState]);

  const handleSelectCustomer = useCallback((customer) => {
    updateFormData({ 
      customerId: customer._id, 
      customerName: customer.name 
    });
    updateState({ 
      showCustomerForm: false, 
      isDropdownOpen: false, 
      searchResults: [] 
    });
  }, [updateFormData, updateState]);

  const handleShopChange = useCallback((newShopId) => {
    updateFormData({ shopId: newShopId });
    if (newShopId) {
      fetchShopSpecificData(newShopId);
    } else {
      updateState({ customers: [], categories: [] });
    }
  }, [updateFormData, updateState, fetchShopSpecificData]);

  const handleAddCustomer = useCallback(async () => {
    try {
      const shopIdToUse = formData.shopId || state.shopId;
      if (!shopIdToUse) {
        updateState({ error: 'Shop context required for adding customers' });
        return;
      }
      
      const { data } = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.phone,
        shopId: shopIdToUse,
      });
      
      updateFormData({ 
        customerId: data._id, 
        customerName: data.name 
      });
      
      updateState({ 
        customers: [...state.customers, data],
        showCustomerForm: false 
      });
      
      toast.success('Customer added successfully!');
    } catch (err) {
      updateState({ error: err.response?.data?.message || 'Failed to add customer.' });
      console.error('Add customer error:', err);
    }
  }, [formData.customerName, formData.phone, formData.shopId, state.shopId, state.customers, updateFormData, updateState]);

  const handleSubmit = useCallback(async (e, addAnother = false) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    updateState({ error: '', saveAndAddAnother: addAnother });

    const shopIdToUse = formData.shopId || state.shopId;
    if (!shopIdToUse) {
      updateState({ error: 'Shop context required for transaction' });
      return;
    }

    try {
      const form = new FormData();
      const transactionData = { ...formData, shopId: shopIdToUse, user: state.userid };

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
          image: null,
          user: state.userid,
          shopId: shopIdToUse,
        });
        updateState({ 
          showCustomerForm: false, 
          isDropdownOpen: false, 
          searchResults: [] 
        });
      } else {
        setTimeout(() => router.push('/payments'), 1500);
      }
    } catch (err) {
      updateState({ error: err.response?.data?.message || 'Error saving transaction.' });
      console.error('Submit error:', err);
    } finally {
      updateState({ saveAndAddAnother: false });
    }
  }, [isFormValid, formData, state.shopId, state.userid, updateState, router]);

  // Click outside handler with ref cleanup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        const isDropdownClick = event.target.closest('.customer-dropdown-item');
        if (!isDropdownClick) {
          updateState({ isDropdownOpen: false });
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [updateState]);

  // Memoized form handlers for better performance
  const handleTransactionTypeChange = useCallback((e) => {
    updateFormData({ 
      transactionType: e.target.value,
      payable: '',
      receivable: ''
    });
  }, [updateFormData]);

  const handleTotalAmountChange = useCallback((e) => {
    const totalAmount = e.target.value;
    updateFormData({
      totalAmount,
      [formData.transactionType === 'payable' ? 'payable' : 'receivable']: totalAmount,
    });
  }, [formData.transactionType, updateFormData]);

  const { role, error, loading, customers, categories, shops, showCustomerForm, isDropdownOpen, searchResults, saveAndAddAnother } = state;

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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {role === 'superadmin' ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Shop *</label>
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
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Upload Receipt (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateFormData({ image: e.target.files[0] })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  )}

                  {/* Customer Selection */}
                  <div className="space-y-2 relative">
                    <label className="block text-sm font-medium text-gray-700">Customer *</label>
                    <input
                      type="text"
                      placeholder="Search or add customer"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (formData.customerName.trim() && fuse) {
                          const results = fuse.search(formData.customerName).slice(0, 10).map(result => result.item);
                          updateState({ 
                            searchResults: results, 
                            isDropdownOpen: results.length > 0 
                          });
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      required
                      ref={inputRef}
                      disabled={role === 'superadmin' && !formData.shopId}
                    />
                    
                    {/* Customer Suggestions Dropdown */}
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

                  {/* Transaction Type */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Transaction Type *</label>
                    <select
                      value={formData.transactionType}
                      onChange={handleTransactionTypeChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      required
                      disabled={role === 'superadmin' && !formData.shopId}
                    >
                      <option value="">Select Transaction Type</option>
                      <option value="payable">Payable (You Owe Money)</option>
                      <option value="receivable">Receivable (Money Owed to You)</option>
                    </select>
                  </div>
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
                        onChange={(e) => updateFormData({ phone: e.target.value })}
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

                {/* Second Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.totalAmount}
                      onChange={handleTotalAmountChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      required
                      disabled={role === 'superadmin' && !formData.shopId}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {formData.transactionType === 'payable' ? 'Amount Payable *' : formData.transactionType === 'receivable' ? 'Amount Receivable *' : 'Amount *'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.transactionType === 'payable' ? formData.payable : formData.receivable}
                      onChange={(e) =>
                        updateFormData({
                          [formData.transactionType === 'payable' ? 'payable' : 'receivable']: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      required
                      disabled={!formData.transactionType || (role === 'superadmin' && !formData.shopId)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => updateFormData({ paymentMethod: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      required
                      disabled={role === 'superadmin' && !formData.shopId}
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

                {/* Third Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => updateFormData({ category: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      disabled={role === 'superadmin' && !formData.shopId}
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
                    <label className="block text-sm font-medium text-gray-700">Transaction Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => updateFormData({ date: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      max={new Date().toISOString().split('T')[0]}
                      required
                      disabled={role === 'superadmin' && !formData.shopId}
                    />
                  </div>

                  {role === 'superadmin' && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Upload Receipt (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateFormData({ image: e.target.files[0] })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        disabled={!formData.shopId}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    placeholder="Enter transaction description..."
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                    rows={3}
                    disabled={role === 'superadmin' && !formData.shopId}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={!isFormValid || saveAndAddAnother}
                    className={`flex-1 p-4 rounded-lg font-semibold transition ${
                      isFormValid && !saveAndAddAnother
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Save Transaction
                  </button>
                  
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={!isFormValid || saveAndAddAnother}
                    className={`flex-1 p-4 rounded-lg font-semibold transition ${
                      isFormValid && !saveAndAddAnother
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
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

              {/* Form Validation Status */}
              {!isFormValid && (
                <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg border border-amber-200 mt-4">
                  <p>Please fill in all required fields to enable submission.</p>
                </div>
              )}

              {/* No Shop Selected Message */}
              {role === 'superadmin' && !formData.shopId && (
                <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg border border-amber-200">
                  <p>Please select a shop first to enable form fields.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  


        
        )}