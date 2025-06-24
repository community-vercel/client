'use client';

import { motion } from 'framer-motion';

export default function TransactionTable({ transactions, onEdit, onDelete }) {
  console.log('Rendering TransactionTable with transactions:', transactions);
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-green bg-opacity-50 rounded-lg">
        <thead>
          <tr className="text-left text-white bg-green-800 bg-opacity-70">
            <th className="p-3">Type</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Description</th>
            <th className="p-3">Category</th>
            {/* <th className="p-3">Method</th> */}
            <th className="p-3">Date</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => (
            <motion.tr
              key={transaction._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-t border-gray-700 text-white"
            >
              <td className="p-3">{transaction.type === 'payment' ? 'Debit' : 'Credit'}</td>
              <td className="p-3">{transaction.customerId?.name || 'N/A'}</td>
              <td className={`p-3 ${transaction.type === 'payment' ? 'text-red-400' : 'text-green-400'}`}>
                ${transaction.amount.toFixed(2)}
              </td>
              <td className="p-3">{transaction.description}</td>
              <td className="p-3">{transaction.category}</td>
              {/* <td className="p-3">{transaction.type}</td> */}
              <td className="p-3">{new Date(transaction.date).toLocaleDateString()}</td>
              <td className="p-3">
                <button
                  onClick={() => onEdit(transaction)}
                  className="text-blue-400 hover:underline mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(transaction._id, transaction.type)}
                  className="text-red-400 hover:underline"
                >
                  Delete
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}