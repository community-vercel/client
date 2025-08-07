'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Chart from '../../components/Chart';
import TransactionTable from '@/components/TransactionTable';
import Modal from '../../components/Modal';
import Modal2 from '@/components/Modal2';
import api, { createBackup, getBackups, restoreBackup } from '../../lib/api';
import { formatCurrency } from '../utils/helpers';
import Fuse from 'fuse.js';
import ReactDOM from 'react-dom';

function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    const { exp } = decoded;
    const now = Date.now() / 1000;
    return exp < now;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const errorVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const DropdownPortal = ({ children, isOpen }) => {
  if (!isOpen) return null;
  return ReactDOM.createPortal(children, document.body);
};

export const PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'Other'];

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState({
    totalPayables: 0,
    totalReceivables: 0,
    balance: 0,
    openingBalance: 0,
    alerts: [],
  });
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [backups, setBackups] = useState([]);
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userid, setUserid] = useState(null);
  const [role, setRole] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [storeName, setStoreName] = useState('Your Store Name');
  const [isLoading, setIsLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const customerInputRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];
  const hasFetchedShops = useRef(false); // Track if shops have been fetched

  // Initialize Fuse.js for customer search
  const customerFuse = useRef(new Fuse([], { keys: ['name'], threshold: 0.3, includeScore: true }));

  // Update Fuse.js when customers change
  useEffect(() => {
    customerFuse.current = new Fuse(customers, { keys: ['name'], threshold: 0.3, includeScore: true });
  }, [customers]);

  // Initialize user data
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const id = localStorage.getItem('userid');
    const userRole = localStorage.getItem('role');
    const shopId = localStorage.getItem('shopId');

    // if (!storedToken || isTokenExpired(storedToken) || (!shopId && userRole !== 'superadmin')) {
    //   localStorage.removeItem('token');
    //   localStorage.removeItem('userid');
    //   localStorage.removeItem('role');
    //   localStorage.removeItem('shopId');
    //   router.push('/login');
    //   return;
    // }

    setUserid(id);
    setRole(userRole);
    if (userRole !== 'superadmin') {
      setFormData((prev) => ({ ...prev, shopId, user: id }));
      setFilters((prev) => ({ ...prev, shopId }));
    } else {
      setFormData((prev) => ({ ...prev, user: id }));
      // Initialize filters.shopId only if not already set
      setFilters((prev) => ({
        ...prev,
        shopId: prev.shopId || localStorage.getItem('selectedShopId') || '',
      }));
    }
  }, [router]);

  const fetchShops = async () => {
    if (hasFetchedShops.current) return; // Prevent multiple fetches
    hasFetchedShops.current = true;
    try {
      const response = await api.get('/shops');
      setShops(response.data);
      // For superadmin, default to "All Shops" if no shop is selected
      if (role === 'superadmin' && !filters.shopId && response.data.length > 0) {
        setFilters((prev) => ({ ...prev, shopId: '' }));
      }
    } catch (err) {
      setError('Failed to fetch shops. Please try again.');
      console.error('Error fetching shops:', err);
    }
  };
