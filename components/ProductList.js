'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  PlusCircle, Edit, Trash2, X, Search, Package, 
  TrendingUp, TrendingDown, Eye, Filter, RefreshCw,
  AlertTriangle, DollarSign, Hash, Palette, Archive
} from 'lucide-react';
import debounce from 'lodash/debounce';

export default function ProductList({ products: initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItemLogs, setSelectedItemLogs] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [totals, setTotals] = useState({
    totalQuantity: 0,
    totalCostPrice: 0,
    totalRetailPrice: 0,
    totalSalePrice: 0,
  });
  const router = useRouter();
  const token = localStorage.getItem('token');

  // Debounced search function
  const debouncedFetchProducts = useCallback(
    debounce(async (searchQuery, pageNum) => {
      setIsLoading(true);
      try {
        const [itemsRes, totalsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
            params: { search: searchQuery, page: pageNum, limit },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/totals`, {
            params: { search: searchQuery },
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setProducts(itemsRes.data.items);
        setTotalPages(Math.ceil(itemsRes.data.total / limit));
        setTotals({
          totalQuantity: totalsRes.data.totalQuantity || 0,
          totalCostPrice: totalsRes.data.totalCostPrice || 0,
          totalRetailPrice: totalsRes.data.totalRetailPrice || 0,
          totalSalePrice: totalsRes.data.totalSalePrice || 0,
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch items');
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [token, limit]
  );

  useEffect(() => {
    if (token) {
      debouncedFetchProducts(search, page);
    } else {
      router.push('/auth/signin');
    }
  }, [search, page, token, router, debouncedFetchProducts]);

  const fetchItemLogs = async (itemId) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/audit-logs`, {
        params: { entityId: itemId, limit: 10, page: 1 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedItemLogs(res.data.logs);
      setShowLogsModal(true);
    } catch (error) {
      toast.error(
        error.response?.status === 404
          ? 'No logs found for this item'
          : error.response?.data?.message || 'Failed to fetch audit logs'
      );
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Item deleted successfully!');
        debouncedFetchProducts(search, page);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const calculateSalePrice = (retailPrice, discountPercentage) =>
    (retailPrice - (retailPrice * discountPercentage) / 100).toFixed(2);

  const closeModal = () => {
    setShowLogsModal(false);
    setSelectedItemLogs([]);
    setSelectedItemId(null);
  };

  const getStockStatus = (quantity, maxStock) => {
    if (!maxStock) return { status: 'unknown', color: 'gray' };
    const percentage = (quantity / maxStock) * 100;
    if (percentage <= 20) return { status: 'critical', color: 'red' };
    if (percentage <= 50) return { status: 'low', color: 'yellow' };
    return { status: 'good', color: 'green' };
  };

  const summaryCards = [
    {
      title: 'Total Items',
      value: totals.totalQuantity,
      icon: <Package className="w-5 h-5" />,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Cost',
      value: `PKR ${totals.totalCostPrice.toLocaleString()}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Retail',
      value: `PKR ${totals.totalRetailPrice.toLocaleString()}`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Total Sale',
      value: `PKR ${totals.totalSalePrice.toLocaleString()}`,
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      <ToastContainer theme="colored" position="top-right" />

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => router.push('/products/add')}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <div key={index} className={`${card.bgColor} rounded-lg p-4 shadow hover:shadow-md`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">{card.title}</p>
                  <p className={`text-lg font-semibold ${card.textColor}`}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${card.color} text-white`}>{card.icon}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="bg-[#757575] p-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Archive className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-semibold">Product Inventory</h2>
                <p className="text-xs text-indigo-100">Manage your products</p>
              </div>
            </div>
            <button
              onClick={() => debouncedFetchProducts(search, page)}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg disabled:opacity-50 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  { label: '#', icon: <Hash className="w-3 h-3" /> },
                  { label: 'Product', icon: <Package className="w-3 h-3" /> },
                  { label: 'Stock', icon: <TrendingUp className="w-3 h-3" /> },
                  { label: 'Cost', icon: <DollarSign className="w-3 h-3" /> },
                  { label: 'Retail', icon: <DollarSign className="w-3 h-3" /> },
                  { label: 'Discount', icon: <TrendingDown className="w-3 h-3" /> },
                  { label: 'Sale', icon: <DollarSign className="w-3 h-3" /> },
                  { label: 'Color', icon: <Palette className="w-3 h-3" /> },
                  { label: 'Category', icon: <Filter className="w-3 h-3" /> },
                  { label: 'Details', icon: <Eye className="w-3 h-3" /> },
                  { label: 'Actions', icon: <Edit className="w-3 h-3" /> },
                ].map((header, index) => (
                  <th key={index} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    <div className="flex items-center space-x-1">
                      {header.icon}
                      <span>{header.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="11" className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-gray-600">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((item, index) => {
                  const stockStatus = getStockStatus(item.quantity, item.maxStock);
                  return (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-indigo-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.productId?.name || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">{item.barcode || 'No barcode'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                          {stockStatus.status !== 'unknown' && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                stockStatus.color === 'red'
                                  ? 'bg-red-100 text-red-600'
                                  : stockStatus.color === 'yellow'
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'bg-green-100 text-green-600'
                              }`}
                            >
                              {stockStatus.status === 'critical' && (
                                <AlertTriangle className="w-3 h-3 inline mr-1" />
                              )}
                              {stockStatus.status}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">Max: {item.maxStock || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        PKR {item.productId?.costPrice?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        PKR {item.productId?.retailPrice?.toFixed(2) || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs">
                          {item.discountPercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        PKR{' '}
                        {item.productId?.retailPrice
                          ? calculateSalePrice(item.productId.retailPrice, item.discountPercentage)
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {item.colorCode && (
                            <div
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: item.colorCode }}
                            />
                          )}
                          <span className="text-sm text-gray-900">{item.color || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                          {item.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">Shelf: {item.shelf || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/products/${item._id}`)}
                            className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItemId(item._id);
                              fetchItemLogs(item._id);
                            }}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                            title="View Logs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="w-8 h-8 text-gray-400" />
                      <p className="text-sm text-gray-600">No products found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-2 py-8">
              <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          ) : products.length > 0 ? (
            products.map((item, index) => {
              const stockStatus = getStockStatus(item.quantity, item.maxStock);
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow p-4 space-y-3 border border-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.productId?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">#{(page - 1) * limit + index + 1}</p>
                      </div>
                    </div>
                    {stockStatus.status !== 'unknown' && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          stockStatus.color === 'red'
                            ? 'bg-red-100 text-red-600'
                            : stockStatus.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {stockStatus.status === 'critical' && (
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                        )}
                        {stockStatus.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Stock:</span> {item.quantity} /{' '}
                        {item.maxStock || 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Cost:</span> PKR{' '}
                        {item.productId?.costPrice?.toFixed(2) || 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Retail:</span> PKR{' '}
                        {item.productId?.retailPrice?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        <span className="font-medium">Sale:</span> PKR{' '}
                        {item.productId?.retailPrice
                          ? calculateSalePrice(item.productId.retailPrice, item.discountPercentage)
                          : 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Discount:</span>{' '}
                        <span className="px-1 bg-orange-100 text-orange-600 rounded text-xs">
                          {item.discountPercentage}%
                        </span>
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Category:</span>{' '}
                        <span className="px-1 bg-blue-100 text-blue-600 rounded text-xs">
                          {item.category || 'N/A'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Color:</span>
                      {item.colorCode && (
                        <div
                          className="w-4 h-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: item.colorCode }}
                        />
                      )}
                      <span className="text-gray-900">{item.color || 'N/A'}</span>
                    </div>
                    <p className="text-gray-600">
                      <span className="font-medium">Shelf:</span> {item.shelf || 'N/A'}
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => router.push(`/products/${item._id}`)}
                      className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 text-xs"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItemId(item._id);
                        fetchItemLogs(item._id);
                      }}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 text-xs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Summary */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Inventory Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
            <p>Quantity: {totals.totalQuantity}</p>
            <p>Cost: PKR {totals.totalCostPrice.toFixed(2)}</p>
            <p>Retail: PKR {totals.totalRetailPrice.toFixed(2)}</p>
            <p>Sale: PKR {totals.totalSalePrice.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-[70vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center space-x-1">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>Audit Logs</span>
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedItemLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-3 text-sm">No audit logs found</p>
            ) : (
              <div className="space-y-2">
                {selectedItemLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-2 bg-indigo-50 rounded border border-indigo-100 text-xs"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {log.action === 'CREATE' && <PlusCircle className="w-3 h-3 text-green-500" />}
                      {log.action === 'UPDATE' && <Edit className="w-3 h-3 text-indigo-500" />}
                      {log.action === 'DELETE' && <Trash2 className="w-3 h-3 text-red-500" />}
                      <div>
                        <p>
                          <span className="font-medium">Action:</span> {log.action}
                        </p>
                        <p>
                          <span className="font-medium">User:</span> {log.userId?.username || 'Unknown'}
                        </p>
                        <p>
                          <span className="font-medium">Time:</span>{' '}
                          {new Date(log.createdAt).toLocaleString('en-US', {
                            timeZone: 'Asia/Karachi',
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                    {log.changes && (
                      <div className="mt-1">
                        <p className="font-medium">Changes:</p>
                        <div className="bg-white p-1 rounded border border-gray-100">
                          {log.action === 'CREATE' ? (
                            <ul className="space-y-1">
                              {Object.entries(log.changes.newData || {}).map(([key, value]) => (
                                <li key={key} className="flex justify-between">
                                  <span className="font-medium capitalize">{key}:</span>
                                  <span>{JSON.stringify(value) || 'N/A'}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="space-y-1">
                              {Object.entries(log.changes).map(([key, change]) => (
                                <li key={key} className="flex justify-between">
                                  <span className="font-medium capitalize">{key}:</span>
                                  <span>
                                    {JSON.stringify(change.old) || 'N/A'} →{' '}
                                    {JSON.stringify(change.new) || 'N/A'}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                onClick={closeModal}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {products.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm">
          <div className="text-gray-600 mb-2 sm:mb-0">
            Page {page} of {totalPages}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300 text-xs"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded text-xs ${
                  page === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-300 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}