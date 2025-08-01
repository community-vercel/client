'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Fuse from 'fuse.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { Package, BarChart3, Palette, Plus, Menu, X } from 'lucide-react';

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
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const colorDropdownRef = useRef(null);
  const router = useRouter();
  const { id } = useParams();
  const token = localStorage.getItem('token');

  // Fetch products, colors, and item
  useEffect(() => {
    if (!token) {
      router.push('/auth/signin');
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, colorsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/colors/allcolors`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const fetchedProducts = productsRes.data.products || [];
        if (!Array.isArray(fetchedProducts)) throw new Error('Invalid product data format');
        setProducts(fetchedProducts);
        setUniqueProductNames([...new Set(fetchedProducts.map((p) => p.name))].map((name) => ({ name })));
        setFilteredProductNames([...new Set(fetchedProducts.map((p) => p.name))].map((name) => ({ name })));
        setColors(colorsRes.data);
        setFilteredColors(colorsRes.data);

        // Fetch item after products are loaded
        if (id) {
          const itemRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const item = itemRes.data;
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
          setAvailableCategories([
            ...new Set(fetchedProducts.filter((p) => p.name === item.productId?.name).map((p) => p.category)),
          ]);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token, router, id]);

  // Color search with Fuse.js
  useEffect(() => {
    const colorFuse = new Fuse(colors, { keys: ['colorName', 'colorCode'], threshold: 0.3 });
    setFilteredColors(colorSearch ? colorFuse.search(colorSearch).map((result) => result.item) : colors);
  }, [colorSearch, colors]);

  // Handle clicks outside color dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setShowColorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorChange = (color) => {
    setFormData((prev) => ({ ...prev, color: color.colorName, colorCode: color.colorCode }));
    setColorSearch(color.colorName);
    setShowColorDropdown(false);
  };

  const calculateSalePrice = () => {
    const price = parseFloat(retailPrice);
    const discount = parseFloat(formData.discountPercentage) || 0;
    return isNaN(price) || isNaN(discount) ? '' : (price - (price * discount) / 100).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { productId, quantity, barcode, shelf, minStock, maxStock, color, colorCode, category, discountPercentage } = formData;
    if (quantity < 0 || minStock < 0 || maxStock < 0) {
      toast.error('Quantity, min stock, and max stock cannot be negative');
      return;
    }
    if (minStock > maxStock) {
      toast.error('Min stock cannot be greater than max stock');
      return;
    }
    if (!productId || !category || !color || !colorCode) {
      toast.error('Please complete all required fields');
      return;
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      toast.error('Discount percentage must be between 0 and 100');
      return;
    }
    setIsLoading(true);
    try {
      const checkResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/check`, {
        params: { productId, category, excludeId: id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkResponse.data.exists) {
        toast.error('An item with this product and category already exists');
        return;
      }
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/items/${id}`,
        {
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
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Item updated successfully!');
      router.push('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/signin');
  };

  const quickActions = [
    { title: 'Manage Items', href: '/products', icon: <Package className="w-4 h-4" />, color: 'bg-emerald-500' },
    { title: 'Manage Quantity', href: '/products/items', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-blue-500' },
    { title: 'Manage Product', href: '/product', icon: <Plus className="w-4 h-4" />, color: 'bg-purple-500' },
    { title: 'Manage Colors', href: '/colors', icon: <Palette className="w-4 h-4" />, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-0 py-22">
      <ToastContainer theme="colored" position="top-right" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl p-6 mb-6">
               <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-4">
                   <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                     <Package className="w-8 h-8 text-white" />
                   </div>
                   <div>
                     <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                       Inventory Dashboard
                     </h1>
                     <p className="text-slate-600 font-medium">Manage your stock efficiently</p>
                   </div>
                 </div>
                 <button
                   onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                   className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                   aria-label="Toggle sidebar"
                 >
                   {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                 </button>
               </div>
             </header>
   
         {/* Sidebar (Quick Actions) */}
         {isSidebarOpen && (
           <div className="mb-6 bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl p-6 transform transition-all duration-300 ease-out">
             <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
               <div className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
               Quick Actions
             </h2>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {quickActions.map((action, index) => (
                 <Link
                   key={index}
                   href={action.href}
                   className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                 >
                   <div className={`${action.color} p-6 text-white`}>
                     <div className="flex items-center justify-between mb-3">
                       {action.icon}
                       <div className="opacity-20 text-2xl">→</div>
                     </div>
                     <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                     <p className="text-sm opacity-90">{action.description}</p>
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 </Link>
               ))}
             </div>
           </div>
         )}

      {/* Main Form */}
      <main className="mt-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Item</h2>
          {isLoading ? (
            <div className="text-center text-gray-500 text-sm">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    value={productSearch}
                    disabled
                    className="mt-1 p-2 border border-gray-300 rounded w-full bg-gray-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    disabled
                    className="mt-1 p-2 border border-gray-300 rounded w-full bg-gray-100 text-sm"
                  >
                    <option value={formData.category}>
                      {formData.category ? formData.category.charAt(0).toUpperCase() + formData.category.slice(1) : 'Select a category'}
                    </option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div ref={colorDropdownRef}>
                  <label className="block text-xs font-medium text-gray-700">Color</label>
                  <input
                    type="text"
                    value={colorSearch}
                    onChange={(e) => {
                      setColorSearch(e.target.value);
                      setShowColorDropdown(true);
                    }}
                    placeholder="Search colors..."
                    className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {showColorDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                      {filteredColors.length > 0 ? (
                        filteredColors.map((color) => (
                          <div
                            key={color._id}
                            onClick={() => handleColorChange(color)}
                            className="flex items-center p-2 hover:bg-gray-100 cursor-pointer text-sm"
                          >
                            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color.colorCode }} />
                            <span>{color.colorName} ({color.colorCode})</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500 text-sm">No colors found</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Retail Price (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={retailPrice}
                    disabled
                    className="mt-1 p-2 border border-gray-300 rounded w-full bg-gray-100 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Discount Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountPercentage}
                    disabled
                    className="mt-1 p-2 border border-gray-300 rounded w-full bg-gray-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Sale Price (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={calculateSalePrice()}
                    disabled
                    className="mt-1 p-2 border border-gray-300 rounded w-full bg-gray-100 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Shelf (Optional)</label>
                  <input
                    type="text"
                    value={formData.shelf}
                    onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                    className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Min Stock</label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Max Stock</label>
                  <input
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                    className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`flex-1 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Updating...' : 'Update Item'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/products')}
                  className="flex-1 p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}