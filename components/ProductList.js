'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PlusCircle, Edit, Trash2, X } from 'lucide-react';
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
  const router = useRouter();
  const token = localStorage.getItem('token');

  // Debounced search function
  const debouncedFetchProducts = useCallback(
    debounce(async (searchQuery, pageNum) => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
          params: { search: searchQuery, page: pageNum, limit },
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(res.data.items);
        setTotalPages(Math.ceil(res.data.total / limit));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch items', {
          position: 'top-right',
        });
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
      const message =
        error.response?.status === 404
          ? 'No logs found for this item'
          : error.response?.data?.message || 'Failed to fetch audit logs';
      toast.error(message, { position: 'top-right' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Item deleted successfully!', { position: 'top-right' });
        debouncedFetchProducts(search, page);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete item', {
          position: 'top-right' });
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const calculateSalePrice = (retailPrice, discountPercentage) => {
    return (retailPrice - (retailPrice * discountPercentage) / 100).toFixed(2);
  };

  const closeModal = () => {
    setShowLogsModal(false);
    setSelectedItemLogs([]);
    setSelectedItemId(null);
  };

  // Calculate inventory totals
  const totalQuantity = products.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalCostPrice = products
    .reduce((sum, item) => sum + (item.quantity || 0) * (item.productId?.costPrice || 0), 0)
    .toFixed(2);
  const totalRetailPrice = products
    .reduce((sum, item) => sum + (item.quantity || 0) * (item.productId?.retailPrice || 0), 0)
    .toFixed(2);
  const totalSalePrice = products
    .reduce(
      (sum, item) =>
        sum +
        (item.quantity || 0) *
        (item.productId?.retailPrice
          ? calculateSalePrice(item.productId.retailPrice, item.discountPercentage)
          : 0),
      0
    )
    .toFixed(2);

  return (
    <div className="container mx-auto p-2 px-0 sm:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 h-screen overflow-hidden">
      <ToastContainer theme="colored" />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="relative w-full sm:w-1/2">
          <input
            type="text"
            placeholder="Search by name, category, shelf, color, or barcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full p-2 pl-12 pr-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 text-gray-700 placeholder-gray-400"
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
        <button
          onClick={() => router.push('/products/add')}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 transform hover:-translate-y-1"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md max-h-[calc(100vh-200px)] ">
        {/* Table layout for desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse ">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">S.No</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Name</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Quantity</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Cost Price</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Retail Price</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Discount(%)</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Sale Price</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Color</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Color Code</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Category</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Max Stock</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Shelf</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Barcode</th>
                <th className="p-2 text-left font-semibold text-sm uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="14" className="p-6 text-center text-gray-500">
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
              ) : products.length > 0 ? (
                products.map((item, index) => (
                  <tr
                    key={item._id}
                    className="border-b border-gray-100 hover:bg-indigo-50 transition-colors duration-200"
                  >
                    <td className="p-2 text-gray-600">{(page - 1) * limit + index + 1}</td>
                    <td className="p-2 text-gray-800 font-medium">{item.productId?.name || 'N/A'}</td>
                    <td className="p-2 text-gray-600">{item.quantity}</td>
                    <td className="p-2 text-gray-600">{item.productId?.costPrice?.toFixed(2) || 'N/A'}</td>
                    <td className="p-2 text-gray-600">{item.productId?.retailPrice?.toFixed(2) || 'N/A'}</td>
                    <td className="p-2 text-gray-600">{item.discountPercentage}%</td>
                    <td className="p-2 text-gray-600">
                      {' '}
                      {item.productId?.retailPrice
                        ? calculateSalePrice(item.productId.retailPrice, item.discountPercentage)
                        : 'N/A'}
                    </td>
                    <td className="p-2 text-gray-600 flex items-center space-x-2">
                      {item.colorCode && (
                        <span
                          className="w-4 h-4 rounded-full inline-block"
                          style={{ backgroundColor: item.colorCode }}
                        ></span>
                      )}
                      <span>{item.color || 'N/A'}</span>
                    </td>
                    <td className="p-2 text-gray-600">{item.colorCode || 'N/A'}</td>
                    <td className="p-2 text-gray-600">{item.category || 'N/A'}</td>
                    <td className="p-2 text-gray-600">{item.maxStock || 'N/A'}</td>
                    <td className="p-2 text-gray-600">{item.shelf || 'N/A'}</td>
                    <td className="p-2 text-gray-600">{item.barcode || 'N/A'}</td>
                    <td className="p-2 flex space-x-3">
                      <button
                        onClick={() => router.push(`/products/${item._id}`)}
                        className="flex items-center px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all duration-200"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-all duration-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItemId(item._id);
                          fetchItemLogs(item._id);
                        }}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-all duration-200"
                        title="View Logs"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="14" className="p-6 text-center text-gray-500">
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
            {products.length > 0 && (
              <tfoot>
                <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold">
                  <td className="p-2">Total</td>
                  <td className="p-2"></td>
                  <td className="p-2">{totalQuantity}</td>
                  <td className="p-2">{totalCostPrice}</td>
                  <td className="p-2">{totalRetailPrice}</td>
                  <td className="p-2"></td>
                  <td className="p-2">{totalSalePrice}</td>
                  <td className="p-2" colSpan="7"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Card layout for mobile and tablet */}
        <div className="lg:hidden grid gap-6 p-2">
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
          ) : products.length > 0 ? (
            products.map((item, index) => (
              <div
                key={item._id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {item.productId?.name || 'N/A'}
                  </h3>
                  <span className="text-sm text-gray-500">
                    #{(page - 1) * limit + index + 1}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <p>
                      <span className="font-medium">Quantity:</span> {item.quantity}
                    </p>
                    <p>
                      <span className="font-medium">Cost Price:</span> PKR{' '}
                      {item.productId?.costPrice?.toFixed(2) || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Retail Price:</span> PKR{' '}
                      {item.productId?.retailPrice?.toFixed(2) || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Discount:</span>{' '}
                      {item.discountPercentage}%
                    </p>
                    <p>
                      <span className="font-medium">Sale Price:</span> PKR{' '}
                      {item.productId?.retailPrice
                        ? calculateSalePrice(
                            item.productId.retailPrice,
                            item.discountPercentage
                          )
                        : 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Category:</span>{' '}
                      {item.category || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center space-x-2">
                      <span className="font-medium">Color:</span>
                      {item.colorCode && (
                        <span
                          className="w-4 h-4 rounded-full inline-block"
                          style={{ backgroundColor: item.colorCode }}
                        ></span>
                      )}
                      <span>{item.color || 'N/A'}</span>
                    </p>
                    <p>
                      <span className="font-medium">Color Code:</span>{' '}
                      {item.colorCode || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Max Stock:</span>{' '}
                      {item.maxStock || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Shelf:</span> {item.shelf || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Barcode:</span>{' '}
                      {item.barcode || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => router.push(`/products/${item._id}`)}
                    className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all duration-200"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-all duration-200"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItemId(item._id);
                      fetchItemLogs(item._id);
                    }}
                    className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-all duration-200"
                    title="View Logs"
                  >
                    <PlusCircle className="w-4 h-4" />
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
      </div>

      {products.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Total Quantity:</span> {totalQuantity}
            </p>
            <p>
              <span className="font-medium">Total Cost Price:</span> PKR {totalCostPrice}
            </p>
            <p>
              <span className="font-medium">Total Retail Price:</span> PKR {totalRetailPrice}
            </p>
            <p>
              <span className="font-medium">Total Sale Price:</span> PKR {totalSalePrice}
            </p>
          </div>
        </div>
      )}

      {showLogsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl transform transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <span>Audit Logs</span>
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedItemLogs.length === 0 ? (
              <p className="text-gray-500 text-center py-4 text-lg">No audit logs found.</p>
            ) : (
              <div className="space-y-3">
                {selectedItemLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {log.action === 'CREATE' && (
                        <PlusCircle className="w-4 h-4 text-green-500" />
                      )}
                      {log.action === 'UPDATE' && (
                        <Edit className="w-4 h-4 text-indigo-500" />
                      )}
                      {log.action === 'DELETE' && (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          <span className="font-medium">Action:</span> {log.action}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">User:</span>{' '}
                          {log.userId?.username || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Time:</span>{' '}
                          {new Date(log.createdAt).toLocaleString('en-US', {
                            timeZone: 'Asia/Karachi',
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                    {log.changes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium mb-1">Changes:</p>
                        <div className="bg-white p-2 rounded-md border border-gray-100">
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
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeModal}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-md hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {products.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6">
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
  );
}