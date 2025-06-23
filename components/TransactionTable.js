'use client';

import { motion } from 'framer-motion';

export default function TransactionTable({ transactions, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-800 bg-opacity-50 rounded-lg">
        <thead className="bg-gray-900">
          <tr>
            {['Date', 'Description', 'Category', 'Amount', 'Type', 'Actions'].map((header, index) => (
              <th
                key={index}
                className="py-4 px-6 text-left text-sm font-semibold text-gray-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <motion.tr
                key={tx._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-t border-gray-700 hover:bg-gray-700 transition"
              >
                <td className="py-4 px-6 text-gray-200">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td className="py-4 px-6 text-gray-200">{tx.description}</td>
                <td className="py-4 px-6 text-gray-200">{tx.category}</td>
                <td className="py-4 px-6 text-right text-gray-200">${tx.amount}</td>
                <td className="py-4 px-6 text-gray-200">
                  {tx.receiptImage ? 'Receipt' : 'Payment'}
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => onEdit(tx)}
                    className="text-indigo-400 hover:text-indigo-300 mr-4 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(tx._id, tx.receiptImage ? 'receipt' : 'payment')}
                    className="text-red-400 hover:text-red-300 transition"
                  >
                    Delete
                  </button>
                </td>
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="py-4 px-6 text-center text-gray-400">
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}