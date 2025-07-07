'use client';
import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/app/utils/helpers';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function TransactionTable({ transactions, onEdit, onDelete }) {
  const [role, setRole] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const userRole = localStorage.getItem('role');
    if (userRole) setRole(userRole);
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
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
      if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
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

  return (
    <div className="w-full overflow-x-hidden">
      {/* Table for md and larger screens */}
      <div className="hidden md:block overflow-x-hidden">
        <table className="w-full bg-opacity-50 rounded-lg table-fixed">
          <thead className="bg-green-800 text-white sticky top-0 z-10">
            <tr>
              {['type', 'customerId', 'amount', 'description', 'category', 'date'].map((key) => (
                <th
                  key={key}
                  className="p-3 text-left cursor-pointer hover:bg-indigo-700 transition-all select-none w-[100px] sm:w-[120px] md:w-[150px] lg:w-[180px]"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center capitalize">
                    {key === 'customerId' ? 'Customer' : key}
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
                  {transaction.type === 'payment' ? 'Debit' : 'Credit'}
                </td>
                <td className="p-3 truncate">{transaction.customerId?.name || 'N/A'}</td>
                <td
                  className={`p-3 font-semibold truncate ${
                    transaction.type === 'payment' ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(transaction.amount.toFixed(2))}
                </td>
                <td className="p-3 truncate">{transaction.description || '—'}</td>
                <td className="p-3 truncate">{transaction.category || '—'}</td>
                <td className="p-3 truncate">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
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
                        onClick={() => onDelete(transaction._id, transaction.type)}
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

      {/* Card layout for sm screens */}
      <div className="md:hidden space-y-4 p-4 bg-gray-200">
        {sortedTransactions.map((transaction, index) => (
          <motion.div
            key={transaction._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className=" rounded-lg p-4 shadow-md"
          >
            <div className="flex justify-between items-center">
              <div className="font-semibold">
                {transaction.type === 'payment' ? 'Debit' : 'Credit'}
              </div>
              <div
                className={`font-semibold ${
                  transaction.type === 'payment' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(transaction.amount.toFixed(2))}
              </div>
            </div>
            <div className="mt-2">
              <span className="font-medium">Customer: </span>
              {transaction.customerId?.name || 'N/A'}
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
                  onClick={() => onDelete(transaction._id, transaction.type)}
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
    </div>
  );
}