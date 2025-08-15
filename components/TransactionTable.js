'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { formatCurrency } from '@/app/utils/helpers';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

export default function TransactionTable({ filters, onEdit, onDelete, refresh }) {
  // Get role synchronously to avoid re-renders
  const initialRole = useMemo(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('role');
    }
    return null;
  }, []);

  const [state, setState] = useState({
    role: initialRole,
    sortConfig: { key: 'date', direction: 'desc' },
    currentPage: 1,
    itemsPerPage: 10,
    transactions: [],
    pagination: {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 1,
    },
    loading: false,
    error: '',
    imageModal: { isOpen: false, imageUrl: '', transactionId: '' },
    deleteModal: { isOpen: false, transactionId: '', customerName: '', deleting: false }
  });

  // Ref for abort controller
  const abortControllerRef = useRef();

  // Batch state updates
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Optimized fetch with abort controller and caching
  const fetchTransactions = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    updateState({ loading: true, error: '' });

    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
        category: filters.category || '',
        customerId: filters.customerId || '',
        page: state.currentPage.toString(),
        limit: state.itemsPerPage.toString(),
        shopId: filters.shopId || '',
        sortKey: state.sortConfig.key,
        sortDirection: state.sortConfig.direction
      });

      // Remove empty params to reduce URL length
      for (let [key, value] of queryParams.entries()) {
        if (!value) {
          queryParams.delete(key);
        }
      }

      const response = await api.get(`/transactions?${queryParams}`, { signal });
      
      if (!signal.aborted) {
        updateState({
          transactions: response.data.transactions || [],
          pagination: response.data.pagination || {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 1,
          },
          loading: false
        });
      }
    } catch (err) {
      if (!signal.aborted) {
        console.error('Fetch error:', err);
        updateState({
          error: 'Failed to load transactions. Please try again.',
          loading: false,
          transactions: [],
          pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 0,
            totalPages: 1,
          }
        });
      }
    }
  }, [filters, state.currentPage, state.itemsPerPage, state.sortConfig, updateState]);

  // Debounced fetch to prevent excessive API calls
  const debounceTimeoutRef = useRef();
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchTransactions();
    }, 100);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchTransactions, refresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Optimized sorting - only sort when data or sort config changes
  const sortedTransactions = useMemo(() => {
    if (!state.transactions.length) return [];
    
    const sorted = [...state.transactions];
    const { key, direction } = state.sortConfig;
    
    return sorted.sort((a, b) => {
      let aValue, bValue;
      
      switch (key) {
        case 'customerId':
          aValue = a.customerId?.name || '';
          bValue = b.customerId?.name || '';
          break;
        case 'totalAmount':
        case 'payable':
        case 'receivable':
          aValue = Number(a[key]) || 0;
          bValue = Number(b[key]) || 0;
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        case 'date':
        case 'dueDate':
          aValue = new Date(a[key] || a.createdAt);
          bValue = new Date(b[key] || b.createdAt);
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        default:
          aValue = String(a[key] || '');
          bValue = String(b[key] || '');
      }
      
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }, [state.transactions, state.sortConfig]);

  // Optimized handlers
  const handleSort = useCallback((key) => {
    updateState({
      sortConfig: {
        key,
        direction: state.sortConfig.key === key && state.sortConfig.direction === 'asc' ? 'desc' : 'asc',
      },
      currentPage: 1
    });
  }, [state.sortConfig, updateState]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= state.pagination.totalPages && newPage !== state.currentPage) {
      updateState({ currentPage: newPage });
    }
  }, [state.currentPage, state.pagination.totalPages, updateState]);

  const handleItemsPerPageChange = useCallback((e) => {
    const newItemsPerPage = Number(e.target.value);
    updateState({
      itemsPerPage: newItemsPerPage,
      currentPage: 1
    });
  }, [updateState]);

  const handleImageView = useCallback((imageUrl, transactionId) => {
    updateState({
      imageModal: { isOpen: true, imageUrl, transactionId }
    });
  }, [updateState]);

  const handleImageDownload = useCallback(async (imageUrl, transactionId) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transaction-${transactionId}-image.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Failed to download image');
    }
  }, []);

  const handleDeleteClick = useCallback((transaction) => {
    updateState({
      deleteModal: {
        isOpen: true,
        transactionId: transaction._id,
        customerName: transaction.customerId?.name || 'Unknown',
        deleting: false
      }
    });
  }, [updateState]);

  const confirmDelete = useCallback(async () => {
    // Show loading state immediately
    updateState({
      deleteModal: { 
        ...state.deleteModal, 
        deleting: true 
      }
    });

    try {
      await onDelete(state.deleteModal.transactionId);
      updateState({
        deleteModal: { 
          isOpen: false, 
          transactionId: '', 
          customerName: '', 
          deleting: false 
        }
      });
      toast.success('Transaction deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      updateState({
        deleteModal: { 
          ...state.deleteModal, 
          deleting: false 
        }
      });
      toast.error('Failed to delete transaction');
    }
  }, [state.deleteModal, onDelete, updateState]);

  const cancelDelete = useCallback(() => {
    if (state.deleteModal.deleting) return; // Prevent cancel during deletion
    
    updateState({
      deleteModal: { 
        isOpen: false, 
        transactionId: '', 
        customerName: '', 
        deleting: false 
      }
    });
  }, [state.deleteModal.deleting, updateState]);

  const closeImageModal = useCallback(() => {
    updateState({
      imageModal: { isOpen: false, imageUrl: '', transactionId: '' }
    });
  }, [updateState]);

  // Memoized render functions
  const renderSortIcon = useCallback((key) => {
    if (state.sortConfig.key !== key) {
      return <ArrowUpDown size={14} className="ml-1" />;
    }
    return state.sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="ml-1 text-indigo-500" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-indigo-500" />
    );
  }, [state.sortConfig]);

  const renderImageActions = useCallback((transaction) => {
    if (!transaction.transactionImage) {
      return <span className="text-gray-400 text-xs">No image</span>;
    }
    
    return (
      <div className="flex gap-1">
        <button
          onClick={() => handleImageView(transaction.transactionImage, transaction._id)}
          className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
          title="View image"
        >
          <Eye size={14} />
        </button>
        <button
          onClick={() => handleImageDownload(transaction.transactionImage, transaction._id)}
          className="p-1 text-green-500 hover:bg-green-100 rounded transition-colors"
          title="Download image"
        >
          <Download size={14} />
        </button>
      </div>
    );
  }, [handleImageView, handleImageDownload]);

  // Memoized pagination controls
  const PaginationControls = useMemo(() => (
    <div className="flex justify-between items-center p-2 bg-gray-100 rounded text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-600">Items:</span>
        <select
          value={state.itemsPerPage}
          onChange={handleItemsPerPageChange}
          className="border rounded px-1 py-0.5 text-sm"
        >
          {[5, 10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-600">
          {state.pagination.currentPage}/{state.pagination.totalPages} ({state.pagination.totalItems})
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => handlePageChange(state.currentPage - 1)}
            disabled={state.currentPage === 1}
            className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => handlePageChange(state.currentPage + 1)}
            disabled={state.currentPage === state.pagination.totalPages}
            className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  ), [state.itemsPerPage, state.pagination, state.currentPage, handleItemsPerPageChange, handlePageChange]);

  const { role, loading, error, transactions, imageModal, deleteModal } = state;

  return (
    <div className="w-full overflow-x-auto">
      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2 bg-red-900 bg-opacity-70 text-red-100 rounded text-center text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-4 border-indigo-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-white mt-1 text-sm">Loading transactions...</p>
        </div>
      )}

      {/* Pagination controls - top */}
      {!loading && transactions.length > 0 && (
        <div className="mb-3">
          {PaginationControls}
        </div>
      )}

      {/* No data message */}
      {!loading && transactions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No transactions found matching your criteria.</p>
        </div>
      )}

      {/* Table for md and larger screens */}
      {!loading && transactions.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full bg-opacity-50 rounded-lg table-fixed text-sm">
            <thead className="bg-green-800 text-white sticky top-0 z-10">
              <tr>
                {['transactionType', 'customerId', 'totalAmount', 'payable', 'receivable', 'description', 'category', 'date'].map((key) => (
                  <th
                    key={key}
                    className={`p-2 text-left cursor-pointer hover:bg-indigo-700 transition-all select-none text-xs ${
                      key === 'transactionType' ? 'w-[80px]' : 
                      key === 'category' ? 'w-[80px]' : 
                      key === 'totalAmount' ? 'w-[120px]' : 
                      key === 'date' ? 'w-[100px]' : 
                      key === 'receivable' ? 'w-[120px]' : 
                      key === 'payable' ? 'w-[120px]' : ''
                    }`}
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center capitalize">
                      {key === 'customerId' ? 'Customer' : key === 'transactionType' ? 'Type' : key}
                      {renderSortIcon(key)}
                    </div>
                  </th>
                ))}
                {(role === 'admin' || role === 'superadmin') && (
                  <th className="p-2 text-left text-xs w-[90px]">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction, index) => (
                <tr
                  key={transaction._id}
                  className="border-t border-gray-700 text-white hover:bg-gray-800 hover:bg-opacity-30 transition-colors"
                  style={{
                    animationDelay: `${index * 20}ms`,
                    animation: 'fadeIn 0.3s ease-out forwards'
                  }}
                >
                  <td className="p-2 truncate w-[80px]">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.transactionType === 'payable' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {transaction.transactionType === 'payable' ? 'Debit' : 'Credit'}
                    </span>
                  </td>
                  <td className="p-2 truncate">{transaction.customerId?.name || 'N/A'}</td>
                  <td className={`p-2 font-semibold w-[120px] ${
                    transaction.transactionType === 'payable' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {formatCurrency(Number(transaction.totalAmount || 0).toFixed(2))}
                  </td>
                  <td className="p-2 truncate w-[120px]">{formatCurrency(Number(transaction.payable || 0).toFixed(2))}</td>
                  <td className="p-2 truncate w-[120px]">{formatCurrency(Number(transaction.receivable || 0).toFixed(2))}</td>
                  <td className="p-2 truncate max-w-[80px]" title={transaction.description}>
                    {transaction.description || '—'}
                  </td>
                  <td className="p-2 truncate max-w-[80px] overflow-hidden" title={transaction.category}>
                    {transaction.category || '—'}
                  </td>
                  <td className="p-2 truncate w-[100px]">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  {(role === 'admin' || role === 'superadmin') && (
                    <td className="p-2 w-[90px]">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEdit(transaction)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs px-1 py-0.5 rounded hover:bg-indigo-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(transaction)}
                          className="text-red-400 hover:text-red-300 text-xs px-1 py-0.5 rounded hover:bg-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card layout for sm screens */}
      {!loading && transactions.length > 0 && (
        <div className="md:hidden space-y-3 p-3 bg-gray-200">
          {sortedTransactions.map((transaction, index) => (
            <div
              key={transaction._id}
              className="rounded-lg p-3 shadow-md bg-white"
              style={{
                animationDelay: `${index * 20}ms`,
                animation: 'slideIn 0.3s ease-out forwards'
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  transaction.transactionType === 'payable' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {transaction.transactionType === 'payable' ? 'Debit' : 'Credit'}
                </span>
                <div className={`font-semibold text-sm ${
                  transaction.transactionType === 'payable' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {formatCurrency(Number(transaction.totalAmount || 0).toFixed(2))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Customer:</span>
                  <div className="truncate">{transaction.customerId?.name || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Date:</span>
                  <div>{new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Payable:</span>
                  <div>{formatCurrency(Number(transaction.payable || 0).toFixed(2))}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Receivable:</span>
                  <div>{formatCurrency(Number(transaction.receivable || 0).toFixed(2))}</div>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Category:</span>
                  <div className="truncate">{transaction.category || '—'}</div>
                </div>
              </div>
              
              {transaction.description && (
                <div className="mt-2 text-sm">
                  <span className="font-medium text-gray-600">Description:</span>
                  <div className="text-gray-800">{transaction.description}</div>
                </div>
              )}
              
              {(role === 'admin' || role === 'superadmin') && (
                <div className="flex justify-end gap-3 mt-3 pt-2 border-t">
                  <button
                    onClick={() => onEdit(transaction)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(transaction)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            
              <p className="text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete the transaction for customer <strong>{deleteModal.customerName}</strong>? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleteModal.deleting}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  deleteModal.deleting 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteModal.deleting}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  deleteModal.deleting
                    ? 'bg-red-400 text-white cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg active:scale-95'
                }`}
              >
                {deleteModal.deleting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="font-semibold">Transaction Image</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleImageDownload(imageModal.imageUrl, imageModal.transactionId)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={closeImageModal}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-3">
              <img
                src={imageModal.imageUrl}
                alt="Transaction"
                className="w-full h-auto max-h-[70vh] object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pagination controls - bottom */}
      {!loading && transactions.length > 0 && (
        <div className="mt-3">
          {PaginationControls}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}