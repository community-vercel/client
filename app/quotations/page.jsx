'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QuotationForm from '../../components/QuotationForm';
import QuotationPdfPreview from '../../components/QuotationPdfPreview';
import { useQuotation } from '../../hooks/useQuotation';
import { Package, BarChart3, Palette, Menu, X, Plus, FileText, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function Quotations() {
 const router = useRouter();
 const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [role, setRole] = useState(null);
 const [shopId, setShopId] = useState(null);
 const [error, setError] = useState('');

 const {
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

 // Initialize user data and shop context
 useEffect(() => {
 const initializeUserData = async () => {
 try {
 const userRole = localStorage.getItem('role');
 const storedShopId = localStorage.getItem('shopId');

 if (userRole) setRole(userRole);
 if (storedShopId) setShopId(storedShopId);

 if (!token) {
 router.push('/auth/signin');
 return;
 }

 if (userRole !== 'superadmin' && !storedShopId) {
 setError('No shop assigned to user. Please contact administrator.');
 return;
 }

 if (userRole !== 'superadmin' && storedShopId) {
 setQuotationForm((prev) => ({ ...prev, shopId: storedShopId }));
 }
 } catch (err) {
 console.error('Error initializing user data:', err);
 setError('Failed to initialize user data');
 }
 };

 initializeUserData();
 }, [router, token, setQuotationForm]);

 const quickActions = [
 {
 title: 'Manage Items',
 href: '/products',
 icon: <Package className="w-6 h-6" />,
 color: 'bg-gradient-to-r from-emerald-500 to-teal-600',
 hoverColor: 'hover:from-emerald-600 hover:to-teal-700',
 },
 {
 title: 'Manage Quantity',
 href: '/products/items',
 icon: <BarChart3 className="w-6 h-6" />,
 color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
 hoverColor: 'hover:from-blue-600 hover:to-indigo-700',
 },
 {
 title: 'Manage Product',
 href: '/product',
 icon: <Plus className="w-6 h-6" />,
 color: 'bg-gradient-to-r from-purple-500 to-pink-600',
 hoverColor: 'hover:from-purple-600 hover:to-pink-700',
 },
 {
 title: 'Manage Colors',
 href: '/colors',
 icon: <Palette className="w-6 h-6" />,
 color: 'bg-gradient-to-r from-orange-500 to-red-600',
 hoverColor: 'hover:from-orange-600 hover:to-red-700',
 },
 {
 title: 'Dashboard',
 href: '/dashboard',
 icon: <FileText className="w-6 h-6" />,
 color: 'bg-gradient-to-r from-teal-500 to-cyan-600',
 hoverColor: 'hover:from-teal-600 hover:to-cyan-700',
 },
 ];

 return (
 <div className="min-h-screen bg-gray-100 py-22">
 <ToastContainer theme="colored" position="top-right" />

 {/* Header */}
 <header className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-6 mb-6">
 <div className="flex justify-between items-center">
 <div className="flex items-center space-x-4">
 <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
 <Package className="w-8 h-8 text-white" />
 </div>
 <div>
 <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
 Inventory Dashboard
 </h1>
 <p className="text-slate-600 font-medium">Manage your stock efficiently</p>
 </div>
 </div>
 <button
 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
 className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
 aria-label="Toggle sidebar"
 >
 {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
 </button>
 </div>
 </header>

 {/* Sidebar (Quick Actions) */}
 {isSidebarOpen && (
 <div className="mb-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 transform transition-all duration-300 ease-out">
 <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
 <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
 Quick Actions
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
 {quickActions.map((action, index) => (
 <Link
 key={index}
 href={action.href}
 className={`group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${action.color} ${action.hoverColor}`}
 >
 <div className="p-6 text-white">
 <div className="flex items-center justify-between mb-3">
 {action.icon}
 <div className="opacity-20 text-2xl">→</div>
 </div>
 <h3 className="font-bold text-lg mb-1">{action.title}</h3>
 </div>
 <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
 </Link>
 ))}
 </div>
 </div>
 )}

 <div className="p-6 max-w-7xl mx-auto space-y-8">
 {/* Error Display */}
 {error && (
 <div className="bg-red-100 text-red-700 p-4 rounded-lg text-center" role="alert">
 {error}
 </div>
 )}

 {/* Quotation Form */}
 <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-in fade-in">
 <div className="flex items-center space-x-3 mb-6">
 <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl">
 <FileText className="w-6 h-6 text-white" />
 </div>
 <h2 className="text-2xl font-bold text-gray-800">Create Quotation</h2>
 </div>
 <QuotationForm
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
 </div>

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
 </div>

 <style jsx global>{`
 @keyframes slideIn {
 from {
 transform: translateY(-10px);
 opacity: 0;
 }
 to {
 transform: translateY(0);
 opacity: 1;
 }
 }
 @keyframes fadeIn {
 from {
 opacity: 0;
 }
 to {
 opacity: 1;
 }
 }
 .animate-slide-in {
 animation: slideIn 0.3s ease-out;
 }
 .animate-fade-in {
 animation: fadeIn 0.3s ease-out;
 }
 `}</style>
 </div>
 );
}