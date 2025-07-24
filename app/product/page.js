'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PlusCircle, X } from 'lucide-react';
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
  const router = useRouter();
  const token = localStorage.getItem('token');
  const categories = ['gallon', 'quarter', 'drums', 'liters', 'Dibbi'];

  useEffect(() => {
    if (!token) {
      router.push('/auth/signin');
    } else {
      fetchProducts();
    }
  }, [search, page, token, router]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch paginated products
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
        params: { search, page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.products);
      setTotalPages(Math.ceil(res.data.total / limit));

      // Fetch totals for all products (new API call or modified endpoint)
      const totalsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product/totals`, {
        params: { search }, // Include search to filter totals if needed
        headers: { Authorization: `Bearer ${token}` },
      });
      setTotals({
        totalCostPrice: totalsRes.data.totalCostPrice || 0,
        totalRetailPrice: totalsRes.data.totalRetailPrice || 0,
        totalSalePrice: totalsRes.data.totalSalePrice || 0,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch products', {
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const { name, costPrice, retailPrice, discountPercentage, category } = formData;

    if (costPrice < 0 || retailPrice < 0) {
      toast.error('Prices cannot be negative', { position: 'top-right' });
      return;
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      toast.error('Discount percentage must be between 0 and 100', { position: 'top-right' });
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
      toast.success('Product added successfully!', { position: 'top-right' });
      setFormData({ name: '', costPrice: '', retailPrice: '', discountPercentage: '', category: '' });
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product', {
        position: 'top-right' });
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    const { name, costPrice, retailPrice, discountPercentage, category } = formData;

    if (costPrice < 0 || retailPrice < 0) {
      toast.error('Prices cannot be negative', { position: 'top-right' });
      return;
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      toast.error('Discount percentage must be between 0 and 100', { position: 'top-right' });
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
      toast.success('Product updated successfully!', { position: 'top-right' });
      setIsEditModalOpen(false);
      setEditProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product', {
        position: 'top-right' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/product/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Product deleted successfully!', { position: 'top-right' });
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete product', {
          position: 'top-right' });
      }
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/signin');
  };

  const calculateSalePrice = (retailPrice, discountPercentage) => {
    const retail = Number(retailPrice) || 0;
    const discount = Number(discountPercentage) || 0;
    return (retail - (retail * discount) / 100).toFixed(2);
  };

  return (
    <div className="min-h-screen py-20 bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <ToastContainer theme="colored" />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-white focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Inventory Management Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/products"
              className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              Manage Items
            </Link>
            <Link
              href="/product"
              className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              Manage Product
            </Link>
            <Link
              href="/colors"
              className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              Manage Colors
            </Link>
          </div>
        </header>
        {/* Main Content */}
        <main className="p-4 sm:p-6 flex-1">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Product Catalog</h2>
              <button
                onClick={() => {
                  setFormData({ name: '', costPrice: '', retailPrice: '', discountPercentage: '', category: '' });
                  setIsAddModalOpen(true);
                }}
                className="flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-md hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:-translate-y-1"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Product
              </button>
            </div>
            <div className="mb-6">
              <div className="relative w-full sm:w-1/3">
                <input
                  type="text"
                  placeholder="Search by name or category..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-4 pl-12 pr-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 text-gray-700 placeholder-gray-400"
                />
                <svg
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Table for Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                    <th className="p-4 text-left font-semibold text-sm uppercase tracking-wide">S.No</th>
                    <th className="p-4 text-left font-semibold text-sm uppercase tracking-wide">Name</th>
                    <th className="p-4 text-left font-semibold text-sm uppercase tracking-wide">Cost Price (PKR)</th>
                    <th className="p-4 text-left font-semibold text-sm uppercase tracking-wide">Retail Price (PKR)</th>
                    <th className="p-4 text-left font-semibold text-sm uppercase tracking-wide">Discount (%)</th>
                    <th className="p-4 text-left font-semibold text-sm uppercase tracking-wide">Sale Price (PKR)</th>
                    <th className="p-4 text-left font-semibold text-sm uppercase tracking-wide">Category</th>
                    <th className="p-4 text-left font-semibold text-sm uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-gray-500">
                        <div className="flex justify-center items-center">
                          <svg
                            className="animate-spin h-8 w-8 mr-3 text-indigo-600"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span className="text-lg">Loading products...</span>
                        </div>
                      </td>
                    </tr>
                  ) : products?.length > 0 ? (
                    products.map((product, index) => (
                      <tr
                        key={product._id}
                        className="border-b border-gray-100 hover:bg-indigo-50 transition-colors duration-200"
                      >
                        <td className="p-4 text-gray-600">{(page - 1) * limit + index + 1}</td>
                        <td className="p-4 text-gray-800 font-medium">{product.name}</td>
                        <td className="p-4 text-gray-600">PKR {product.costPrice.toFixed(2)}</td>
                        <td className="p-4 text-gray-600">PKR {product.retailPrice.toFixed(2)}</td>
                        <td className="p-4 text-gray-600">{product.discountPercentage}%</td>
                        <td className="p-4 text-gray-600">
                          PKR {calculateSalePrice(product.retailPrice, product.discountPercentage)}
                        </td>
                        <td className="p-4 text-gray-600">
                          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                        </td>
                        <td className="p-4 flex space-x-3">
                          <button
                            onClick={() => openEditModal(product)}
                            className="flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all duration-200"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-all duration-200"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg
                            className="w-16 h-16 text-gray-400 mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                          <span className="text-lg">No products found.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
           
              </table>
            </div>

            {/* Card Layout for Mobile/Tablet */}
            <div className="lg:hidden grid gap-6 p-4">
              {isLoading ? (
                <div className="flex justify-center items-center p-6">
                  <svg
                    className="animate-spin h-8 w-8 mr-3 text-indigo-600"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-lg text-gray-600">Loading products...</span>
                </div>
              ) : products?.length > 0 ? (
                products.map((product, index) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                      <span className="text-sm text-gray-500">
                        #{(page - 1) * limit + index + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p>
                          <span className="font-medium">Cost Price:</span> PKR{' '}
                          {product.costPrice.toFixed(2)}
                        </p>
                        <p>
                          <span className="font-medium">Retail Price:</span> PKR{' '}
                          {product.retailPrice.toFixed(2)}
                        </p>
                        <p>
                          <span className="font-medium">Discount:</span>{' '}
                          {product.discountPercentage}%
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
                    <div className="flex justify-end space-x-3 mt-4">
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all duration-200"
                        title="Edit"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"
                          />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-all duration-200"
                        title="Delete"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M4 7h16"
                          />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-16 h-16 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span className="text-lg">No products found.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Summary */}
            {products?.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Total Cost Price:</span> PKR{' '}
                    {totals.totalCostPrice.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Total Retail Price:</span> PKR{' '}
                    {totals.totalRetailPrice.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">Total Sale Price:</span> PKR{' '}
                    {totals.totalSalePrice.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Pagination */}
        {products?.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 px-4 sm:px-6">
            <div className="text-gray-600 text-sm mb-2 sm:mb-0">Page {page} of {totalPages}</div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-md hover:from-indigo-700 hover:to-indigo-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    page === i + 1
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-all duration-200`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-md hover:from-indigo-700 hover:to-indigo-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Add New Product</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Retail Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  required
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
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
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 rounded-md hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-md hover:bg-gray-300 transition-all duration-200"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Edit Product</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Retail Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
                  required
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 p-3 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-600 transition"
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
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-3 rounded-md hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200"
                >
                  Update Product
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-md hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}