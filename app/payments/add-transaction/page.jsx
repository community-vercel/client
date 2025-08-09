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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [role, setRole] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
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
    image: null,
    user: null,
    shopId: null,
  });
  
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const inputRef = useRef(null);

  // Memoized form validation
  const isFormValid = useMemo(() => {
    const requiredFields = [
      'customerName',
      'transactionType',
      'totalAmount',
      'paymentMethod',
      'date'
    ];

    // For superadmin, shopId is also required
    if (role === 'superadmin') {
      requiredFields.push('shopId');
    }

    // Check if amount field is filled based on transaction type
    const amountField = formData.transactionType === 'payable' ? 'payable' : 'receivable';
    if (formData.transactionType) {
      requiredFields.push(amountField);
    }

    return requiredFields.every(field => {
      const value = formData[field];
      return value !== null && value !== undefined && value.toString().trim() !== '';
    });
  }, [formData, role]);

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
          setFormData(prev => ({ ...prev, shopId: storedShopId }));
        }

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

  // Customer search in form - only searches current shop's customers
  const fuse = useMemo(() => new Fuse(customers, { 
    keys: ['name'], 
    threshold: 0.3, 
    includeScore: true 
  }), [customers]);

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
      setIsDropdownOpen(results.length > 0);
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
    setSearchResults([]);
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
        shopId: shopIdToUse,
      });
      
      setFormData(prev => ({ 
        ...prev, 
        customerId: data._id, 
        customerName: data.name 
      }));
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
    if (!isFormValid) return;
    
    setError('');
    setSaveAndAddAnother(addAnother);

    const shopIdToUse = formData.shopId || shopId;
    if (!shopIdToUse) {
      setError('Shop context required for transaction');
      return;
    }

    try {
      const form = new FormData();

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
        const currentCustomer = {
          customerId: formData.customerId,
          customerName: formData.customerName
        };
        
        setFormData({
          transactionType: '',
          customerId:'',
          customerName:'',
          phone: '',
          totalAmount: '',
          payable: '',
          receivable: '',
          description: '',
          category: '',
          paymentMethod: '',
          date: new Date().toISOString().split('T')[0],
          image: null,
          user: userid,
          shopId: shopIdToUse,
        });
        setShowCustomerForm(false);
        setIsDropdownOpen(false);
        setSearchResults([]);
      } else {
        setTimeout(() => {
          router.push('/payments');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving transaction.');
      console.error('Submit error:', err);
    } finally {
      setSaveAndAddAnother(false);
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First Row - Shop (for superadmin), Customer, Transaction Type */}
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
                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
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
                        if (formData.customerName.trim()) {
                          const results = fuse.search(formData.customerName).map(result => result.item);
                          setSearchResults(results);
                          setIsDropdownOpen(results.length > 0);
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
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        transactionType: e.target.value,
                        payable: '',
                        receivable: ''
                      }))}
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

                {/* Second Row - Total Amount, Amount Type, Payment Method */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Total Amount *</label>
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
                        setFormData(prev => ({
                          ...prev,
                          [prev.transactionType === 'payable' ? 'payable' : 'receivable']: e.target.value,
                        }))
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      required
                      disabled={!formData.transactionType || (role === 'superadmin' && !formData.shopId)}
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
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

                {/* Third Row - Category, Transaction Date, Upload Receipt */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files[0] }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
  );
}