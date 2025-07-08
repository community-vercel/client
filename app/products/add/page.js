'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Fuse from 'fuse.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';

export default function AddItem() {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    barcode: '',
    shelf: '',
    minStock: 5,
    maxStock: 50,
  });
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef(null);
  const router = useRouter();
  const token = localStorage.getItem('token');

  const categories = ['gallon', 'quarter', 'drums', 'liters'];

  // Initialize Fuse.js for product search
  const fuse = new Fuse(products, {
    keys: ['name'],
    threshold: 0.3, // Adjust for fuzzy search sensitivity
  });

  // Handle product search
  useEffect(() => {
    if (productSearch) {
      const results = fuse.search(productSearch);
      setFilteredProducts(results.map((result) => result.item));
    } else {
      setFilteredProducts(products);
    }
  }, [productSearch, products]);

  // Fetch products
  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    } else {
      fetchProducts();
    }
  }, [token, router]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("prodyce",res.data)
      setProducts(res.data.products);
      setFilteredProducts(res.data.products);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch products', {
        position: 'top-right',
      });
    }
  };

  // Handle clicks outside the product dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductChange = (product) => {
    setFormData({
      ...formData,
      productId: product._id,
      // quantity: product.quantity.toString(),
      category: product.category,
    });
    setProductSearch(product.name);
    setShowProductDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { productId, quantity, barcode, shelf, minStock, maxStock } = formData;
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
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/items`,
        {
          productId,
          quantity: Number(quantity),
          barcode,
          shelf,
          minStock: Number(minStock),
          maxStock: Number(maxStock),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Item added successfully!', { position: 'top-right' });
      router.push('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item', {
        position: 'top-right',
      });
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add New Item</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div ref={productDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                    required
                  />
                  {showProductDropdown && (
                    <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts?.length > 0 ? (
                        filteredProducts?.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => handleProductChange(product)}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                          >
                            {product.name}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500">No products found</div>
                      )}
                    </div>
                  )}
                </div>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={
                      formData.productId
                        ? products.find((p) => p._id === formData.productId)?.price.toFixed(2) || ''
                        : ''
                    }
                    disabled
                    className="mt-1 p-3 border border-gray-300 rounded-md w-full bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <div className="flex items-center mt-1">
                    <input
                      type="text"
                      placeholder="Color"
                      value={
                        formData.productId
                          ? products.find((p) => p._id === formData.productId)?.colorId?.colorName || ''
                          : ''
                      }
                      disabled
                      className="p-3 border border-gray-300 rounded-md w-full bg-gray-100"
                    />
                    {formData.productId && products.find((p) => p._id === formData.productId)?.colorId?.code && (
                      <div
                        className="w-4 h-4 rounded-full ml-2"
                        style={{
                          backgroundColor: products.find((p) => p._id === formData.productId)?.colorId?.code,
                        }}
                      ></div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Color Code</label>
                  <input
                    type="text"
                    placeholder="Color Code"
                    value={
                      formData.productId
                        ? products.find((p) => p._id === formData.productId)?.colorId?.code || ''
                        : ''
                    }
                    disabled
                    className="mt-1 p-3 border border-gray-300 rounded-md w-full bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    placeholder="Category"
                    value={
                      formData.productId
                        ? products.find((p) => p._id === formData.productId)?.category || ''
                        : ''
                    }
                    disabled
                    className="mt-1 p-3 border border-gray-300 rounded-md w-full bg-gray-100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="flex-1 bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Add Item
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/product')}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-400 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}