const fetchData = useCallback(async () => {
  if (!filters.shopId && role !== 'superadmin') {
    setError('No shop selected. Please log in again.');
    return;
  }

  setLoading(true);
  setError('');
  try {
    const params = { ...filters };
    if (role === 'superadmin') {
      params.shopId = filters.shopId || 'all'; // Send 'all' for superadmin when no shop is selected
    } else {
      params.shopId = filters.shopId; // Use specific shopId for non-superadmins
    }

    const promises = [
      api.get('/dashboard/summary', { params }),
      api.get('/customers', { params }), // Fetch customers with shopId or 'all'
      api.get('/categories', { params }),
    ];

    if (filters.shopId && filters.shopId !== 'all') {
      promises.push(api.get('/settings', { params: { shopId: filters.shopId } }));
    } else {
      promises.push(Promise.resolve(null)); // No settings fetch for 'all' shops
    }

    const responses = await Promise.all(promises.map((p) => p.catch((e) => e)));

    const dashboardRes = responses[0];
    const customersRes = responses[1];
    const categoriesRes = responses[2];
    const settingsRes = responses[3];

    if (dashboardRes instanceof Error) throw dashboardRes;
    if (customersRes instanceof Error) throw customersRes;
    if (categoriesRes instanceof Error) throw categoriesRes;

    setData({
      totalPayables: dashboardRes.data.totalPayables || 0,
      totalReceivables: dashboardRes.data.totalReceivables || 0,
      balance: dashboardRes.data.balance || 0,
      openingBalance: dashboardRes.data.openingBalance || 0,
      alerts: dashboardRes.data.alerts || [],
    });
    setCustomers(customersRes.data || []); // Uncommented to set customers
    setCategories(categoriesRes.data || []);
    setStoreName(
      filters.shopId && filters.shopId !== 'all' && settingsRes?.data?.siteName
        ? settingsRes.data.siteName
        : 'All Shops'
    );
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userid');
      localStorage.removeItem('role');
      localStorage.removeItem('shopId');
      router.push('/login');
    } else if (error.response?.status === 404 && error.response?.data?.message === 'Settings not found for this shop') {
      setError('Settings not found for this shop. Please contact support or create settings.');
    } else {
      setError(error.response?.data?.message || 'Failed to fetch dashboard data. Please try again.');
    }
    console.error('Error fetching dashboard data:', error);
  } finally {
    setLoading(false);
  }
}, [filters, role, router]);
const fetchDailyReport = async (date) => {
  try {
    setIsLoading(true);
    setError('');

    // Determine the shopId to send
    const selectedShopId = role === 'superadmin' 
      ? (filters.shopId || 'all') 
      : filters.shopId;

    if (!selectedShopId && role !== 'superadmin') {
      throw new Error('No shop selected');
    }

    // Create params object with both date and shopId
    const params = {
      date,
      shopId: selectedShopId
    };

    console.log('fetchDailyReport - Request params:', params);

    const [reportRes, settingsRes] = await Promise.all([
      api.getDailyReport(params),
      selectedShopId && selectedShopId !== 'all' 
        ? api.get('/settings', { params: { shopId: selectedShopId } }) 
        : Promise.resolve(null)
    ]);

    const reportData = reportRes.data;
    console.log('fetchDailyReport - Response data:', reportData);

    setDailyReport(reportData);
    setStoreName(
      selectedShopId && selectedShopId !== 'all' && settingsRes?.data?.siteName
        ? settingsRes.data.siteName
        : 'All Shops'
    );

    // Get PDF report with the same params
    const pdfRes = await api.getPDFReport(params);
    setPdfUrl(pdfRes.data.url);
    setIsReportModalOpen(true);

  } catch (error) {
    console.error('Error fetching daily report:', error);
    setError(error.response?.data?.message || error.message || 'Failed to fetch report');
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    if (role === 'superadmin' && !hasFetchedShops.current) {
      fetchShops();
    }
    fetchData();
  }, [fetchData, role, refreshTrigger]);

  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearchTerm(value);
    if (value.trim()) {
      const results = customerFuse.current.search(value).map((result) => result.item);
      setSearchResults(results);
      setIsCustomerDropdownOpen(true);
    } else {
      setSearchResults(customers);
      setIsCustomerDropdownOpen(true);
      setFilters((prev) => ({ ...prev, customerId: '' }));
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, customerName: value }));
    const customerExists = customers.some((c) => c.name.toLowerCase() === value.toLowerCase());
    setShowCustomerForm(!customerExists);
    if (value.trim()) {
      const results = customerFuse.current.search(value).map((result) => result.item);
      setSearchResults(results);
      setIsCustomerDropdownOpen(true);
    } else {
      setSearchResults(customers);
      setIsCustomerDropdownOpen(false);
    }
  };

  const handleCustomerFilterSelect = (customer) => {
    setFilters((prev) => ({ ...prev, customerId: customer._id || '' }));
    setCustomerSearchTerm(customer.name || 'All Customers');
    setIsCustomerDropdownOpen(false);
  };

  const handleSelectCustomer = (customer) => {
    setFormData((prev) => ({ ...prev, customerId: customer._id, customerName: customer.name }));
    setCustomerSearchTerm(customer.name);
    setIsCustomerDropdownOpen(false);
    setShowCustomerForm(false);
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

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transactionType: transaction.transactionType || '',
      customerId: transaction.customerId?._id || '',
      customerName: transaction.customerId?.name || '',
      phone: '',
      totalAmount: transaction.totalAmount || '',
      payable: transaction.payable || '',
      receivable: transaction.receivable || '',
      description: transaction.description || '',
      category: transaction.category || '',
      paymentMethod: transaction.type || '',
      date: transaction.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      dueDate: transaction.dueDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      isRecurring: transaction.isRecurring || false,
      image: null,
      user: userid,
      shopId: transaction.shopId || filters.shopId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteTransaction(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting transaction.');
      console.error('Delete error:', err);
    }
  };

  const handleAddCustomer = async () => {
    try {
      const { data } = await api.post('/customers', {
        name: formData.customerName,
        phone: formData.phone,
        shopId: formData.shopId,
      });
      setFormData((prev) => ({ ...prev, customerId: data._id, customerName: data.name }));
      setCustomers((prev) => [...prev, data]);
      setSearchResults((prev) => [...prev, data]);
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

      const endpoint = editingTransaction ? `transactions/${editingTransaction._id}` : `transactions`;
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
        shopId: filters.shopId,
      });
      setIsModalOpen(false);
      setEditingTransaction(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving transaction.');
      console.error('Submit error:', err);
    }
  };

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

  const handleReportDateChange = (e) => {
    setReportDate(e.target.value);
  };

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

