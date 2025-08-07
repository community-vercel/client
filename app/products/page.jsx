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
import QuotationForm from '../../components/QuotationForm';
import QuotationPdfPreview from '../../components/QuotationPdfPreview';
import { useQuotation } from '../../hooks/useQuotation';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, totalValue: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

 const {
    isQuotationModalOpen,
    setIsQuotationModalOpen,
    isPdfModalOpen,
    setIsPdfModalOpen,
    customers,
    products: quotationProducts,
    filteredProducts,
    shops,
    quotationForm,
    setQuotationForm,
    pdfUrl,
    pdfCustomer,
    customerSearch,
    setCustomerSearch,
    productSearch,
    setProductSearch,
    handleQuotationChange,
    addProductRow,
    removeProductRow,
    calculateQuotationTotal,
    handleSubmitQuotation,
    handleShareWhatsApp,
  } = useQuotation();

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchStats();
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
      toast.success('Products loaded successfully', { autoClose: 2000 });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(error.response?.data?.message || 'Failed to load products', { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data || { totalItems: 0, lowStock: 0, totalValue: 0 });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error(error.response?.data?.message || 'Failed to load stats', { autoClose: 3000 });
    }
  };

  const handleScan = async (barcode) => {
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/scan/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
      fetchStats();
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
      title: 'Create Quotation',
      onClick: () => setIsQuotationModalOpen(true),
      icon: <FileText className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-600',
      hoverColor: 'hover:from-teal-600 hover:to-cyan-700',
    },
  ];

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
              action.href ? (
                <Link
                  key={index}
                  href={action.href}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/20 transition-all duration-200"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {action.icon}
                  <span>{action.title}</span>
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="flex items-center space-x-3 p-3 w-full text-left rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  {action.icon}
                  <span>{action.title}</span>
                </button>
              )
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
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  Inventory Dashboard
                </h1>
                <p className="text-blue-100 text-sm font-medium">Manage your inventory with ease</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30 ${
                isScanning
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900 shadow-lg shadow-yellow-400/25'
              }`}
            >
              <Scan className="w-5 h-5" />
              <span>{isScanning ? 'Stop Scanning' : 'Scan Barcode'}</span>
            </button>
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
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Total Items', value: stats.totalItems, color: 'from-blue-500 to-indigo-600' },
            { title: 'Low Stock', value: stats.lowStock, color: 'from-orange-500 to-red-600' },
            { title: 'Total Value', value: `PKR ${stats.totalValue.toFixed(2)}`, color: 'from-emerald-500 to-teal-600' },
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${stat.color} rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition-all duration-300 animate-in fade-in`}
            >
              <h3 className="text-sm font-medium">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-in fade-in">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickActions.map((action, index) =>
              action.href ? (
                <Link
                  key={index}
                  href={action.href}
                  className={`group bg-gradient-to-r ${action.color} ${action.hoverColor} p-6 rounded-2xl text-white shadow-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-white/20 p-4 rounded-2xl group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-lg">{action.title}</h3>
                  </div>
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`group bg-gradient-to-r ${action.color} ${action.hoverColor} p-6 rounded-2xl text-white shadow-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="bg-white/20 p-4 rounded-2xl group-hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-lg">{action.title}</h3>
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
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
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
             <QuotationForm
          isOpen={isQuotationModalOpen}
          onClose={() => setIsQuotationModalOpen(false)}
          customers={customers}
          products={quotationProducts}
          filteredProducts={filteredProducts}
          shops={shops}
          quotationForm={quotationForm}
          handleQuotationChange={handleQuotationChange}
          addProductRow={addProductRow}
          removeProductRow={removeProductRow}
          calculateQuotationTotal={calculateQuotationTotal}
          handleSubmitQuotation={handleSubmitQuotation}
          customerSearch={customerSearch}
          setCustomerSearch={setCustomerSearch}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
        />

        {/* PDF Preview Modal */}
           <QuotationPdfPreview
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        pdfUrl={pdfUrl}
        pdfCustomer={pdfCustomer}
        calculateQuotationTotal={calculateQuotationTotal}
        handleShareWhatsApp={handleShareWhatsApp}
        products={quotationProducts}
        quotationForm={quotationForm}
      />
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