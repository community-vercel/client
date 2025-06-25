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
    return sortConfig.direction === 'asc'
      ? <ArrowUp size={16} className="ml-1 text-indigo-500" />
      : <ArrowDown size={16} className="ml-1 text-indigo-500" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-green bg-opacity-50 rounded-lg">
       

      <thead className="bg-green-800 text-white sticky top-0 z-10">
          <tr>
            {['type', 'customerId', 'amount', 'description', 'category', 'date'].map((key) => (
              <th
                key={key}
                className="p-4 text-left cursor-pointer hover:bg-indigo-700 transition-all select-none"
                onClick={() => handleSort(key)}
              >
                <div className="flex items-center capitalize">
                  {key === 'customerId' ? 'Customer' : key}
                  {renderSortIcon(key)}
                </div>
              </th>
            ))}
            <th className="p-4 text-left">Actions</th>
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


                <td className="p-3">{transaction.type === 'payment' ? 'Debit' : 'Credit'}</td>


              <td className="p-4">{transaction.customerId?.name || 'N/A'}</td>
              <td
                className={`p-4 font-semibold ${
                  transaction.type === 'payment' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {formatCurrency(transaction.amount.toFixed(2))}
              </td>
              <td className="p-4">{transaction.description || '—'}</td>
              <td className="p-4">{transaction.category || '—'}</td>
              <td className="p-4">{new Date(transaction.date).toLocaleDateString()}</td>
              <td className="p-4">
                {role === 'admin' && (
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
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}