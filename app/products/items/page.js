'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '@/lib/api';
import Link from 'next/link';
import { Package, BarChart3, Palette, Plus, Menu, X } from 'lucide-react';

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [operation, setOperation] = useState('add');
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const token = useMemo(() => localStorage.getItem('token'), []);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/items/quantity', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchItems();
    } else {
      window.location.href = '/auth/signin';
    }
  }, [fetchItems, token]);

  // Handle quantity update
  const handleUpdateQuantity = async (e) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    try {
      const response = await api.patch(
        `/items/${selectedItem._id}/quantity`,
        { operation, amount: parseInt(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === selectedItem._id ? { ...item, quantity: response.data.data.quantity } : item
        )
      );
      toast.success('Quantity updated successfully!');
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update quantity');
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
    () => items.filter((item) => item.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase())),
    [items, searchTerm]
  );

  const quickActions = [
    { title: 'Manage Items', href: '/products', icon: <Package className="w-4 h-4" />, color: 'bg-emerald-500' },
    { title: 'Manage Quantity', href: '/products/items', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-blue-500' },
    { title: 'Manage Product', href: '/product', icon: <Plus className="w-4 h-4" />, color: 'bg-purple-500' },
    { title: 'Manage Colors', href: '/colors', icon: <Palette className="w-4 h-4" />, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50  py-22">
      <ToastContainer theme="colored" position="top-right" autoClose={3000} />

      {/* Header */}
      <header className="bg-indigo-600 text-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <div>
              <h1 className="text-lg font-semibold">Inventory Dashboard</h1>
              <p className="text-xs text-indigo-100">Manage item quantities</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-indigo-700"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar (Quick Actions) */}
      {isSidebarOpen && (
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`flex items-center space-x-2 p-3 rounded-lg ${action.color} text-white hover:opacity-90 text-xs`}
              >
                {action.icon}
                <span>{action.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mt-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Manage Quantity</h2>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                aria-label="Search products"
              />
              <svg
                className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product Name', 'Quantity', 'Actions'].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.productId?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => openUpdateModal(item)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs"
                            aria-label={`Update quantity for ${item.productId?.name || 'item'}`}
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-6 text-center text-gray-500 text-sm">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Update Quantity Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Update {selectedItem.productId?.name || 'Item'}</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-3 text-xs text-gray-600">
              Current Quantity: <span className="font-medium">{selectedItem.quantity}</span>
            </div>
            <form onSubmit={handleUpdateQuantity} className="space-y-3">
              <div>
                <label htmlFor="operation" className="block text-xs font-medium text-gray-700">
                  Operation
                </label>
                <select
                  id="operation"
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="add">Add</option>
                  <option value="remove">Remove</option>
                </select>
              </div>
              <div>
                <label htmlFor="amount" className="block text-xs font-medium text-gray-700">
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                  required
                  aria-describedby="amount-error"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs text-white bg-indigo-600 rounded hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsPage;