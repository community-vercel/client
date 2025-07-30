// 'use client';

// import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import Modal from '../../components/Modal';
// import TransactionTable from '../../components/TransactionTable';
// import { createReceipt, getReceipts, updateReceipt, deleteReceipt } from '../../lib/api';
// import { Image, X } from 'lucide-react';

// export default function Receipts() {
//   const [receipts, setReceipts] = useState([]);
//   const [userid, setUserid] = useState(null);
//   const [formData, setFormData] = useState({
//     amount: '',
//     description: '',
//     category: '',
//     type: '',
//     date: '',
//     receiptImage: null,
//     user: null,
//   });
//   const [imagePreview, setImagePreview] = useState(null);
//   const [filters, setFilters] = useState({ startDate: '', endDate: '', category: '' });
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingReceipt, setEditingReceipt] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   // Dropdown options
//  const categoryOptions = [
//   { value: '', label: 'Select Category' },
//   { value: 'Retail Sales', label: 'Retail Sales' },
//   { value: 'Wholesale Orders', label: 'Wholesale Orders' },
//   { value: 'Online Store Sales', label: 'Online Store Sales' },
//   { value: 'Repair Charges', label: 'Repair Charges' },
//   { value: 'Delivery Charges', label: 'Delivery Charges' },
//   { value: 'Packaging Fees', label: 'Packaging Fees' },
//   { value: 'Affiliate Commission', label: 'Affiliate Commission' },
//   { value: 'Gift Card Redemption', label: 'Gift Card Redemption' },
//   { value: 'Sponsored Listing', label: 'Sponsored Listing' },
//   { value: 'Custom Orders', label: 'Custom Orders' },
//   { value: 'Other', label: 'Other' },
// ];

//   const paymentTypeOptions = [
//     { value: '', label: 'Select Payment Type' },
//     { value: 'Cash', label: 'Cash' },
//     { value: 'Credit Card', label: 'Credit Card' },
//     { value: 'Debit Card', label: 'Debit Card' },
//     { value: 'Online Transfer', label: 'Online Transfer' },
//   ];

//   useEffect(() => {
//     const id = localStorage.getItem('userid');
//     if (id) {
//       setUserid(id);
//     }
//   }, []);

//   useEffect(() => {
//     if (userid) {
//       setFormData((prev) => ({
//         ...prev,
//         user: userid,
//       }));
//     }
//   }, [userid]);

//   useEffect(() => {
//     const fetchReceipts = async () => {
//       setLoading(true);
//       setError('');
//       try {
//         const res = await getReceipts({ ...filters, user: userid });
//         setReceipts(res.data);
//       } catch (error) {
//         setError('Failed to fetch receipts. Please try again.');
//         console.error('Error fetching receipts:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (userid) {
//       fetchReceipts();
//     }
//   }, [filters, userid]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     try {
//       const data = new FormData();
//       Object.keys(formData).forEach((key) => {
//         if (formData[key]) data.append(key, formData[key]);
//       });
//       if (editingReceipt) {
//         // data.append('user', userid);
//         await updateReceipt(editingReceipt._id, data);
//       } else {
//         await createReceipt(data);
//       }
//       setFormData({
//         amount: '',
//         description: '',
//         category: '',
//         type: '',
//         date: '',
//         receiptImage: null,
//         user: userid,
//       });
//       setImagePreview(null);
//       setIsModalOpen(false);
//       setEditingReceipt(null);
//       const res = await getReceipts({ ...filters, user: userid });
//       setReceipts(res.data);
//     } catch (error) {
//       setError(error.response?.data?.error || 'Error submitting receipt');
//       console.error('Error submitting receipt:', error);
//     }
//   };

//   const handleEdit = (receipt) => {
//     setEditingReceipt(receipt);
//     setFormData({
//       amount: receipt.amount,
//       description: receipt.description,
//       category: receipt.category || '',
//       type: receipt.type || '',
//       date: receipt.date.split('T')[0],
//       receiptImage: null,
//       user: userid,
//     });
//     setImagePreview(receipt.receiptImageUrl || null);
//     setIsModalOpen(true);
//   };

