'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TransactionForm from '../../../components/TransactionForm';
import { Package, BarChart3, Palette, Menu, X, Plus, FileText, LogOut } from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';

export default function EditTransaction() {
  const router = useRouter();
  const { id } = useParams(); // Get transaction ID from URL
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [shopId, setShopId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [entryMode, setEntryMode] = useState('manual'); // Default to manual for editing

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
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef(null);

  // Initialize user data, shop context, and transaction data
useEffect(() => {
  const initializeData = async () => {
    try {
      const userRole = localStorage.getItem('role');
      const storedShopId = localStorage.getItem('shopId');
      const userId = localStorage.getItem('userid');

      console.log('User Role:', userRole, 'Shop ID:', storedShopId, 'User ID:', userId); // Debug

      if (userRole) setRole(userRole);
      if (storedShopId) setShopId(storedShopId);
      if (userId) setFormData(prev => ({ ...prev, user: userId }));

      if (!token) {
        console.log('No token, redirecting to signin');
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
        console.log('Shops:', response.data); // Debug
        setShops(response.data || []);
      }

      if (id) {
        const transactionRes = await api.get(`/transactions/${id}`);
        console.log('Transaction Data:', transactionRes.data); // Debug
        const transaction = transactionRes.data;

        if (userRole !== 'superadmin' && transaction.shopId !== storedShopId) {
          setError('You do not have permission to edit this transaction.');
          setLoading(false);
          return;
        }

        const targetShopId = transaction.shopId || storedShopId;
        const shopParam = userRole === 'superadmin' ? 'all' : targetShopId;

        const [customersRes, categoriesRes] = await Promise.all([
          api.get(`/customers?shopId=${shopParam}`),
          api.get(`/categories?shopId=${shopParam}`),
        ]);

        console.log('Customers:', customersRes.data, 'Categories:', categoriesRes.data); // Debug

        setCustomers(customersRes.data || []);
        setCategories(categoriesRes.data || []);
        setCustomerSearchResults(customersRes.data || []);

        const customer = customersRes.data.find(c => c._id === transaction.customerId?._id) || transaction.customerId;

    // In EditTransaction useEffect, ensure transactionType is set
setFormData({
  transactionType: transaction.transactionType || 'payable', // Fallback to 'payable' if undefined
  customerId: customer?._id || '',
  customerName: customer?.name || '',
  phone: customer?.phone || '',
  totalAmount: transaction.totalAmount || '',
  payable: transaction.payable || '',
  receivable: transaction.receivable || '',
  description: transaction.description || '',
  category: transaction.category || '',
  paymentMethod: transaction.type || '',
  date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
  dueDate: transaction.dueDate ? transaction.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
  image: null,
  user: userId,
  shopId: transaction.shopId || storedShopId,
});
        setCustomerSearchTerm(customer?.name || '');
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  initializeData();
}, [router, token, id]);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('shopId');
    localStorage.removeItem('userid');
    router.push('/auth/signin');
    toast.info('Logged out successfully', { autoClose: 2000 });
  };

  const quickActions = [
    {
      title: 'Manage Items',
      href: '/products',
      icon: <Package className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
      hoverColor: 'hover:from-emerald-600 hover:to-teal-700',
    },
    {
      title: 'Manage Quantity',
      href: '/products/items',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-600',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-700',
    },
    {
      title: 'Manage Product',
      href: '/product',
      icon: <Plus className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600',
      hoverColor: 'hover:from-purple-600 hover:to-pink-700',
    },
    {
      title: 'Manage Colors',
      href: '/colors',
      icon: <Palette className="w-6 h-6" />,
      color: 'from-orange-500 to-red-600',
      hoverColor: 'hover:from-orange-600 hover:to-red-700',
    },
    {
      title: 'Transactions',
      href: '/dashboard/transactions',
      icon: <FileText className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-600',
      hoverColor: 'hover:from-teal-600 hover:to-cyan-700',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-sans py-20">
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading transaction...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-sans py-20">
      <ToastContainer theme="colored" position="top-right" />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-indigo-700 to-purple-800 text-white transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:hidden z-50 shadow-2xl`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-white hover:bg-white/20 p-2 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="space-y-2">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/20 transition-all duration-200"
                onClick={() => setIsSidebarOpen(false)}
              >
                {action.icon}
                <span>{action.title}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 p-3 w-full text-left rounded-lg hover:bg-red-500/20 transition-all duration-200"
            >
              <LogOut className="w-6 h-6" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        <div className="relative p-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  Edit Transaction
                </h1>
                <p className="text-blue-100 text-sm font-medium">Update transaction details</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/transactions"
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-white flex items-center space-x-2 transition-all duration-300"
            >
              <FileText className="w-5 h-5" />
              <span>Back to Transactions</span>
            </Link>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-white flex items-center space-x-2 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center" role="alert">
            {error}
          </div>
        )}

        {/* Transaction Form */}
        {!error && (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-in fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Edit Transaction</h2>
            </div>
          <TransactionForm
  formData={formData}
  setFormData={setFormData}
  customers={customers}
  setCustomers={setCustomers}
  categories={categories}
  shops={shops}
  customerSearchTerm={customerSearchTerm}
  setCustomerSearchTerm={setCustomerSearchTerm}
  customerSearchResults={customerSearchResults}
  setCustomerSearchResults={setCustomerSearchResults}
  showCustomerForm={showCustomerForm}
  setShowCustomerForm={setShowCustomerForm}
  isDropdownOpen={isDropdownOpen}
  setIsDropdownOpen={setIsDropdownOpen}
  inputRef={inputRef}
  role={role}
  shopId={shopId}
  isEditing={true}
  transactionId={id}
  entryMode={entryMode} // Pass entryMode
  setEntryMode={setEntryMode} // Pass setEntryMode
/>
          </div>
        )}
      </div>
    </div>
  );
}