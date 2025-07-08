'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Fuse from 'fuse.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../components/Sidebar';
import Link from 'next/link';

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [colors, setColors] = useState([]);
  const [filteredColors, setFilteredColors] = useState([]);
  const [colorSearch, setColorSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    colorId: '',
    category: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const colorDropdownRef = useRef(null);
  const router = useRouter();
  const token = localStorage.getItem('token');

  const categories = ['gallon', 'quarter', 'drums', 'liters'];

  // Initialize Fuse.js for color search
  const fuse = new Fuse(colors, {
    keys: ['colorName', 'code'],
    threshold: 0.3, // Adjust for fuzzy search sensitivity
  });

  // Handle color search
  useEffect(() => {
    if (colorSearch) {
      const results = fuse.search(colorSearch);
      setFilteredColors(results.map((result) => result.item));
    } else {
      setFilteredColors(colors);
    }
  }, [colorSearch, colors]);

  // Fetch products and colors
  useEffect(() => {
    if (!token) {
      router.push('/auth/signin');
    } else {
      fetchProducts();
      fetchColors();
    }
  }, [search, page, token, router]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
        params: { search, page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.products);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch products', {
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchColors = async () => {
    try {
      const res = await axios.get( `${process.env.NEXT_PUBLIC_API_URL}/colors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setColors(res.data.colors);
      setFilteredColors(res.data.colors);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch colors', {
        position: 'top-right',
      });
    }
  };

  // Handle clicks outside the color dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setShowColorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const { name, price, colorId, category } = formData;
  
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/product`,
        {
          name,
          price: Number(price),
          colorId,
          category,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Product added successfully!', { position: 'top-right' });
      setFormData({ name: '', price: '', colorId: '',  category: '' });
      setColorSearch('');
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product', {
        position: 'top-right',
      });
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    const { name, price, colorId,  category } = formData;
   
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/product/${editProduct._id}`,
        {
          name,
          price: Number(price),
          colorId,
          category,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Product updated successfully!', { position: 'top-right' });
      setIsEditModalOpen(false);
      setEditProduct(null);
      setColorSearch('');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product', {
        position: 'top-right',
      });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/product/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Product deleted successfully!', { position: 'top-right' });
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete product', {
          position: 'top-right',
        });
      }
    }
  };

  const openEditModal = (product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      colorId: product.colorId?._id || '',
      category: product.category,
    });
    setColorSearch(product.colorId?.colorName || '');
    setIsEditModalOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/signin');
  };

  const selectColor = (color) => {
    setFormData({ ...formData, colorId: color._id });
    setColorSearch(color.colorName);
    setShowColorDropdown(false);
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
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Product Catalog</h2>
              <button
                onClick={() => {
                  setFormData({ name: '', price: '', colorId: '', category: '' });
                  setColorSearch('');
                  setIsAddModalOpen(true);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300"
              >
                Add Product
              </button>
            </div>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by name or category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="p-3 border border-gray-300 rounded-md w-full md:w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="p-3 text-left font-semibold">Name</th>
                    <th className="p-3 text-left font-semibold">Price</th>
                    <th className="p-3 text-left font-semibold">Color</th>
                    <th className="p-3 text-left font-semibold">Color Code</th>
                    <th className="p-3 text-left font-semibold">Category</th>
                    <th className="p-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : products?.length > 0 ? (
                    products.map((product) => (
                      <tr
                        key={product._id}
                        className="border-b hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="p-3">{product.name}</td>
                        <td className="p-3">PKR {product.price.toFixed(2)}</td>
                        <td className="p-3">{product.colorId?.colorName || 'N/A'}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <span>{product.colorId?.code || 'N/A'}</span> 
                            </div>
                            {product.colorId?.code && (
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: product.colorId.code }}
                              ></div>
                            )}
                          </td>
                        <td className="p-3">{product.category}</td>
                        <td className="p-3 flex space-x-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-gray-500">
                        No products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {products?.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-gray-600">
                  Page {page} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-4 py-2 rounded-md ${
                        page === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } transition-colors duration-200`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Product</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (PKR)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                  min="0"
                />
              </div>
              <div ref={colorDropdownRef}>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="text"
                  placeholder="Search colors..."
                  value={colorSearch}
                  onChange={(e) => {
                    setColorSearch(e.target.value);
                    setShowColorDropdown(true);
                  }}
                  onFocus={() => setShowColorDropdown(true)}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                />
                {showColorDropdown && (
                  <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredColors.length > 0 ? (
                      filteredColors.map((color) => (
                        <div
                          key={color._id}
                          onClick={() => selectColor(color)}
                          className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: color.code }}
                          ></div>
                          <span>{color.colorName} ({color.code})</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-gray-500">No colors found</div>
                    )}
                  </div>
                )}
              </div>
            
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setColorSearch('');
                    setShowColorDropdown(false);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-400 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Product</h2>
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  placeholder="Product Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                  min="0"
                />
              </div>
              <div ref={colorDropdownRef}>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="text"
                  placeholder="Search colors..."
                  value={colorSearch}
                  onChange={(e) => {
                    setColorSearch(e.target.value);
                    setShowColorDropdown(true);
                  }}
                  onFocus={() => setShowColorDropdown(true)}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                />
                {showColorDropdown && (
                  <div className="absolute z-10 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredColors.length > 0 ? (
                      filteredColors.map((color) => (
                        <div
                          key={color._id}
                          onClick={() => selectColor(color)}
                          className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: color.code }}
                          ></div>
                          <span>{color.colorName} ({color.code})</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-gray-500">No colors found</div>
                    )}
                  </div>
                )}
              </div>
             
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Update Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setColorSearch('');
                    setShowColorDropdown(false);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-400 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}