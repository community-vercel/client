'use client';
import { X, Download, Share } from 'lucide-react';

const QuotationPdfPreview = ({
  isOpen,
  onClose,
  pdfUrl,
  pdfCustomer,
  calculateQuotationTotal,
  handleShareWhatsApp,
  products,
  quotationForm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">Quotation Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col space-y-4">
          <iframe src={pdfUrl} className="w-full h-[500px] border border-gray-300 rounded-lg" />
          <div className="flex space-x-2">
            <a
              href={pdfUrl}
              download
              className="flex-1 p-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </a>
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 p-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Share className="w-4 h-4 mr-2" />
              Share via WhatsApp
            </button>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700">Quotation Details</h3>
          <p className="text-sm text-gray-600">
            Customer: {pdfCustomer?.name} {pdfCustomer?.phone ? `(${pdfCustomer.phone})` : ''}
          </p>
          <p className="text-sm text-gray-600">Total: PKR {calculateQuotationTotal()}</p>
          <table className="w-full mt-2">
            <thead>
              <tr className="bg-indigo-50">
                <th className="p-2 text-left text-xs font-semibold text-indigo-700">Product</th>
                <th className="p-2 text-right text-xs font-semibold text-indigo-700">Quantity</th>
                <th className="p-2 text-right text-xs font-semibold text-indigo-700">Cost Price (PKR)</th>
                <th className="p-2 text-right text-xs font-semibold text-indigo-700">Retail Price (PKR)</th>
                <th className="p-2 text-right text-xs font-semibold text-indigo-700">Sale Price (PKR)</th>
                <th className="p-2 text-right text-xs font-semibold text-indigo-700">Total (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {quotationForm.products.map((item, index) => {
                const product = products.find((p) => p._id === item.productId);
                return (
                  <tr key={index} className="border-t">
                    <td className="p-2 text-sm text-gray-700">{product?.name || 'N/A'}</td>
                    <td className="p-2 text-right text-sm text-gray-700">{item.quantity}</td>
                    <td className="p-2 text-right text-sm text-gray-700">{item.costPrice.toFixed(2)}</td>
                    <td className="p-2 text-right text-sm text-gray-700">{item?.retailPrice.toFixed(2)}</td>
                    <td className="p-2 text-right text-sm text-gray-700">{item?.salePrice.toFixed(2)}</td>
                    <td className="p-2 text-right text-sm text-gray-700">{(item?.salePrice * item.quantity).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuotationPdfPreview;