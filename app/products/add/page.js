'use client';
import { useState, useEffect, useRef,useMemo} from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Fuse from 'fuse.js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { Package, Scan, BarChart3, Palette, Settings, Menu, X, Plus } from 'lucide-react';

export default function AddItem() {
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
  const [isLoading, setIsLoading] = useState(false);
  const productDropdownRef = useRef(null);
  const colorDropdownRef = useRef(null);
  const router = useRouter();
  const token = localStorage.getItem('token');

  // Fetch products and colors
  useEffect(() => {
    if (!token) {
      router.push('/auth/signin');
      return;
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, colorsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product/itemssearch`, {
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
      } catch (error) {
        toast.error(error.message || 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token, router]);

  // Product search with Fuse.js
  useEffect(() => {
    const fuse = new Fuse(uniqueProductNames, { keys: ['name'], threshold: 0.3 });
    setFilteredProductNames(productSearch ? fuse.search(productSearch).map((result) => result.item) : uniqueProductNames);
  }, [productSearch, uniqueProductNames]);

  // Color search with Fuse.js
  useEffect(() => {
    const colorFuse = new Fuse(colors, { keys: ['colorName', 'colorCode'], threshold: 0.3 });
    setFilteredColors(colorSearch ? colorFuse.search(colorSearch).map((result) => result.item) : colors);
  }, [colorSearch, colors]);

  // Update product selection and categories
  useEffect(() => {
    if (productSearch) {
      const productCategories = products.filter((p) => p.name === productSearch).map((p) => p.category);
      setAvailableCategories([...new Set(productCategories)]);
      if (formData.category) {
        const matchingProduct = products.find((p) => p.name === productSearch && p.category === formData.category);
        if (matchingProduct) {
          setFormData((prev) => ({
            ...prev,
            productId: matchingProduct._id,
            discountPercentage: matchingProduct.discountPercentage.toString(),
          }));
          setRetailPrice(matchingProduct.retailPrice.toFixed(2));
        } else {
          setFormData((prev) => ({ ...prev, productId: '', discountPercentage: '0' }));
          setRetailPrice('');
          toast.error('No product found for this name and category');
        }
      }
    } else {
      setAvailableCategories([]);
      setRetailPrice('');
      setFormData((prev) => ({ ...prev, productId: '', category: '', discountPercentage: '0' }));
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
    setProductSearch(productNameObj.name);
    setFormData((prev) => ({ ...prev, productId: '', category: '', discountPercentage: '0' }));
    setRetailPrice('');
    setShowProductDropdown(false);
  };

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
        params: { productId, category },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (checkResponse.data.exists) {
        toast.error('An item with this product and category already exists');
        return;
      }
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/items`,
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
      toast.success('Item added successfully!');
      router.push('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth/signin');
  };

const quickActions = useMemo(() => [
  { title: 'Manage Items', href: '/products', icon: <Package className="w-5 h-5" />, color: 'bg-gradient-to-r from-emerald-500 to-emerald-600', description: 'View and edit products' },
  { title: 'Manage Quantity', href: '/products/items', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-gradient-to-r from-blue-500 to-blue-600', description: 'Update stock levels' },
  { title: 'Manage Product', href: '/product', icon: <Plus className="w-5 h-5" />, color: 'bg-gradient-to-r from-purple-500 to-purple-600', description: 'Add new products' },
  { title: 'Manage Colors', href: '/colors', icon: <Palette className="w-5 h-5" />, color: 'bg-gradient-to-r from-orange-500 to-orange-600', description: 'Color management' },
], []);


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
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Item</h2>
          {isLoading ? (
            <div className="text-center text-gray-500 text-sm">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div ref={productDropdownRef}>
                  <label className="block text-xs font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                  />
                  {showProductDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                      {filteredProductNames.length > 0 ? (
                        filteredProductNames.map((productNameObj) => (
                          <div
                            key={productNameObj.name}
                            onClick={() => handleProductChange(productNameObj)}
                            className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                          >
                            {productNameObj.name}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500 text-sm">No products found</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const category = e.target.value;
                      const selectedProduct = products.find(
                        (p) => p.name === productSearch && p.category === category
                      );
                      setFormData({
                        ...formData,
                        category,
                        productId: selectedProduct ? selectedProduct._id : '',
                        discountPercentage: selectedProduct ? selectedProduct.discountPercentage.toString() : '0',
                      });
                      if (!selectedProduct) setRetailPrice('');
                    }}
                    className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
                  >
                    <option value="">Select a category</option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div ref={colorDropdownRef}>
                  <label className="block text-xs font-medium text-gray-700">Color</label>
                  <input
                    type="text"
                    placeholder="Search colors..."
                    value={colorSearch}
                    onChange={(e) => {
                      setColorSearch(e.target.value);
                      setShowColorDropdown(true);
                    }}
                    onFocus={() => setShowColorDropdown(true)}
                    className="mt-1 p-2 border border-gray-300 rounded w-full focus:ring-2 focus:ring-indigo-500 text-sm"
                    required
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
                  disabled={isLoading || !formData.productId || !formData.category}
                  className={`flex-1 p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm ${
                    isLoading || !formData.productId || !formData.category ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Adding...' : 'Add Item'}
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