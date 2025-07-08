'use client';
import BarcodeScanner from '../../components/BarcodeScanner';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function Scan() {
  const { data: session } = useSession();

  const handleScan = async (barcode) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/items/scan/${barcode}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      alert(`Item found: ${res.data.name}, Quantity: ${res.data.quantity}, Shelf: ${res.data.shelf || 'N/A'}`);
    } catch (error) {
      alert('Item not found');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Scan Barcode</h1>
      <BarcodeScanner onScan={handleScan} />
    </div>
  );
}