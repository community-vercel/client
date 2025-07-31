'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/app/utils/helpers';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Image, Download, Eye } from 'lucide-react';
import api from '@/lib/api';

export default function TransactionTable({ filters, onEdit, onDelete, refresh }) {
  console.log('filter', filters);
  const [role, setRole] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', transactionId: '' });

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    if (userRole) setRole(userRole);
  }, []);

  // Fetch transactions with pagination
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError('');
      try {
         const response = await api.get(
        `/transactions?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}&customerId=${filters.customerId}&page=${currentPage}&limit=${itemsPerPage}`
      );
        setTransactions(response.data.transactions);
        setPagination(response.data.pagination);
      } catch (err) {
        setError('Failed to load transactions. Please try again.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [filters, currentPage, itemsPerPage, refresh]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1);
  };

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      if (sortConfig.key === 'customerId') {
        const aName = a.customerId?.name || 'N/A';
        const bName = b.customerId?.name || 'N/A';
        return sortConfig.direction === 'asc'
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      }
      if (sortConfig.key === 'totalAmount' || sortConfig.key === 'payable' || sortConfig.key === 'receivable') {
        return sortConfig.direction === 'asc'
          ? (a[sortConfig.key] || 0) - (b[sortConfig.key] || 0)
          : (b[sortConfig.key] || 0) - (a[sortConfig.key] || 0);
      }
      if (sortConfig.key === 'date' || sortConfig.key === 'dueDate') {
        return sortConfig.direction === 'asc'
          ? new Date(a[sortConfig.key] || a.createdAt) - new Date(b[sortConfig.key] || b.createdAt)
          : new Date(b[sortConfig.key] || b.createdAt) - new Date(a[sortConfig.key] || a.createdAt);
      }
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    return sorted;
  }, [transactions, sortConfig]);

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="ml-1 text-indigo-500" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-indigo-500" />
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleImageView = (imageUrl, transactionId) => {
    setImageModal({ isOpen: true, imageUrl, transactionId });
  };

  const handleImageDownload = async (imageUrl, transactionId) => {
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
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const renderImageActions = (transaction) => {
    if (!transaction.transactionImage) return <span className="text-gray-400 text-xs">No image</span>;
    
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
  };

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
          <svg
            className="animate-spin h-6 w-6 text-indigo-400 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
            />
          </svg>
          <p className="text-white mt-1 text-sm">Loading transactions...</p>
        </div>
      )}

      {/* Pagination controls - top */}
      {!loading && (
        <div className="flex justify-between items-center mb-3 p-2 bg-gray-100 rounded text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Items:</span>
            <select
              value={itemsPerPage}
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
              {pagination.currentPage}/{pagination.totalPages} ({pagination.totalItems})
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table for md and larger screens */}
      {!loading && (
<div className="hidden md:block overflow-x-auto">
  <table className="w-full bg-opacity-50 rounded-lg table-fixed text-sm">
    <thead className="bg-green-800 text-white sticky top-0 z-10">
      <tr>
        {['transactionType', 'customerId', 'totalAmount', 'payable', 'receivable', 'description', 'category', 'date'].map((key) => (
          <th
            key={key}
            className={`p-2 text-left cursor-pointer hover:bg-indigo-700 transition-all select-none text-xs ${
              key === 'transactionType' ? 'w-[80px]' : // Shrink type column
              key === 'category' ? 'w-[80px]' : // Shrink category column
              key === 'totalAmount' ? 'w-[140px]' : // Ensure amount displays fully
              key === 'date' ? 'w-[100px]' : // Constrain date column width
              key==='receivable' ? 'w-[140px]' : // Ensure receivable displays fully
               key==='payable' ? 'w-[140px]' :
              ''}`}
            onClick={() => handleSort(key)}
          >
            <div className="flex items-center capitalize">
              {key === 'customerId' ? 'Customer' : key === 'transactionType' ? 'Type' : key}
              {renderSortIcon(key)}
            </div>
          </th>
        ))}
        {role === 'admin' && (
          <th className="p-2 text-left text-xs w-[90px]">Actions</th> 
        )}
      </tr>
    </thead>
    <tbody>
      {sortedTransactions.map((transaction, index) => (
        <motion.tr
          key={transaction._id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="border-t border-gray-700 text-white hover:bg-gray-800 hover:bg-opacity-30 transition-colors"
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
          <td
            className={`p-2 font-semibold w-[120px] ${
              transaction.transactionType === 'payable' ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {formatCurrency(transaction.totalAmount?.toFixed(2) || 0)}
          </td>
          <td className="p-2 truncate">{formatCurrency(transaction.payable?.toFixed(2) || 0)}</td>
          <td className="p-2 truncate">{formatCurrency(transaction.receivable?.toFixed(2) || 0)}</td>
          <td className="p-0 truncate max-w-[80px]" title={transaction.description}>
            {transaction.description || '—'}
          </td>
          <td className="p-2 truncate max-w-[80px] overflow-hidden" title={transaction.category}>
            {transaction.category || '—'}
          </td>
          <td className="p-2 truncate w-[100px]">{new Date(transaction.date).toLocaleDateString()}</td> {/* Added w-[100px] */}
          {role === 'admin' && (
            <td className="p-0 w-[80px]"> {/* Reduced width from 100px to 80px */}
              <div className="flex gap-1">
                <motion.button
                  onClick={() => onEdit(transaction)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Edit
                </motion.button>
                <motion.button
                  onClick={() => onDelete(transaction._id)}
                  className="text-red-400 hover:text-red-300 text-xs"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Delete
                </motion.button>
              </div>
            </td>
          )}
        </motion.tr>
      ))}
    </tbody>
  </table>
</div>
//         <div className="hidden md:block overflow-x-auto">
//           <table className="w-full bg-opacity-50 rounded-lg table-fixed text-sm">
//             <thead className="bg-green-800 text-white sticky top-0 z-10">
//               <tr>
//                 {['transactionType', 'customerId', 'totalAmount', 'payable', 'receivable', 'description', 'category', 'date'].map((key) => (
//                   <th
//                     key={key}
//                     className="p-2 text-left cursor-pointer hover:bg-indigo-700 transition-all select-none text-xs"
//                     onClick={() => handleSort(key)}
//                   >
//                     <div className="flex items-center capitalize">
//                       {key === 'customerId' ? 'Customer' : key === 'transactionType' ? 'Type' : key}
//                       {renderSortIcon(key)}
//                     </div>
//                   </th>
//                 ))}
//                 {/* <th className="p-2 text-left text-xs">
//                   <Image size={14} className="inline mr-1" />
//                   Image
//                 </th> */}
//                 {role === 'admin' && (
//                   <th className="p-2 text-left text-xs">Actions</th>
//                 )}
//               </tr>
//             </thead>
//             <tbody>
//               {sortedTransactions.map((transaction, index) => (
//                 <motion.tr
//                   key={transaction._id}
//                   initial={{ opacity: 0, y: 5 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.05 }}
//                   className="border-t border-gray-700 text-white hover:bg-gray-800 hover:bg-opacity-30 transition-colors"
//                 >
//                   <td className="p-2 truncate">
//                     <span className={`px-2 py-1 rounded text-xs font-medium ${
//                       transaction.transactionType === 'payable' 
//                         ? 'bg-red-100 text-red-800' 
//                         : 'bg-green-100 text-green-800'
//                     }`}>
//                       {transaction.transactionType === 'payable' ? 'Debit' : 'Credit'}
//                     </span>
//                   </td>
//                   <td className="p-0 truncate">{transaction.customerId?.name || 'N/A'}</td>
//                   <td
//                     className={`p-2 font-semibold truncate ${
//                       transaction.transactionType === 'payable' ? 'text-red-400' : 'text-green-400'
//                     }`}
//                   >
//                     {formatCurrency(transaction.totalAmount?.toFixed(2) || 0)}
//                   </td>
//                   <td className="p-2 truncate">{formatCurrency(transaction.payable?.toFixed(2) || 0)}</td>
//                   <td className="p-2 truncate">{formatCurrency(transaction.receivable?.toFixed(2) || 0)}</td>
             
//                   <td className="p-2 truncate max-w-[120px]" title={transaction.description}>
//                     {transaction.description || '—'}
//                   </td>
// <td className="p-2 max-w-[100px] truncate">{transaction.category || '—'}</td>
//                   <td className="p-0 truncate">{new Date(transaction.date).toLocaleDateString()}</td>
//                   {/* <td className="p-2">
//                     {renderImageActions(transaction)}
//                   </td> */}
//                   {role === 'admin' && (
//                     <td className="p-2">
//                       <div className="flex gap-1">
//                         <motion.button
//                           onClick={() => onEdit(transaction)}
//                           className="text-indigo-400 hover:text-indigo-300 text-xs"
//                           whileHover={{ scale: 1.05 }}
//                           whileTap={{ scale: 0.95 }}
//                         >
//                           Edit
//                         </motion.button>
//                         <motion.button
//                           onClick={() => onDelete(transaction._id)}
//                           className="text-red-400 hover:text-red-300 text-xs"
//                           whileHover={{ scale: 1.05 }}
//                           whileTap={{ scale: 0.95 }}
//                         >
//                           Delete
//                         </motion.button>
//                       </div>
//                     </td>
//                   )}
//                 </motion.tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
      )}

      {/* Card layout for sm screens */}
      {!loading && (
        <div className="md:hidden space-y-3 p-3 bg-gray-200">
          {sortedTransactions.map((transaction, index) => (
            <motion.div
              key={transaction._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg p-3 shadow-md bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  transaction.transactionType === 'payable' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {transaction.transactionType === 'payable' ? 'Debit' : 'Credit'}
                </span>
                <div
                  className={`font-semibold text-sm ${
                    transaction.transactionType === 'payable' ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(transaction.totalAmount?.toFixed(2) || 0)}
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
                  <div>{formatCurrency(transaction.payable?.toFixed(2) || 0)}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Receivable:</span>
                  <div>{formatCurrency(transaction.receivable?.toFixed(2) || 0)}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Due Date:</span>
                  <div>{transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : '—'}</div>
                </div>
                <div>
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
              
              <div className="flex justify-between items-center mt-3 pt-2 border-t">
                {/* <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 text-sm">Image:</span>
                  {renderImageActions(transaction)}
                </div> */}
                
                {role === 'admin' && (
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => onEdit(transaction)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>
                    <motion.button
                      onClick={() => onDelete(transaction._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Delete
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
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
                  className="p-2 text-green-600 hover:bg-green-100 rounded"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setImageModal({ isOpen: false, imageUrl: '', transactionId: '' })}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
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
              />
            </div>
          </div>
        </div>
      )}

      {/* Pagination controls - bottom */}
      {!loading && (
        <div className="flex justify-between items-center mt-3 p-2 bg-gray-100 rounded text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Items:</span>
            <select
              value={itemsPerPage}
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
              {pagination.currentPage}/{pagination.totalPages} ({pagination.totalItems})
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )}