'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import Link from 'next/link';

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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmitQuotation} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {localStorage.getItem('role') === 'superadmin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Shop</label>
              <select
                name="shopId"
                value={quotationForm.shopId || ''}
                onChange={handleQuotationChange}
                className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
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
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <input
              type="text"
              placeholder="Search customers..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerDropdown(true);
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              className="mt-1 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm transition-colors"
            />
            {showCustomerDropdown && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <li
                      key={customer._id}
                      onClick={() => {
                        handleQuotationChange({ target: { name: 'customerId', value: customer._id } });
                        setCustomerSearch(customer.name);
                        setShowCustomerDropdown(false);
                      }}
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Products</label>
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
                    className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors"
                  />
                  {showProductDropdown[index] && (
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
                    <label className="block text-xs font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={item.quantity}
                      onChange={(e) => handleQuotationChange(e, index)}
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors"
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
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors"
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
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors"
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
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors"
                      min="0"
                      max="100"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Sale Price (PKR)</label>
                    <input
                      type="number"
                      name="salePrice"
                      value={(item.salePrice || 0).toFixed(2)}
                      onChange={(e) => handleQuotationChange(e, index)}
                      className="p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 bg-white text-sm transition-colors"
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
                    className="p-2 text-red-600 hover:text-red-700 text-sm flex items-center"
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
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Product
          </button>
        </div>
        <div className="text-sm font-medium text-gray-700">
          Total: PKR {calculateQuotationTotal()}
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex-1 p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 text-sm font-medium transition-colors shadow-md"
          >
            Generate & Preview
          </button>
          <Link
            href="/dashboard"
            className="flex-1 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )}
export default QuotationForm;