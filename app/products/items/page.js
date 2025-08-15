'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '@/lib/api';
import Link from 'next/link';
import { Package, BarChart3, Palette, Plus, Menu, X, Search, TrendingUp, Boxes, Archive, Settings } from 'lucide-react';

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [operation, setOperation] = useState('add');
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit] = useState(100); // Items per page
  const token = useMemo(() => localStorage.getItem('token'), []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Fetch items with pagination
  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/items/quantity?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.data || []);
      setTotalPages(response.data.pagination.totalPages || 1);
      setTotalItems(response.data.pagination.totalItems || 0);
      setCurrentPage(response.data.pagination.currentPage || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [token, limit]);

  useEffect(() => {
    if (token) {
      fetchItems(currentPage);
    } else {
      window.location.href = '/auth/signin';
    }
  }, [fetchItems, token, currentPage]);

  // Handle quantity update
  const handleUpdateQuantity = async () => {
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setUpdating(true);
    try {
      // Optimistic UI update
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === selectedItem._id
            ? {
                ...item,
                quantity:
                  operation === 'add'
                    ? item.quantity + parseInt(amount)
                    : item.quantity - parseInt(amount),
              }
            : item
        )
      );

      await api.patch(
        `/items/${selectedItem._id}/quantity`,
        { operation, amount: parseInt(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Quantity updated successfully!');
      closeModal();
    } catch (error) {
      // Revert optimistic update
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === selectedItem._id ? { ...item, quantity: selectedItem.quantity } : item
        )
      );
      toast.error(error.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  // Modal handlers
  const openUpdateModal = useCallback((item) => {
    setSelectedItem(item);
    setOperation('add');
    setAmount('');
  }, []);

  const closeModal = useCallback(() => {
    setSelectedItem(null);
    setAmount('');
    setOperation('add');
  }, []);

  // Filtered items
  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [items, searchTerm]
  );

  // Calculate stats
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = items.filter((item) => item.quantity < 10).length;

 const quickActions = useMemo(
  () => [
    {
      title: 'Manage Items',
      href: '/products',
      icon: <Package className="w-5 h-5" />,
      description: 'View and edit products',
    },
    {
      title: 'Manage Quantity',
      href: '/products/items',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Update stock levels',
    },
    {
      title: 'Manage Product',
      href: '/product',
      icon: <Plus className="w-5 h-5" />,
      description: 'Add new products',
    },
    {
      title: 'Manage Colors',
      href: '/colors',
      icon: <Palette className="w-5 h-5" />,
      description: 'Color management',
    },
  ],
  []
);

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: '🔴' };
    if (quantity < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' };
    if (quantity < 50) return { label: 'Medium Stock', color: 'bg-blue-100 text-blue-800', icon: '🔵' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: '🟢' };
  };

  // Pagination handler
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-22 px-4">
      <ToastContainer theme="colored" position="top-right" autoClose={3000} />

     <header className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
  <div className="flex justify-between items-center">
    <div className="flex items-center space-x-3">
      <div className="bg-gray-200 p-2 rounded-lg">
        <Package className="w-6 h-6 text-gray-600" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Inventory Dashboard</h1>
        <p className="text-sm text-gray-600">Manage your stock efficiently</p>
      </div>
    </div>
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="p-2 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition duration-200"
      aria-label="Toggle sidebar"
    >
      {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  </div>
</header>
 {isSidebarOpen && (
  <div className="mb-4 bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <Settings className="w-5 h-5 text-gray-600" />
      Quick Actions
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {quickActions.map((action, index) => (
        <Link
          key={index}
          href={action.href}
          className="bg-gray-100 p-4 rounded-lg text-gray-800 hover:bg-gray-200 transition duration-200"
        >
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              {action.icon}
              <span className="text-gray-500 text-lg">→</span>
            </div>
            <h3 className="font-medium text-base">{action.title}</h3>
            <p className="text-sm text-gray-600">{action.description}</p>
          </div>
        </Link>
      ))}
    </div>
  </div>
)}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Total Products</p>
              <p className="text-3xl font-bold text-slate-800">{totalItems}</p>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl">
              <Boxes className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Total Quantity</p>
              <p className="text-3xl font-bold text-slate-800">{totalQuantity}</p>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl">
              <Archive className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 font-medium">Low Stock Alert</p>
              <p className="text-3xl font-bold text-slate-800">{lowStockItems}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

 

      {/* Main Content */}
      <main>
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Quantity Management</h2>
              <p className="text-slate-600">Monitor and update your inventory levels</p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full lg:w-80 pl-12 pr-4 py-3 bg-white/60 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 placeholder-slate-400 shadow-sm transition-all duration-200"
                aria-label="Search products"
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl shadow-sm border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        {['Product Name', 'Current Stock', 'Status', 'Actions'].map((header) => (
                          <th
                            key={header}
                            className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => {
                          const stockStatus = getStockStatus(item.quantity);
                          return (
                            <tr
                              key={item._id}
                              className={`hover:bg-slate-50 transition-colors duration-200 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-lg font-bold text-slate-900">
                                      {item.productId?.name || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-2xl font-bold text-slate-800">{item.quantity}</div>
                                <div className="text-sm text-slate-500">units</div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}
                                >
                                  <span className="mr-2">{stockStatus.icon}</span>
                                  {stockStatus.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => openUpdateModal(item)}
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                                  aria-label={`Update quantity for ${item.productId?.name || 'item'}`}
                                >
                                  <BarChart3 className="w-4 h-4 mr-2" />
                                  Update Stock
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <div className="bg-slate-100 rounded-full p-6 mb-4">
                                <Package className="w-12 h-12 text-slate-400" />
                              </div>
                              <h3 className="text-lg font-medium text-slate-900 mb-2">No items found</h3>
                              <p className="text-slate-500">Try adjusting your search criteria</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-slate-600">
                    Showing {(currentPage - 1) * limit + 1} to{' '}
                    {Math.min(currentPage * limit, totalItems)} of {totalItems} items
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        currentPage === 1
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        currentPage === totalPages
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Update Quantity Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Update Stock</h2>
                  <p className="text-slate-600 mt-1">{selectedItem.productId?.name || 'Item'}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors duration-200 text-slate-400 hover:text-slate-600"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Current Stock Level</p>
                  <p className="text-3xl font-bold text-slate-800">{selectedItem.quantity}</p>
                  <p className="text-sm text-slate-500">units available</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="operation" className="block text-sm font-bold text-slate-700 mb-2">
                    Operation Type
                  </label>
                  <select
                    id="operation"
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 bg-white shadow-sm"
                  >
                    <option value="add">➕ Add Stock</option>
                    <option value="remove">➖ Remove Stock</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-bold text-slate-700 mb-2">
                    Quantity Amount
                  </label>
                  <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 bg-white shadow-sm"
                    placeholder="Enter amount..."
                    aria-describedby="amount-error"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateQuantity}
                    disabled={updating}
                    className={`flex-1 px-4 py-3 text-white rounded-xl font-medium shadow-lg transition-all duration-200 transform ${
                      updating
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    {updating ? 'Updating...' : 'Update Stock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsPage;