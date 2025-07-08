'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductList from '../../components/ProductList';
import BarcodeScanner from '../../components/BarcodeScanner';


export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchProducts();
    } else {
      router.push('/auth/signin');
    }
  }, [router, token]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items`, {
        params: { page: 1, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.items);
    } catch (error) {
    }
  };

  const handleScan = async (barcode) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/items/scan/${barcode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
     
      fetchProducts();
    } catch (error) {
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
            <button
              onClick={() => setIsScanning(!isScanning)}
              className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-200"
            >
              {isScanning ? 'Stop Scanning' : 'Scan Barcode'}
            </button>
         
          </div>
        </header>
        <main className="p-6 flex-1">
          {isScanning && (
            <div className="mb-8 p-6 bg-white rounded-xl shadow-lg transform transition-all duration-300">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Scan Barcode</h2>
              <BarcodeScanner onScan={handleScan} />
            </div>
          )}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Inventory</h2>
              <button
                onClick={fetchProducts}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
              >
                Refresh
              </button>
            </div>
            <ProductList products={products} />
          </div>
        </main>
      </div>
     
    </div>
  );
}