//   const handleDelete = async (id) => {
//     try {
//       await deleteReceipt(id, userid);
//       const res = await getReceipts({ ...filters, user: userid });
//       setReceipts(res.data);
//     } catch (error) {
//       setError('Error deleting receipt');
//       console.error('Error deleting receipt:', error);
//     }
//   };

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     setFormData({ ...formData, receiptImage: file });
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => setImagePreview(reader.result);
//       reader.readAsDataURL(file);
//     } else {
//       setImagePreview(null);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="max-w-7xl mx-auto"
//       >
//         <h1 className="text-4xl font-extrabold text-white text-center mb-8">Receipts</h1>

//         {/* Error Message */}
//         {error && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="bg-red-900 bg-opacity-50 text-red-200 p-4 rounded-lg mb-6 text-center"
//           >
//             {error}
//           </motion.div>
//         )}

//         {/* Filters and Add Button */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.2 }}
//           className="flex flex-col sm:flex-row justify-between items-center mb-8 bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
//         >
//           <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
//             <input
//               type="date"
//               value={filters.startDate}
//               onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
//               className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             />
//             <input
//               type="date"
//               value={filters.endDate}
//               onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
//               className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             />
//             <select
//               value={filters.category}
//               onChange={(e) => setFilters({ ...filters, category: e.target.value })}
//               className="p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             >
//               {categoryOptions.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <button
//             onClick={() => setIsModalOpen(true)}
//             className="mt-4 sm:mt-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
//           >
//             Add Receipt
//           </button>
//         </motion.div>

//         {/* Loading State */}
//         {loading && (
//           <div className="text-center py-10">
//             <svg
//               className="animate-spin h-8 w-8 text-indigo-400 mx-auto"
//               xmlns="http://www.w3.org/2000/svg"
//               fill="none"
//               viewBox="0 0 24 24"
//             >
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//               ></circle>
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
//               ></path>
//             </svg>
//             <p className="text-white mt-2">Loading...</p>
//           </div>
//         )}

//         {/* Transaction Table */}
//         {!loading && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ delay: 0.3 }}
//             className="bg-gray-800 bg-opacity-50 backdrop-blur-lg p-6 rounded-xl shadow-lg"
//           >
//             <h3 className="text-lg font-semibold text-white mb-4">Recent Receipts</h3>
//             <TransactionTable
//               transactions={receipts}
//               onEdit={handleEdit}
//               onDelete={(id) => handleDelete(id)}
//             />
//           </motion.div>
//         )}

//         {/* Modal */}
//         <Modal
//           isOpen={isModalOpen}
//           onClose={() => {
//             setIsModalOpen(false);
//             setEditingReceipt(null);
//             setFormData({
//               amount: '',
//               description: '',
//               category: '',
//               type: '',
//               date: '',
//               receiptImage: null,
//               user: userid,
//             });
//             setImagePreview(null);
//             setError('');
//           }}
//           title={editingReceipt ? 'Edit Receipt' : 'Add Receipt'}
//         >
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {error && (
//               <p className="text-red-400 text-center bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>
//             )}
//             <input
//               type="number"
//               placeholder="Amount"
//               value={formData.amount}
//               onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
//               className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               required
//             />
//             <input
//               type="text"
//               placeholder="Description"
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               required
//             />
//             <select
//               value={formData.category}
//               onChange={(e) => setFormData({ ...formData, category: e.target.value })}
//               className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               required
//             >
//               {categoryOptions.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//             <select
//               value={formData.type}
//               onChange={(e) => setFormData({ ...formData, type: e.target.value })}
//               className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               required
//             >
//               {paymentTypeOptions.map((option) => (
//                 <option key={option.value} value={option.value}>
//                   {option.label}
//                 </option>
//               ))}
//             </select>
//             <input
//               type="date"
//               value={formData.date}
//               onChange={(e) => setFormData({ ...formData, date: e.target.value })}
//               className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             />
//             <div className="relative">
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={handleImageChange}
//                 className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:hover:bg-indigo-700"
//               />
//               {imagePreview && (
//                 <div className="mt-4 relative">
//                   <img
//                     src={imagePreview}
//                     alt="Receipt preview"
//                     className="w-full h-32 object-cover rounded-lg"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setFormData({ ...formData, receiptImage: null });
//                       setImagePreview(null);
//                     }}
//                     className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
//                     aria-label="Remove image"
//                   >
//                     <X size={16} />
//                   </button>
//                 </div>
//               )}
//             </div>
//             <button
//               type="submit"
//               className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition"
//             >
//               {editingReceipt ? 'Update' : 'Add'}
//             </button>
//           </form>
//         </Modal>
//       </motion.div>
//     </div>
//   );
// }