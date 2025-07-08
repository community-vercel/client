'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/app/utils/helpers';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

export default function TransactionTable({ filters, onEdit, onDelete, refresh }) {
  console.log('filter',filters)
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
          `/transactions?startDate=${filters.startDate}&endDate=${filters.endDate}&category=${filters.category}&page=${currentPage}&limit=${itemsPerPage}`
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
    setCurrentPage(1); // Reset to first page when sorting changes
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
    if (sortConfig.key !== key) return <ArrowUpDown size={16} className="ml-1" />;
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={16} className="ml-1 text-indigo-500" />
    ) : (
      <ArrowDown size={16} className="ml-1 text-indigo-500" />
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-70 text-red-100 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-10">
          <svg
            className="animate-spin h-8 w-8 text-indigo-400 mx-auto"
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
          <p className="text-white mt-2">Loading transactions...</p>
        </div>
      )}

      {/* Pagination controls - top */}
      {!loading && (
        <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded p-1 text-sm"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} items)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table for md and larger screens */}
      {!loading && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full bg-opacity-50 rounded-lg table-fixed">
            <thead className="bg-green-800 text-white sticky top-0 z-10">
              <tr>
                {['transactionType', 'customerId', 'totalAmount', 'payable', 'receivable', 'dueDate', 'description', 'category', 'date'].map((key) => (
                  <th
                    key={key}
                    className="p-3 text-left cursor-pointer hover:bg-indigo-700 transition-all select-none w-[100px] sm:w-[120px] md:w-[150px] lg:w-[180px]"
                    onClick={() => handleSort(key)}
                  >
                    <div className="flex items-center capitalize">
                      {key === 'customerId' ? 'Customer' : key === 'transactionType' ? 'Type' : key}
                      {renderSortIcon(key)}
                    </div>
                  </th>
                ))}
                {role === 'admin' && (
                  <th className="p-3 text-left w-[120px] sm:w-[140px] md:w-[160px]">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((transaction, index) => (
                <motion.tr
                  key={transaction._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-t border-gray-700 text-white"
                >
                  <td className="p-3 truncate">
                    {transaction.transactionType === 'payable' ? 'Debit' : 'Credit'}
                  </td>
                  <td className="p-3 truncate">{transaction.customerId?.name || 'N/A'}</td>
                  <td
                    className={`p-3 font-semibold truncate ${
                      transaction.transactionType === 'payable' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(transaction.totalAmount?.toFixed(2) || 0)}
                  </td>
                  <td className="p-3 truncate">{formatCurrency(transaction.payable?.toFixed(2) || 0)}</td>
                  <td className="p-3 truncate">{formatCurrency(transaction.receivable?.toFixed(2) || 0)}</td>
                  <td className="p-3 truncate">
                    {transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3 truncate">{transaction.description || '—'}</td>
                  <td className="p-3 truncate">{transaction.category || '—'}</td>
                  <td className="p-3 truncate">{new Date(transaction.date).toLocaleDateString()}</td>
                  {role === 'admin' && (
                    <td className="p-3">
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => onEdit(transaction)}
                          className="text-indigo-600 hover:underline"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          onClick={() => onDelete(transaction._id)} // Fixed to pass only id
                          className="text-red-500 hover:underline"
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
      )}

      {/* Card layout for sm screens */}
      {!loading && (
        <div className="md:hidden space-y-4 p-4 bg-gray-200">
          {sortedTransactions.map((transaction, index) => (
            <motion.div
              key={transaction._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg p-4 shadow-md"
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">
                  {transaction.transactionType === 'payable' ? 'Debit' : 'Credit'}
                </div>
                <div
                  className={`font-semibold ${
                    transaction.transactionType === 'payable' ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(transaction.totalAmount?.toFixed(2) || 0)}
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium">Customer: </span>
                {transaction.customerId?.name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Payable: </span>
                {formatCurrency(transaction.payable?.toFixed(2) || 0)}
              </div>
              <div>
                <span className="font-medium">Receivable: </span>
                {formatCurrency(transaction.receivable?.toFixed(2) || 0)}
              </div>
              <div>
                <span className="font-medium">Due Date: </span>
                {transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : '—'}
              </div>
              <div>
                <span className="font-medium">Description: </span>
                {transaction.description || '—'}
              </div>
              <div>
                <span className="font-medium">Category: </span>
                {transaction.category || '—'}
              </div>
              <div>
                <span className="font-medium">Date: </span>
                {new Date(transaction.date).toLocaleDateString()}
              </div>
              {role === 'admin' && (
                <div className="flex gap-4 mt-3">
                  <motion.button
                    onClick={() => onEdit(transaction)}
                    className="text-indigo-600 hover:underline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Edit
                  </motion.button>
                  <motion.button
                    onClick={() => onDelete(transaction._id)} // Fixed to pass only id
                    className="text-red-500 hover:underline"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Delete
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination controls - bottom */}
      {!loading && (
        <div className="flex justify-between items-center mt-4 p-2 bg-gray-100 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border rounded p-1 text-sm"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} items)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}