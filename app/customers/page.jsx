'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import Link from 'next/link';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reportFormat, setReportFormat] = useState('pdf'); // Add state for report format

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/customers?search=${search}`);
        setCustomers(data);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to fetch customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', { name, phone, address });
      setName('');
      setPhone('');
      setAddress('');
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add customer');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${customerId}`);
      const { data } = await api.get('/customers');
      setCustomers(data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleGenerateReport = async (customerId) => {
    try {
      const { data } = await api.get(`/reports/summary?customerId=${customerId}&format=${reportFormat}`);
      window.open(data.url, '_blank');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate report');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-extrabold text-white text-center mb-8">Customers</h1>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6 text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Add Customer</h2>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="text"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
          >
            Add Customer
          </button>
        </form>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Report Format</h3>
          <select
            value={reportFormat}
            onChange={(e) => setReportFormat(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <svg
              className="animate-spin h-8 w-8 text-indigo-400 mx-auto"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
              ></path>
            </svg>
            <p className="text-white mt-2">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer) => (
              <motion.div
                key={customer._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 bg-gray-800 bg-opacity-50 rounded-xl shadow-lg flex justify-between items-center"
              >
                <div>
                  <Link href={`/transactions?customerId=${customer._id}`}>
                    <span className="text-blue-400 hover:underline">{customer.name}</span>
                  </Link>
                  <p className="text-gray-300">Phone: {customer.phone || 'N/A'}</p>
                  <p className="text-gray-300">Balance: {formatCurrency(customer.balance)}</p>
                </div>
                <div className="flex space-x-2">
          
    


                <Link href={`/payments?customerId=${customer._id}`}>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                      Add Transaction
                    </button>
                   </Link>
                  <button
                    onClick={() => handleGenerateReport(customer._id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    
                    Generate Report
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}