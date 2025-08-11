'use client';

import { useState,useEffect } from 'react';
import { X, Plus, Loader2, FileText } from 'lucide-react';
import Link from 'next/link';
import api from '../lib/api'; // Import api for customer creation
import { toast } from 'react-toastify';

const QuotationForm = ({
  customers,
  products,
  filteredProducts,
  shops,
  quotationForm,
  handleQuotationChange,
  addProductRow,
  removeProductRow,
  calculateQuotationTotal,
  handleSubmitQuotation,
  customerSearch,
  setCustomerSearch,
  productSearch,
  setProductSearch,
}) => {
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false); // State for new customer form
  const [newCustomerPhone, setNewCustomerPhone] = useState(''); // State for new customer's phone
  const [localCustomers, setLocalCustomers] = useState(customers); // Local customer state to update list

  // Sync local customers with prop changes
  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

  // Enhanced form submission with loading state
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Validation checks
    if (!quotationForm.customerId) {
      alert('Please select a customer');
      return;
    }
    
    if (quotationForm.products.length === 0) {
      alert('Please add at least one product');
      return;
    }
    
    // Check if all products have required fields
    const invalidProduct = quotationForm.products.find(product => 
      !product.productId || 
      !product.quantity || 
      product.quantity <= 0 ||
      (!product.salePrice && product.salePrice !== 0) ||
      product.salePrice < 0
    );
    
    if (invalidProduct) {
      alert('Please fill in all product details correctly');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await handleSubmitQuotation(e);
    } catch (error) {
      console.error('Error generating quotation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle customer search input
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value;
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    // Show new customer form if no exact match and input is not empty
    const customerExists = localCustomers.some(c => 
      c.name.toLowerCase() === value.toLowerCase()
    );
    setShowCustomerForm(!customerExists && value.trim() !== '');
  };

  // Handle selecting a customer from dropdown
  const handleSelectCustomer = (customer) => {
    handleQuotationChange({ target: { name: 'customerId', value: customer._id } });
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    setShowCustomerForm(false);
  };

  // Handle adding a new customer
  const handleAddCustomer = async () => {
    try {
      const shopId = localStorage.getItem('shopId') || quotationForm.shopId;
      if (!shopId) {
        toast.error('Shop context required for adding customers');
        return;
      }
      
      const { data } = await api.post('/customers', {
        name: customerSearch,
        phone: newCustomerPhone,
        shopId: shopId === 'all' ? null : shopId, // Handle 'all' shops case
      });
      
      setLocalCustomers(prev => [...prev, data]);
      handleQuotationChange({ target: { name: 'customerId', value: data._id } });
      setCustomerSearch(data.name);
      setShowCustomerForm(false);
      setNewCustomerPhone('');
      setShowCustomerDropdown(false);
      toast.success('Customer added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add customer.');
      console.error('Add customer error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {localStorage.getItem('role') === 'superadmin' && shops.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Shop</label>
              <select
                name="shopId"
                value={quotationForm.shopId || ''}
                onChange={handleQuotationChange}
                disabled={isGenerating}
                className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="">Select Shop</option>
                <option value="all">All Shops</option>
                {shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              Customer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Search or add customer..."
              value={customerSearch}
              onChange={handleCustomerSearchChange}
              onFocus={() => setShowCustomerDropdown(true)}
              disabled={isGenerating}
              className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {showCustomerDropdown && !isGenerating && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {localCustomers.length > 0 ? (
                  localCustomers.map((customer) => (
                    <li
                      key={customer._id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="px-4 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
                    >
                      {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-sm text-gray-500">No customers found</li>
                )}
              </ul>
            )}
            <input type="hidden" name="customerId" value={quotationForm.customerId} />
          </div>
        </div>

        {/* New Customer Form */}
        {showCustomerForm && !isGenerating && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-4">
            <h4 className="text-lg font-semibold text-blue-800">Add New Customer</h4>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-700">Phone (optional)</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <button
              type="button"
              onClick={handleAddCustomer}
              className="w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
            >
              Add Customer
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Products <span className="text-red-500">*</span>
          </label>
          {quotationForm.products.map((item, index) => {
            const product = products.find((p) => p._id === item.productId);
            return (
              <div key={index} className="flex flex-col space-y-4 mb-4 border p-4 rounded-lg bg-gray-50">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch[index] || ''}
                    onChange={(e) => {
                      setProductSearch((prev) => ({ ...prev, [index]: e.target.value }));
                      setShowProductDropdown((prev) => ({ ...prev, [index]: true }));
                    }}
                    onFocus={() => setShowProductDropdown((prev) => ({ ...prev, [index]: true }))}
                    disabled={isGenerating}
                    className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {showProductDropdown[index] && !isGenerating && (
                    <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredProducts(index).length > 0 ? (
                        filteredProducts(index).map((product) => (
                          <li
                            key={product._id}
                            onClick={() => {
                              handleQuotationChange(
                                {
                                  target: {
                                    name: 'productId',
                                    value: product._id,
                                  },
                                },
                                index
                              );
                              setProductSearch((prev) => ({ ...prev, [index]: product.name }));
                              setShowProductDropdown((prev) => ({ ...prev, [index]: false }));
                            }}
                            className="px-4 py-2 text-sm hover:bg-indigo-50 cursor-pointer"
                          >
                            {product.name} ({product.category})
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-2 text-sm text-gray-500">No products found</li>
                      )}
                    </ul>
                  )}
                  <input type="hidden" name="productId" value={item.productId} />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleQuotationChange(e, index)}
                      disabled={isGenerating}
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Cost Price (PKR)</label>
                    <input
                      type="number"
                      name="costPrice"
                      value={item.costPrice || 0}
                      onChange={(e) => handleQuotationChange(e, index)}
                      disabled={isGenerating}
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Retail Price (PKR)</label>
                    <input
                      type="number"
                      name="retailPrice"
                      value={item.retailPrice || 0}
                      onChange={(e) => handleQuotationChange(e, index)}
                      disabled={isGenerating}
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Discount (%)</label>
                    <input
                      type="number"
                      name="discountPercentage"
                      value={item.discountPercentage || 0}
                      onChange={(e) => handleQuotationChange(e, index)}
                      disabled={isGenerating}
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Sale Price (PKR) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="salePrice"
                      value={(item.salePrice || 0).toFixed(2)}
                      onChange={(e) => handleQuotationChange(e, index)}
                      disabled={isGenerating}
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                {quotationForm.products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProductRow(index)}
                    disabled={isGenerating}
                    className="p-2 text-red-600 hover:text-red-700 text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Remove product"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={addProductRow}
            disabled={isGenerating}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Product
          </button>
        </div>

        {/* Total Display */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
          <div className="text-lg font-semibold text-gray-800">
            Total: PKR {calculateQuotationTotal()}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {quotationForm.products.length} product{quotationForm.products.length !== 1 ? 's' : ''} selected
          </div>
        </div>

        {/* Loading State Message */}
        {isGenerating && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin mr-3" />
              <div>
                <p className="text-sm text-blue-700 font-medium">
                  Generating your quotation...
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This may take a few seconds. Please dont close this window.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isGenerating}
            className="flex-1 p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 text-sm font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-indigo-600 disabled:hover:to-blue-600 flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate & Preview
              </>
            )}
          </button>
          <Link
            href="/dashboard"
            className={`flex-1 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors text-center flex items-center justify-center ${
              isGenerating ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;