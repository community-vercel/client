'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

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
        <main className="p-2 flex-1">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Color Catalog</h2>
              <button
                onClick={() => {
                  setFormData({ colorName: '', code: '', colorCode: '' });
                  setIsAddModalOpen(true);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200"
              >
                Add Color
              </button>
            </div>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by color name, code, or color code..."
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
                    <th className="p-3 text-left font-semibold">Color Name</th>
                    <th className="p-3 text-left font-semibold">Color Code</th>
                    <th className="p-3 text-left font-semibold">Hex Code</th>
                    <th className="p-3 text-left font-semibold">Preview</th>
                    <th className="p-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : colors.length > 0 ? (
                    colors.map((color) => (
                      <tr
                        key={color._id}
                        className="border-b hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="p-3">{color.colorName}</td>
                        <td className="p-3">{color.colorCode}</td>
                        <td className="p-3">{color.code}</td>
                        <td className="p-3">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: color.code }}
                          ></div>
                        </td>
                        <td className="p-3 flex space-x-2">
                          <button
                            onClick={() => openEditModal(color)}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(color._id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-200 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        No colors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {colors.length > 0 && (
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

      {/* Add Color Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Color</h2>
            <form onSubmit={handleAddColor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Color Name</label>
                <input
                  type="text"
                  placeholder="Color Name"
                  value={formData.colorName}
                  onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Color Code (e.g., RED01)</label>
                <input
                  type="text"
                  placeholder="RED01"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hex Code</label>
                <input
                  type="text"
                  placeholder="#FFFFFF"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  // required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Add Color
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-400 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Color Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Color</h2>
            <form onSubmit={handleEditColor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Color Name</label>
                <input
                  type="text"
                  placeholder="Color Name"
                  value={formData.colorName}
                  onChange={(e) => setFormData({ ...formData, colorName: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Color Code (e.g., RED01)</label>
                <input
                  type="text"
                  placeholder="RED01"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hex Code</label>
                <input
                  type="text"
                  placeholder="#FFFFFF"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="mt-1 p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Update Color
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-md hover:bg-gray-400 transition-colors duration-200 font-medium"
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