{role === 'superadmin' && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
    className="mb-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
  >
    <label htmlFor="shopSelect" className="block text-sm font-medium text-gray-200 mb-2">
      Select Shop
    </label>
    <select
      id="shopSelect"
      value={filters.shopId || ''}
      onChange={(e) => {
        const newShopId = e.target.value || 'all';
        setFilters((prev) => ({ ...prev, shopId: newShopId }));
        localStorage.setItem('selectedShopId', newShopId);
        console.log('Shop select changed:', { newShopId });
      }}
      className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
    >
      <option value="all">All Shops</option>
      {shops.map((shop) => (
        <option key={shop._id} value={shop._id}>
          {shop.name}
        </option>
      ))}
    </select>
  </motion.div>
)}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
        >
          <h3 className="text-lg font-semibold text-white mb-4">View Daily Report</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="date"
              value={reportDate}
              onChange={handleReportDateChange}
              max={today}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Report Date"
            />
            <button
              onClick={() => fetchDailyReport(reportDate)}
              disabled={isLoading}
              className={`flex items-center px-4 py-2 rounded-lg font-semibold transition ${
                isLoading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
              aria-label="View Daily Report"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading...
                </>
              ) : (
                'View Report'
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 overflow-visible"
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Start Date"
              max={today}
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="End Date"
              max={today}
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Category Filter"
            >
              <option value="">All Categories</option>
              {categories?.map((cat, index) => (
                <option key={index} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="relative w-full sm:w-auto" ref={customerInputRef}>
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearchTerm}
                onChange={handleCustomerSearchChange}
                onFocus={() => setIsCustomerDropdownOpen(!!customerSearchTerm || true)}
                className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition w-full pr-10"
                aria-label="Customer Filter"
              />
              {customerSearchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerSearchTerm('');
                    setFilters((prev) => ({ ...prev, customerId: '' }));
                    setSearchResults(customers);
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
                      {searchResults.map((customer) => (
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
        </motion.div>

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
            <p className="text-white mt-2">Loading...</p>
          </div>
        )}

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

        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            </div>
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
              shopId: filters.shopId,
            });
            setError('');
            setShowCustomerForm(false);
            setIsCustomerDropdownOpen(false);
            setCustomerSearchTerm('');
          }}
          title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
          aria-label={editingTransaction ? 'Edit Transaction Modal' : 'New Transaction Modal'}
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

            <div className="relative" ref={customerInputRef}>
              <input
                type="text"
                placeholder="Search or add customer"
                value={formData.customerName}
                onChange={handleInputChange}
                onFocus={() => setIsCustomerDropdownOpen(!!formData.customerName || true)}
                className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition placeholder-gray-400"
                required
                aria-label="Customer Name"
              />
              {formData.customerName && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, customerName: '', customerId: '' }));
                    setCustomerSearchTerm('');
                    setSearchResults(customers);
                    setIsCustomerDropdownOpen(true);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  aria-label="Clear customer input"
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
                      {searchResults.map((customer) => (
                        <div
                          key={customer._id}
                          className="px-4 py-2 text-white hover:bg-indigo-600 cursor-pointer transition-colors"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          {customer.name}
                        </div>
                      ))}
                    </motion.div>
                  </DropdownPortal>
                )}
              </AnimatePresence>
            </div>

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
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
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

            <select
              value={formData.transactionType}
              onChange={(e) => setFormData((prev) => ({ ...prev, transactionType: e.target.value, payable: '', receivable: '' }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, totalAmount: e.target.value }))}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              required
              aria-label="Total Amount"
            />
            <input
              type="number"
              placeholder={formData.transactionType === 'payable' ? 'Amount Payable' : 'Amount Receivable'}
              value={formData.transactionType === 'payable' ? formData.payable : formData.receivable}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [formData.transactionType === 'payable' ? 'payable' : 'receivable']: e.target.value,
                }))
              }
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              required
              aria-label={formData.transactionType === 'payable' ? 'Amount Payable' : 'Amount Receivable'}
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              required
              aria-label="Transaction Description"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Transaction Date"
              max={today}
              required
            />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Due Date"
            />
            <label className="flex items-center text-gray-200">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData((prev) => ({ ...prev, isRecurring: e.target.checked }))}
                className="mr-2 text-indigo-400 focus:ring-indigo-400"
                aria-label="Recurring Transaction"
              />
              Recurring Transaction
            </label>
            <input
              type="file"
              accept="image/*"
              name="transactionImage"
              onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.files[0] }))}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg"
              aria-label="Upload Receipt Image"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 transition"
              aria-label={editingTransaction ? 'Update Transaction' : 'Add Transaction'}
            >
              {editingTransaction ? 'Update' : 'Add'}
            </button>
          </form>
        </Modal>

        <Modal2
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setDailyReport(null);
            setPdfUrl(null);
          }}
          title={`${storeName} - Daily Report - ${reportDate}`}
          aria-label="Daily Report Modal"
          className="max-w-[1200px] w-full"
        >
          {dailyReport && dailyReport.summary ? (
            <div className="space-y-2 p-2">
              <div className="bg-indigo-50 p-4 rounded-lg shadow-sm">
                <h4 className="text-lg font-semibold text-indigo-800 mb-3">Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <p className="text-gray-700">
                    Opening Balance:{' '}
                    <span className="font-medium">{formatCurrency(dailyReport.summary.openingBalance || 0)}</span>
                  </p>
                  <p className="text-gray-700">
                    Total Receivables:{' '}
                    <span className="font-medium">{formatCurrency(dailyReport.summary.totalReceivables || 0)}</span>
                  </p>
                  <p className="text-gray-700">
                    Total Payables:{' '}
                    <span className="font-medium">{formatCurrency(dailyReport.summary.totalPayables || 0)}</span>
                  </p>
                  <p className="text-gray-700">
                    Daily Balance:{' '}
                    <span className="font-medium">{formatCurrency(dailyReport.summary.dailyBalance || 0)}</span>
                  </p>
                  <p className="text-gray-700">
                    Closing Balance:{' '}
                    <span className="font-medium">{formatCurrency(dailyReport.summary.closingBalance || 0)}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-lg font-semibold text-indigo-800 mb-3">Transactions</h4>
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="min-w-full bg-white rounded-lg border border-gray-200">
                    <thead className="sticky top-0 bg-indigo-600 text-white">
                      <tr>
                        <th className="p-3 text-left font-semibold w-1/4">Customer</th>
                        <th className="p-3 text-left font-semibold w-1/6">Type</th>
                        <th className="p-3 text-left font-semibold w-1/4">Amount</th>
                        <th className="p-3 text-left font-semibold w-1/3">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dailyReport.transactions || []).map((t, index) => (
                        <tr key={t._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-3 whitespace-normal">{t.customerId?.name || 'Unknown Customer'}</td>
                          <td className="p-3 whitespace-normal">{t.transactionType || 'N/A'}</td>
                          <td className="p-3 whitespace-normal">
                            {formatCurrency(t.transactionType === 'payable' ? t.payable || 0 : t.receivable || 0)}
                          </td>
                          <td className="p-3 whitespace-normal">{t.description || 'No description'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition"
                    aria-label="View PDF Report"
                  >
                    View PDF Report
                  </a>
                )}
                <button
                  onClick={() => {
                    setIsReportModalOpen(false);
                    setDailyReport(null);
                    setPdfUrl(null);
                  }}
                  className="inline-block bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
                  aria-label="Close Modal"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-300">No transactions for this date.</p>
              <button
                onClick={() => {
                  setIsReportModalOpen(false);
                  setDailyReport(null);
                  setPdfUrl(null);
                }}
                className="mt-4 inline-block bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
                aria-label="Close Modal"
              >
                Close
              </button>
            </div>
          )}
        </Modal2>
      </motion.div>
    </div>
  );
}