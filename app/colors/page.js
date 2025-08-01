'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
    import { Package, BarChart3, Palette, Plus, Menu, X } from 'lucide-react';

export default function ManageColors() {
  const [colors, setColors] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(100);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editColor, setEditColor] = useState(null);
  const [formData, setFormData] = useState({
    colorName: '',
    code: '',
    colorCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      router.push('/auth/signin');
    } else {
      fetchColors();
    }
  }, [search, page, token, router]);

  const fetchColors = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/colors`, {
        params: { search, page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });
      setColors(res.data.colors);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (error) {
      console.error('Error fetching colors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddColor = async (e) => {
    e.preventDefault();
    const { colorName, code, colorCode } = formData;
    if (code && !/^#[0-9A-Fa-f]{6}$/.test(code)) {
      alert('Invalid hex code format');
      return;
    }
    if (!/^[A-Z0-9]{3,10}$/.test(colorCode)) {
      alert('Color code must be alphanumeric and 3-10 characters');
      return;
    }
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/colors`,
        { colorName, code, colorCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormData({ colorName: '', code: '', colorCode: '' });
      setIsAddModalOpen(false);
      fetchColors();
    } catch (error) {
      console.error('Error adding color:', error);
      alert(error.response?.data?.message || 'Failed to add color');
    }
  };

  const handleEditColor = async (e) => {
    e.preventDefault();
    const { colorName, code, colorCode } = formData;
    if (!/^#[0-9A-Fa-f]{6}$/.test(code)) {
      alert('Invalid hex code format');
      return;
    }
    if (!/^[A-Z0-9]{3,10}$/.test(colorCode)) {
      alert('Color code must be alphanumeric and 3-10 characters');
      return;
    }
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/colors/${editColor._id}`,
        { colorName, code, colorCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditModalOpen(false);
      setEditColor(null);
      fetchColors();
    } catch (error) {
      console.error('Error updating color:', error);
      alert(error.response?.data?.message || 'Failed to update color');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this color?')) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/colors/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchColors();
      } catch (error) {
        console.error('Error deleting color:', error);
        alert(error.response?.data?.message || 'Failed to delete color');
      }
    }
  };

  const openEditModal = (color) => {
    setEditColor(color);
    setFormData({
      colorName: color.colorName,
      code: color.code,
      colorCode: color.colorCode,
    });
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
  
  const quickActions = [
    { title: 'Manage Items', href: '/products', icon: <Package className="w-4 h-4" />, color: 'bg-emerald-500' },
    { title: 'Manage Quantity', href: '/products/items', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-blue-500' },
    { title: 'Manage Product', href: '/product', icon: <Plus className="w-4 h-4" />, color: 'bg-purple-500' },
    { title: 'Manage Colors', href: '/colors', icon: <Palette className="w-4 h-4" />, color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-22">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-b-lg shadow-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-indigo-200" />
            <div>
              <h1 className="text-xl font-bold">Inventory Dashboard</h1>
              <p className="text-sm text-indigo-200">Manage your product catalog</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-full hover:bg-indigo-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar (Quick Actions) */}
      {isSidebarOpen && (
        <div className="mt-4 mx-4 bg-white rounded-lg shadow-lg p-4 animate-slide-in">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`flex items-center space-x-2 p-3 rounded-lg ${action.color} text-white hover:opacity-90 text-sm font-medium transition-colors`}
              >
                {action.icon}
                <span>{action.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Color Palette Manager
                </h2>
                <p className="text-gray-600 text-lg">Organize and manage your brand's color system with precision</p>
              </div>
              <button
                onClick={() => {
                  setFormData({ colorName: '', code: '', colorCode: '' });
                  setIsAddModalOpen(true);
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add New Color</span>
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search colors by name, code, or hex value..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-12 pr-6 py-4 border-0 rounded-xl w-full bg-gray-50/50 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-lg"
              />
            </div>
          </div>

          {/* Color Grid */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Loading colors...</p>
              </div>
            ) : colors.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-6">
                  {colors.map((color) => (
                    <div
                      key={color._id}
                      className="group bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                      {/* Color Preview Header */}
                      <div 
                        className="h-24 relative"
                        style={{ backgroundColor: color.code || '#f3f4f6' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(color)}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all duration-200 text-indigo-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(color._id)}
                              className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all duration-200 text-red-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Color Info */}
                      <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">{color.colorName}</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Code:</span>
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{color.colorCode}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Hex:</span>
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{color.code || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-600 font-medium">
                        Page {page} of {totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                          </svg>
                          <span>Previous</span>
                        </button>
                        
                        <div className="flex space-x-1">
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const pageNum = i + 1;
                            return (
                              <button
                                key={i}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                                  page === pageNum
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === totalPages}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                        >
                          <span>Next</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No colors found</h3>
                <p className="text-gray-500 mb-6">Start building your color palette by adding your first color</p>
                <button
                  onClick={() => {
                    setFormData({ colorName: '', code: '', colorCode: '' });
                    setIsAddModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                >
                  Add Your First Color
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Enhanced Add Color Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Add New Color</h2>
              <p className="text-gray-600 mt-1">Create a new color entry for your palette</p>
            </div>
            <form onSubmit={handleAddColor} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color Name</label>
                <input
                  type="text"
                  placeholder="e.g., Ocean Blue"
                  value={formData.colorName}
                  onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color Code</label>
                <input
                  type="text"
                  placeholder="e.g., BLUE01"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hex Code</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="#3B82F6"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-4 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-mono"
                  />
                  <div 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: formData.code || '#f3f4f6' }}
                  ></div>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-semibold"
                >
                  Add Color
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 p-4 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Edit Color Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Edit Color</h2>
              <p className="text-gray-600 mt-1">Update your color information</p>
            </div>
            <form onSubmit={handleEditColor} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color Name</label>
                <input
                  type="text"
                  placeholder="e.g., Ocean Blue"
                  value={formData.colorName}
                  onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color Code</label>
                <input
                  type="text"
                  placeholder="e.g., BLUE01"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hex Code</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="#3B82F6"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full p-4 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-mono"
                  />
                  <div 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: formData.code || '#f3f4f6' }}
                  ></div>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-semibold"
                >
                  Update Color
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 p-4 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}