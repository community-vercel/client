'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Package, BarChart3, Palette, Plus, Menu, X, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(100);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '',
    retailPrice: '',
    discountPercentage: '',
    category: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [totals, setTotals] = useState({
    totalCostPrice: 0,
    totalRetailPrice: 0,
    totalSalePrice: 0,
  });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const categories = ['gallon', 'quarter', 'drums', 'liters', 'Dibbi'];



  // Fetch products and totals
  useEffect(() => {
    if (!token) {
      router.push('/auth/signin');
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, totalsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
            params: { search, page, limit },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product/totals`, {
            params: { search },
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProducts(productsRes.data.products || []);
        setTotalPages(Math.ceil(productsRes.data.total / limit));
        setTotals({
          totalCostPrice: totalsRes.data.totalCostPrice || 0,
          totalRetailPrice: totalsRes.data.totalRetailPrice || 0,
          totalSalePrice: totalsRes.data.totalSalePrice || 0,
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [search, page, token, router, limit]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const { name, costPrice, retailPrice, discountPercentage, category } = formData;
    if (costPrice < 0 || retailPrice < 0) {
      toast.error('Prices cannot be negative');
      return;
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      toast.error('Discount percentage must be between 0 and 100');
      return;
    }
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/product`,
        {
          name,
          costPrice: Number(costPrice),
          retailPrice: Number(retailPrice),
          discountPercentage: Number(discountPercentage),
          category,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Product added successfully!');
      setFormData({ name: '', costPrice: '', retailPrice: '', discountPercentage: '', category: '' });
      setIsAddModalOpen(false);
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [productsRes, totalsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
              params: { search, page, limit },
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product/totals`, {
              params: { search },
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setProducts(productsRes.data.products || []);
          setTotalPages(Math.ceil(productsRes.data.total / limit));
          setTotals({
            totalCostPrice: totalsRes.data.totalCostPrice || 0,
            totalRetailPrice: totalsRes.data.totalRetailPrice || 0,
            totalSalePrice: totalsRes.data.totalSalePrice || 0,
          });
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to fetch data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    const { name, costPrice, retailPrice, discountPercentage, category } = formData;
    if (costPrice < 0 || retailPrice < 0) {
      toast.error('Prices cannot be negative');
      return;
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      toast.error('Discount percentage must be between 0 and 100');
      return;
    }
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/product/${editProduct._id}`,
        {
          name,
          costPrice: Number(costPrice),
          retailPrice: Number(retailPrice),
          discountPercentage: Number(discountPercentage),
          category,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Product updated successfully!');
      setIsEditModalOpen(false);
      setEditProduct(null);
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [productsRes, totalsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
              params: { search, page, limit },
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product/totals`, {
              params: { search },
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setProducts(productsRes.data.products || []);
          setTotalPages(Math.ceil(productsRes.data.total / limit));
          setTotals({
            totalCostPrice: totalsRes.data.totalCostPrice || 0,
            totalRetailPrice: totalsRes.data.totalRetailPrice || 0,
            totalSalePrice: totalsRes.data.totalSalePrice || 0,
          });
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to fetch data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleInlineEdit = async (productId, field, value) => {
    if (field === 'costPrice' || field === 'retailPrice') {
      if (value < 0) {
        toast.error(`${field === 'costPrice' ? 'Cost Price' : 'Retail Price'} cannot be negative`);
        return;
      }
    } else if (field === 'discountPercentage') {
      if (value < 0 || value > 100) {
        toast.error('Discount percentage must be between 0 and 100');
        return;
      }
    }
    try {
      const product = products.find((p) => p._id === productId);
      const updatedData = {
        name: product.name,
        costPrice: field === 'costPrice' ? Number(value) : product.costPrice,
        retailPrice: field === 'retailPrice' ? Number(value) : product.retailPrice,
        discountPercentage: field === 'discountPercentage' ? Number(value) : product.discountPercentage,
        category: product.category,
      };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/product/${productId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Product updated successfully!');
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [productsRes, totalsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
              params: { search, page, limit },
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product/totals`, {
              params: { search },
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setProducts(productsRes.data.products || []);
          setTotalPages(Math.ceil(productsRes.data.total / limit));
          setTotals({
            totalCostPrice: totalsRes.data.totalCostPrice || 0,
            totalRetailPrice: totalsRes.data.totalRetailPrice || 0,
            totalSalePrice: totalsRes.data.totalSalePrice || 0,
          });
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to fetch data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/product/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Product deleted successfully!');
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [productsRes, totalsRes] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
              params: { search, page, limit },
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product/totals`, {
              params: { search },
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setProducts(productsRes.data.products || []);
          setTotalPages(Math.ceil(productsRes.data.total / limit));
          setTotals({
            totalCostPrice: totalsRes.data.totalCostPrice || 0,
            totalRetailPrice: totalsRes.data.totalRetailPrice || 0,
            totalSalePrice: totalsRes.data.totalSalePrice || 0,
          });
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to fetch data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const openEditModal = (product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      costPrice: product.costPrice.toString(),
      retailPrice: product.retailPrice.toString(),
      discountPercentage: product.discountPercentage.toString(),
      category: product.category,
    });
    setIsEditModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const calculateSalePrice = (retailPrice, discountPercentage) => {
    const retail = Number(retailPrice) || 0;
    const discount = Number(discountPercentage) || 0;
    return (retail - (retail * discount) / 100).toFixed(2);
  };

  const startEditing = (productId, field, value) => {
    setEditingCell({ productId, field });
    setEditValue(value.toString());
  };

  const handleKeyDown = (e, productId, field) => {
    if (e.key === 'Enter') {
      handleInlineEdit(productId, field, editValue);
    }
  };

  const quickActions = [
    { title: 'Manage Items', href: '/products', icon: <Package className="w-4 h-4" />, color: 'bg-emerald-500' },
    { title: 'Manage Quantity', href: '/products/items', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-blue-500' },
    { title: 'Manage Product', href: '/product', icon: <Plus className="w-4 h-4" />, color: 'bg-purple-500' },
    { title: 'Manage Colors', href: '/colors', icon: <Palette className="w-4 h-4" />, color: 'bg-orange-500' },
    {
      title: 'Create Quotation',
      href: '/quotations',
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-teal-500',
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) =>
              action.onClick ? (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-left"
                >
                  <div className={`${action.color} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-3">
                      {action.icon}
                      <div className="opacity-20 text-2xl">→</div>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              ) : (
                <Link
                  key={index}
                  href={action.href}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className={`${action.color} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-3">
                      {action.icon}
                      <div className="opacity-20 text-2xl">→</div>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )
            )}
          </div>
        </div>
      )}

  

      {/* Main Content */}
      <main className="mt-6 px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
            <h2 className="text-xl font-bold text-gray-900">Product Catalog</h2>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search by name or category..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  aria-label="Search products"
                />
                <svg
                  className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => {
                  setFormData({ name: '', costPrice: '', retailPrice: '', discountPercentage: '', category: '' });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </button>
            </div>
          </div>

          {/* Table for Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-50">
                <tr>
                  {['S.No', 'Name', 'Cost Price', 'Retail Price', 'Discount', 'Sale Price', 'Category', 'Actions'].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wide"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-6 text-center text-gray-500 text-sm">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
                        Loading products...
                      </div>
                    </td>
                  </tr>
                ) : products.length > 0 ? (
                  products.map((product, index) => (
                    <tr key={product._id} className="hover:bg-indigo-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-700">{(page - 1) * limit + index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                      <td
                        className="px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded"
                        onDoubleClick={() => startEditing(product._id, 'costPrice', product.costPrice)}
                      >
                        {editingCell?.productId === product._id && editingCell?.field === 'costPrice' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleInlineEdit(product._id, 'costPrice', editValue)}
                            onKeyDown={(e) => handleKeyDown(e, product._id, 'costPrice')}
                            className="w-full p-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                            autoFocus
                          />
                        ) : (
                          `PKR ${product.costPrice.toFixed(2)}`
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded"
                        onDoubleClick={() => startEditing(product._id, 'retailPrice', product.retailPrice)}
                      >
                        {editingCell?.productId === product._id && editingCell?.field === 'retailPrice' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleInlineEdit(product._id, 'retailPrice', editValue)}
                            onKeyDown={(e) => handleKeyDown(e, product._id, 'retailPrice')}
                            className="w-full p-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                            autoFocus
                          />
                        ) : (
                          `PKR ${product.retailPrice.toFixed(2)}`
                        )}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded"
                        onDoubleClick={() =>
                          startEditing(product._id, 'discountPercentage', product.discountPercentage)
                        }
                      >
                        {editingCell?.productId === product._id && editingCell?.field === 'discountPercentage' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleInlineEdit(product._id, 'discountPercentage', editValue)}
                            onKeyDown={(e) => handleKeyDown(e, product._id, 'discountPercentage')}
                            className="w-full p-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                            autoFocus
                          />
                        ) : (
                          `${product.discountPercentage}%`
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        PKR {calculateSalePrice(product.retailPrice, product.discountPercentage)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                      </td>
                      <td className="px-4 py-3 text-sm flex space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors"
                          title="Edit"
                          aria-label="Edit product"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium transition-colors"
                          title="Delete"
                          aria-label="Delete product"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-6 text-center text-gray-500 text-sm">
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-12 h-12 text-gray-400 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                        No products found
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Card Layout for Mobile/Tablet */}
          <div className="lg:hidden grid gap-4">
            {isLoading ? (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
                <span className="text-sm text-gray-600">Loading products...</span>
              </div>
            ) : products.length > 0 ? (
              products.map((product, index) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow animate-fade-in"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                    <span className="text-xs text-gray-500">#{(page - 1) * limit + index + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
                    <div>
                      <p
                        className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                        onDoubleClick={() => startEditing(product._id, 'costPrice', product.costPrice)}
                      >
                        <span className="font-medium">Cost Price:</span>{' '}
                        {editingCell?.productId === product._id && editingCell?.field === 'costPrice' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleInlineEdit(product._id, 'costPrice', editValue)}
                            onKeyDown={(e) => handleKeyDown(e, product._id, 'costPrice')}
                            className="w-full p-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white text-xs"
                            autoFocus
                          />
                        ) : (
                          `PKR ${product.costPrice.toFixed(2)}`
                        )}
                      </p>
                      <p
                        className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                        onDoubleClick={() => startEditing(product._id, 'retailPrice', product.retailPrice)}
                      >
                        <span className="font-medium">Retail Price:</span>{' '}
                        {editingCell?.productId === product._id && editingCell?.field === 'retailPrice' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleInlineEdit(product._id, 'retailPrice', editValue)}
                            onKeyDown={(e) => handleKeyDown(e, product._id, 'retailPrice')}
                            className="w-full p-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white text-xs"
                            autoFocus
                          />
                        ) : (
                          `PKR ${product.retailPrice.toFixed(2)}`
                        )}
                      </p>
                      <p
                        className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                        onDoubleClick={() =>
                          startEditing(product._id, 'discountPercentage', product.discountPercentage)
                        }
                      >
                        <span className="font-medium">Discount:</span>{' '}
                        {editingCell?.productId === product._id && editingCell?.field === 'discountPercentage' ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleInlineEdit(product._id, 'discountPercentage', editValue)}
                            onKeyDown={(e) => handleKeyDown(e, product._id, 'discountPercentage')}
                            className="w-full p-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 bg-white text-xs"
                            autoFocus
                          />
                        ) : (
                          `${product.discountPercentage}%`
                        )}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">Sale Price:</span> PKR{' '}
                        {calculateSalePrice(product.retailPrice, product.discountPercentage)}
                      </p>
                      <p>
                        <span className="font-medium">Category:</span>{' '}
                        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => openEditModal(product)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium transition-colors"
                      title="Edit"
                      aria-label="Edit product"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-medium transition-colors"
                      title="Delete"
                      aria-label="Delete product"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                <div className="flex flex-col items-center">
                  <svg
                    className="w-12 h-12 text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                  No products found
                </div>
              </div>
            )}
          </div>

          {/* Inventory Summary */}
          {products.length > 0 && (
            <div className="mt-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-lg p-4">
              <h3 className="text-sm font-semibold text-indigo-800 mb-3">Inventory Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-700">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <span className="font-medium text-indigo-700">Total Cost Price:</span> PKR{' '}
                  {totals.totalCostPrice.toFixed(2)}
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <span className="font-medium text-indigo-700">Total Retail Price:</span> PKR{' '}
                  {totals.totalRetailPrice.toFixed(2)}
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <span className="font-medium text-indigo-700">Total Sale Price:</span> PKR{' '}
                  {totals.totalSalePrice.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {products.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 px-4">
            <div className="text-gray-600 text-xs mb-2 sm:mb-0">Page {page} of {totalPages}</div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    page === i + 1
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 text-xs font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add New Product</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Cost Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="blockσσσ text-xs font-medium text-gray-700">Retail Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Discount Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 p-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 text-sm font-medium transition-colors"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Product</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Cost Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Retail Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Discount Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 p-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 p-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 text-sm font-medium transition-colors"
                >
                  Update Product
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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