import { motion } from 'framer-motion';
import { formatCurrency } from '../app/utils/helpers';

const dashboardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

export default function SummaryDashboard({ transactions }) {
  const totalPayments = transactions
    .filter((t) => t.type === 'payment')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalReceipts = transactions
    .filter((t) => t.type === 'receipt')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const balance = totalReceipts - totalPayments;

  return (
    <motion.div
      variants={dashboardVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
    >
      <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl text-center">
        <h4 className="text-sm font-semibold text-gray-300 uppercase">Total Debits</h4>
        <p className="text-2xl font-bold text-red-400 mt-2">{formatCurrency(totalPayments)}</p>
      </div>
      <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl text-center">
        <h4 className="text-sm font-semibold text-gray-300 uppercase">Total Credits</h4>
        <p className="text-2xl font-bold text-green-400 mt-2">{formatCurrency(totalReceipts)}</p>
      </div>
      <div className="bg-gray-800 bg-opacity-60 backdrop-blur-lg p-6 rounded-xl shadow-xl text-center">
        <h4 className="text-sm font-semibold text-gray-300 uppercase">Net Balance</h4>
        <p className={`text-2xl font-bold mt-2 ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatCurrency(balance)}
        </p>
      </div>
    </motion.div>
  );
}