'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductList from '../../components/ProductList';
import BarcodeScanner from '../../components/BarcodeScanner';
import { Package, Scan, BarChart3, Palette, Settings, Menu, X, Plus, RefreshCw, FileText, LogOut } from 'lucide-react';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, totalValue: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

 

  useEffect(() => {
    if (token) {
      fetchProducts();
   
    } else {
      router.push('/auth/signin');
    }
  }, [router, token]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
        params: { page: 1, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.items || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async (barcode) => {
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/scan/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    
      toast.success(`Barcode ${barcode} scanned successfully`, { autoClose: 2000 });
    } catch (error) {
      console.error('Error scanning barcode:', error);
      toast.error(error.response?.data?.message || 'Failed to scan barcode', { autoClose: 3000 });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/signin');
    toast.info('Logged out successfully', { autoClose: 2000 });
  };

const quickActions = [
  { title: 'Manage Items', href: '/products', icon: <Package className="w-5 h-5" /> },
  { title: 'Manage Quantity', href: '/products/items', icon: <BarChart3 className="w-5 h-5" /> },
  { title: 'Manage Product', href: '/product', icon: <Plus className="w-5 h-5" /> },
  { title: 'Manage Colors', href: '/colors', icon: <Palette className="w-5 h-5" /> },
  { title: 'Create Quotation', href: '/quotations', icon: <FileText className="w-5 h-5" /> },
];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-sans py-20">
      <ToastContainer theme="colored" position="top-right" />
      
    {/* Sidebar */}
{/* Sidebar */}
<div
  className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform transition-transform duration-300 ease-in-out ${
    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
  } lg:hidden z-50 shadow-md`}
>
  <div className="p-4">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-lg font-semibold">Menu</h2>
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="p-2 rounded hover:bg-gray-700"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
    <nav className="space-y-1">
      {quickActions.map((action, index) => (
        action.href ? (
          <Link
            key={index}
            href={action.href}
            className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700"
            onClick={() => setIsSidebarOpen(false)}
          >
            {action.icon}
            <span>{action.title}</span>
          </Link>
        ) : (
          <button
            key={index}
            onClick={action.onClick}
            className="flex items-center space-x-2 p-2 w-full text-left rounded hover:bg-gray-700"
          >
            {action.icon}
            <span>{action.title}</span>
          </button>
        )
      ))}
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 p-2 w-full text-left rounded hover:bg-gray-700"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </nav>
  </div>
</div>

{/* Header */}
<header className="bg-gray-800 text-white shadow-md">
  <div className="p-4 flex justify-between items-center">
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden p-2 rounded hover:bg-gray-700"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      <div className="flex items-center space-x-2">
        <Package className="w-6 h-6" />
        <div>
          <h1 className="text-xl font-semibold">Inventory Dashboard</h1>
          <p className="text-sm text-gray-300">Manage your inventory</p>
        </div>
      </div>
    </div>
    <div className="flex items-center space-x-3">
      <button
        onClick={() => setIsScanning(!isScanning)}
        className={`flex items-center space-x-2 px-4 py-2 rounded font-medium ${
          isScanning ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
        }`}
      >
        <Scan className="w-5 h-5" />
        <span>{isScanning ? 'Stop Scanning' : 'Scan Barcode'}</span>
      </button>
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-700"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </div>
  </div>
</header>

      <div className="p-6 max-w-7xl mx-auto space-y-8">
       

      {/* Quick Actions Section */}
<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
  <div className="flex items-center space-x-2 mb-4">
    <Settings className="w-5 h-5 text-gray-600" />
    <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
    {quickActions.map((action, index) =>
      action.href ? (
        <Link
          key={index}
          href={action.href}
          className="bg-gray-100 p-4 rounded-lg text-gray-800 hover:bg-gray-200 transition duration-200"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-lg bg-gray-200">
              {action.icon}
            </div>
            <h3 className="font-medium text-base">{action.title}</h3>
          </div>
        </Link>
      ) : (
        <button
          key={index}
          onClick={action.onClick}
          className="bg-gray-100 p-4 rounded-lg text-gray-800 hover:bg-gray-200 transition duration-200"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-lg bg-gray-200">
              {action.icon}
            </div>
            <h3 className="font-medium text-base">{action.title}</h3>
          </div>
        </button>
      )
    )}
  </div>
</div>
        {/* Scanner Section */}
        {isScanning && (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 transform animate-in slide-in-from-top duration-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl">
                <Scan className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Barcode Scanner</h2>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl">
              <BarcodeScanner onScan={handleScan} />
            </div>
          </div>
        )}

        {/* Quotation Form Modal */}
     

        {/* Inventory Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in">
          <div className="bg-[#757575] to-purple-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Current Inventory</h2>
                  <p className="text-indigo-100">Recent items in your inventory</p>
                </div>
              </div>
              <button
                onClick={fetchProducts}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
         

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                  <span className="text-lg text-gray-600">Loading inventory...</span>
                </div>
              </div>
            ) : (
              <ProductList products={products} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}