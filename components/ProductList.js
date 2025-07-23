'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ProductList({ products: initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []); // Renamed to `items` for clarity
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchProducts();
    } else {
      router.push('/auth/signin');
    }
  }, [search, page, token, router]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
        params: { search, page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.items);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch items', {
        position: 'top-right',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/items/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Item deleted successfully!', { position: 'top-right' });
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete item', {
          position: 'top-right',
        });
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const calculateSalePrice = (retailPrice, discountPercentage) => {
    return (retailPrice - (retailPrice * discountPercentage) / 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by name, category, shelf, color, or color code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="p-3 border border-gray-300 rounded-md w-full md:w-1/3 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition"
        />
      </div>
      <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 text-left font-semibold">Name</th>
              <th className="p-3 text-left font-semibold">Quantity</th>
              <th className="p-3 text-left font-semibold">Retail Price (PKR)</th>
              <th className="p-3 text-left font-semibold">Discount (%)</th>
              <th className="p-3 text-left font-semibold">Sale Price (PKR)</th>
              <th className="p-3 text-left font-semibold">Color</th>
              <th className="p-3 text-left font-semibold">Color Code</th>
              <th className="p-3 text-left font-semibold">Category</th>
              <th className="p-3 text-left font-semibold">Stock</th>

              <th className="p-3 text-left font-semibold">Shelf</th>
              <th className="p-3 text-left font-semibold">Barcode</th>
              <th className="p-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="11" className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map((item) => (
                <tr
                  key={item._id}
                  className="border-b hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="p-3">{item.productId?.name || 'N/A'}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">PKR {item.productId?.retailPrice?.toFixed(2) || 'N/A'}</td>
                  <td className="p-3">{item.discountPercentage}%</td>
                  <td className="p-3">
                    PKR{' '}
                    {item.productId?.retailPrice
                      ? calculateSalePrice(item.productId.retailPrice, item.discountPercentage)
                      : 'N/A'}
                  </td>
                  <td className="p-3">{item.color || 'N/A'}</td>
                  <td className="p-3">{item.colorCode || 'N/A'}</td>
                  <td className="p-3">{item.category || 'N/A'}</td>
                    <td className="p-3">{item.maxStock || 'N/A'}</td>

                  <td className="p-3">{item.shelf || 'N/A'}</td>
                  <td className="p-3">{item.barcode || 'N/A'}</td>
                  <td className="p-3 flex space-x-2">
                    <button
                      onClick={() => router.push(`/products/${item._id}`)}
                      className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-800 transition-colors duration-200 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="p-4 text-center text-gray-500">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {products.length > 0 && (
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
  );
}