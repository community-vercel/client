'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Fuse from 'fuse.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

export default function EditItem() {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    barcode: '',
    shelf: '',
    minStock: 5,
    maxStock: 50,
    color: '',
    colorCode: '',
    category: '',
    discountPercentage: 0,
  });
  const [products, setProducts] = useState([]);
  const [uniqueProductNames, setUniqueProductNames] = useState([]);
  const [filteredProductNames, setFilteredProductNames] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [colors, setColors] = useState([]);
  const [filteredColors, setFilteredColors] = useState([]);
  const [colorSearch, setColorSearch] = useState('');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [retailPrice, setRetailPrice] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const productDropdownRef = useRef(null);
  const colorDropdownRef = useRef(null);
  const router = useRouter();
  const { id } = useParams();
  const token = localStorage.getItem('token');

  // Fetch products and colors
  useEffect(() => {
    if (!token) {
      router.push('/auth/signin');
    } else {
      fetchProducts();
      fetchColors();
    }
  }, [token, router]);

  // Fetch item after products are loaded
  useEffect(() => {
    if (products.length > 0 && token && id) {
      fetchItem();
    }
  }, [products, token, id]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedProducts = res.data.products;
      setProducts(fetchedProducts);
      const uniqueNames = [...new Set(fetchedProducts.map((p) => p.name))].map((name) => ({
        name,
      }));
      setUniqueProductNames(uniqueNames);
      setFilteredProductNames(uniqueNames);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch products', {
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchColors = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/colors/allcolors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setColors(res.data);
      setFilteredColors(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch colors', {
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItem = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const item = res.data;
      console.log('Fetched item:', item); // Debug log
      setFormData({
        productId: item.productId?._id || '',
        quantity: item.quantity?.toString() || '0',
        barcode: item.barcode || '',
        shelf: item.shelf || '',
        minStock: item.minStock || 5,
        maxStock: item.maxStock || 50,
        color: item.color || '',
        colorCode: item.colorCode || '',
        category: item.category || '',
        discountPercentage: item.discountPercentage?.toString() || '0',
      });
      setProductSearch(item.productId?.name || '');
      setColorSearch(item.color || '');
      setRetailPrice(item.productId?.retailPrice?.toFixed(2) || '');
      // Set available categories based on the product's name
      const productCategories = products
        .filter((p) => p.name === item.productId?.name)
        .map((p) => p.category);
      setAvailableCategories([...new Set(productCategories)]);
      console.log('Available categories:', productCategories);
    } catch (error) {
      console.error('Fetch item error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to fetch item', {
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Fuse.js for product name search
  useEffect(() => {
    const productFuse = new Fuse(uniqueProductNames, {
      keys: ['name'],
      threshold: 0.3,
    });
    if (productSearch) {
      const results = productFuse.search(productSearch);
      setFilteredProductNames(results.map((result) => result.item));
    } else {
      setFilteredProductNames(uniqueProductNames);
    }
  }, [productSearch, uniqueProductNames]);

  // Handle color search
  useEffect(() => {
    const colorFuse = new Fuse(colors, {
      keys: ['colorName', 'colorCode'],
      threshold: 0.3,
    });
    if (colorSearch) {
      const results = colorFuse.search(colorSearch);
      setFilteredColors(results.map((result) => result.item));
    } else {
      setFilteredColors(colors);
    }
  }, [colorSearch, colors]);

  // Update available categories and retail price (only when category changes)
  useEffect(() => {
    if (productSearch && formData.category) {
      const matchingProduct = products.find(
        (p) => p.name === productSearch && p.category === formData.category
      );
      console.log('Matching product:', matchingProduct); // Debug log
      if (matchingProduct) {
        setFormData((prev) => ({
          ...prev,
          productId: matchingProduct._id,
          discountPercentage: matchingProduct.discountPercentage.toString(),
        }));
        setRetailPrice(matchingProduct.retailPrice.toFixed(2));
      } else {
        // Only show error if the category was changed (not on initial load)
        if (formData.category !== '') {
        }
      }
    } else if (productSearch) {
      const productCategories = products
        .filter((p) => p.name === productSearch)
        .map((p) => p.category);
      setAvailableCategories([...new Set(productCategories)]);
      console.log('Available categories for', productSearch, ':', productCategories);
    }
  }, [productSearch, formData.category, products]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setShowColorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductChange = (productNameObj) => {
    setFormData({
      ...formData,
      productId: '',
      category: '',
      discountPercentage: '0',
    });
    setProductSearch(productNameObj.name);
    setRetailPrice('');
    setShowProductDropdown(false);
  };

  const handleColorChange = (color) => {
    setFormData({
      ...formData,
      color: color.colorName,
      colorCode: color.colorCode,
    });
    setColorSearch(color.colorName);
    setShowColorDropdown(false);
  };

  const calculateSalePrice = () => {
    const price = parseFloat(retailPrice);
    const discount = parseFloat(formData.discountPercentage) || 0;
    if (isNaN(price) || isNaN(discount)) return '';
    return (price - (price * discount) / 100).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { productId, quantity, barcode, shelf, minStock, maxStock, color, colorCode, category, discountPercentage } = formData;
    if (quantity < 0 || minStock < 0 || maxStock < 0) {
      toast.error('Quantity, min stock, and max stock cannot be negative', {
        position: 'top-right',
      });
      return;
    }
    
    if (minStock > maxStock) {
      toast.error('Min stock cannot be greater than max stock', {
        position: 'top-right',
      });
      return;
    }
    if (!productId || !category) {
      toast.error('Please select a product and category', { position: 'top-right' });
      return;
    }
    if (!color || !colorCode) {
      toast.error('Please select a color', { position: 'top-right' });
      return;
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      toast.error('Discount percentage must be between 0 and 100', { position: 'top-right' });
      return;
    }
    setIsLoading(true);
    try {
      const checkResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/check`, {
        params: { productId, category, excludeId: id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkResponse.data.exists) {
        toast.error('An item with this product and category already exists', {
          position: 'top-right',
        });
        setIsLoading(false);
        return;
      }

      const payload = {
        productId,
        quantity: Number(quantity),
        barcode: barcode || null,
        shelf: shelf || null,
        minStock: Number(minStock),
        maxStock: Number(maxStock),
        color,
        colorCode,
        category,
        discountPercentage: Number(discountPercentage),
      };
      console.log('Updating item:', payload);
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Item updated successfully!', { position: 'top-right' });
      router.push('/products');
    } catch (error) {
      console.error('Error in handleSubmit:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update item', {
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-22 px-0 flex">
      <div className="flex-1 flex flex-col">
     <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden text-white focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Inventory Management Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/products/add"
              className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              Add Items
            </Link>
            <Link
              href="/product"
              className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              Manage Product
            </Link>
            <Link
              href="/colors"
              className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              Manage Colors
            </Link>
          </div>
        </header>
        <main className="p-6 flex-1">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
            {isLoading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Edit Item</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product Name</label>
                      <input
                        type="text"
                        value={productSearch}
                        disabled
                        className="mt-1 p-3 border border-gray-300 rounded-md w-full bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={formData.category}
                        disabled
                        className="mt-1 p-3 border border-gray-300 rounded-md w-full bg-gray-100"
                      >
                        <option value={formData.category}>
                          {formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : 'Select a category'}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Color</label>
                      <div className="relative" ref={colorDropdownRef}>
                        <input
                          type="text"
                          value={colorSearch}
                          onChange={(e) => {
                            setColorSearch(e.target.value);
                            setShowColorDropdown(true);
                          }}
                          placeholder="Search colors..."
                          className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                        />
                        {showColorDropdown && (
                          <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredColors.map((color) => (
                              <li
                                key={color._id}
                                onClick={() => handleColorChange(color)}
                                className="p-3 hover:bg-gray-100 cursor-pointer flex items-center"
                              >
                                <span
                                  className="inline-block w-5 h-5 rounded-full mr-2"
                                  style={{ backgroundColor: color.colorCode }}
                                ></span>
                                {color.colorName} ({color.colorCode})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Retail Price (PKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={retailPrice}
                        disabled
                        className="mt-1 p-3 border border-gray-300 rounded-md w-full bg-gray-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Discount Percentage (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.discountPercentage}
                        disabled
                        className="mt-1 p-3 border border-gray-300 rounded-md w-full bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sale Price (PKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={calculateSalePrice()}
                        disabled
                        className="mt-1 p-3 border border-gray-300 rounded-md w-full bg-gray-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Shelf (Optional)</label>
                      <input
                        type="text"
                        placeholder="Shelf (e.g., A1)"
                        value={formData.shelf}
                        onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                        className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Stock</label>
                      <input
                        type="number"
                        placeholder="Min Stock"
                        value={formData.minStock}
                        onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                        className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                        required
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Stock</label>
                      <input
                        type="number"
                        placeholder="Max Stock"
                        value={formData.maxStock}
                        onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                        className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                        required
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`flex-1 bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading ? 'Updating...' : 'Update Item'}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/products')}
                      className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-400 transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}