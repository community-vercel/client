// components/CustomerSearch.js
'use client'
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../app/utils/useDebounce'; // Adjust the import path as necessary
import api from '../lib/api'; // Adjust the import path as necessary

const suggestionVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
};

function CustomerSearch({
  formData,
  setFormData,
  customers,
  setCustomers,
  setShowCustomerForm,
  showCustomerForm,
  handleAddCustomer,
}) {
  const [searchTerm, setSearchTerm] = useState(formData.customerName);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch suggestions when debounced search term changes
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setSuggestions(customers);
      setIsDropdownOpen(false);
      setShowCustomerForm(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      setSearchError('');
      try {
        const { data } = await api.get(`/customers/search?name=${encodeURIComponent(debouncedSearchTerm)}`);
        setSuggestions(data);
        setIsDropdownOpen(true);
        setShowCustomerForm(!data.some((c) => c.name.toLowerCase() === debouncedSearchTerm.toLowerCase()));
      } catch (err) {
        setSearchError('Failed to fetch customers. Showing cached results.');
        setSuggestions(
          customers.filter((c) => c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        );
        setIsDropdownOpen(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm, customers, setShowCustomerForm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !inputRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFormData({ ...formData, customerName: value });
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (customer) => {
    setFormData({ ...formData, customerName: customer.name, customerId: customer._id });
    setSearchTerm(customer.name);
    setIsDropdownOpen(false);
    setShowCustomerForm(false);
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchTerm('');
    setFormData({ ...formData, customerName: '', customerId: '' });
    setIsDropdownOpen(false);
    setShowCustomerForm(false);
    inputRef.current.focus();
  };

  // Highlight matching text in suggestions
  const highlightMatch = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-indigo-500 bg-opacity-30">$1</mark>');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search or add customer"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsDropdownOpen(true)}
          className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition pr-10"
          required
          aria-label="Customer Name"
          aria-autocomplete="list"
          aria-controls="customer-suggestions"
          aria-expanded={isDropdownOpen}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
        {isLoading && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="animate-spin h-5 w-5 text-indigo-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
              />
            </svg>
          </span>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isDropdownOpen && suggestions.length > 0 && (
          <motion.ul
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={suggestionVariants}
            className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
            id="customer-suggestions"
          >
            {suggestions.map((customer) => (
              <li
                key={customer._id}
                onClick={() => handleSelectSuggestion(customer)}
                className="p-3 text-white hover:bg-indigo-500 hover:bg-opacity-50 cursor-pointer transition"
                role="option"
                aria-selected={formData.customerId === customer._id}
                dangerouslySetInnerHTML={{ __html: highlightMatch(customer.name, debouncedSearchTerm) }}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Search Error */}
      <AnimatePresence>
        {searchError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-sm mt-1"
            role="alert"
          >
            {searchError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* New Customer Form */}
      <AnimatePresence>
        {showCustomerForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 mt-2"
          >
            <input
              type="text"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              aria-label="Customer Phone"
            />
            <button
              type="button"
              onClick={handleAddCustomer}
              className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition"
              aria-label="Add New Customer"
            >
              Add Customer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CustomerSearch;