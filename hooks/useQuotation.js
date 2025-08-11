'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Fuse from 'fuse.js';

export const useQuotation = () => {
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [quotationForm, setQuotationForm] = useState({
    customerId: '',
    shopId: localStorage.getItem('role') === 'superadmin' ? 'all' : localStorage.getItem('shopId') || '',
    products: [{ productId: '', quantity: 1, costPrice: 0, retailPrice: 0, discountPercentage: 0, salePrice: 0 }],
  });
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfCustomer, setPdfCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState({});

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
useEffect(() => {
  if (!isQuotationModalOpen) {
    setQuotationForm({
      customerId: '',
      shopId: localStorage.getItem('role') === 'superadmin' ? 'all' : localStorage.getItem('shopId') || '',
      products: [
        {
          productId: '',
          quantity: 1,
          costPrice: 0,
          retailPrice: 0,
          discountPercentage: 0,
          salePrice: 0,
        },
      ],
    });
  }
}, [isQuotationModalOpen]);

  // Fuse.js instances
  const customerFuse = new Fuse(customers, {
    keys: ['name', 'phone'],
    threshold: 0.3,
  });
  const productFuse = new Fuse(products, {
    keys: ['name', 'category'],
    threshold: 0.3,
  });

  // Fetch customers, products, and shops
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [customersRes, productsRes, shopsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
            params: { shopId: quotationForm.shopId },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/product`, {
            params: { page: 1, limit: 100 },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/shops`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setCustomers(customersRes.data || []);
        setProducts(productsRes.data.products || []);
        setShops(shopsRes.data || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch data');
      }
    };
    fetchData();
  }, [token, quotationForm.shopId]);

  // Handle form changes
  const handleQuotationChange = (e, index) => {
    const { name, value } = e.target;
    if (
      name === 'productId' ||
      name === 'quantity' ||
      name === 'costPrice' ||
      name === 'retailPrice' ||
      name === 'discountPercentage' ||
      name === 'salePrice'
    ) {
      const updatedProducts = [...quotationForm.products];
      if (name === 'productId') {
        const product = products.find((p) => p._id === value);
        updatedProducts[index] = {
          ...updatedProducts[index],
          productId: value,
          costPrice: product ? product.costPrice || 0 : 0,
          retailPrice: product ? product.retailPrice || 0 : 0,
          discountPercentage: product ? product.discountPercentage || 0 : 0,
          salePrice: product ? product.retailPrice * (1 - (product.discountPercentage || 0) / 100) : 0, // Keep as number
        };
      } else {
        updatedProducts[index][name] = name === 'productId' ? value : Number(value);
        if (name === 'retailPrice' || name === 'discountPercentage') {
          const retailPrice = name === 'retailPrice' ? Number(value) : updatedProducts[index].retailPrice || 0;
          const discount = name === 'discountPercentage' ? Number(value) : updatedProducts[index].discountPercentage || 0;
          updatedProducts[index].salePrice = retailPrice * (1 - discount / 100); // Keep as number
        }
      }
      setQuotationForm({ ...quotationForm, products: updatedProducts });
    } else {
      setQuotationForm({ ...quotationForm, [name]: value });
    }
  };

  const addProductRow = () => {
    setQuotationForm({
      ...quotationForm,
      products: [
        ...quotationForm.products,
        { productId: '', quantity: 1, costPrice: 0, retailPrice: 0, discountPercentage: 0, salePrice: 0 },
      ],
    });
    setProductSearch((prev) => ({ ...prev, [quotationForm.products.length]: '' }));
  };

  const removeProductRow = (index) => {
    if (quotationForm.products.length > 1) {
      const updatedProducts = quotationForm.products.filter((_, i) => i !== index);
      setQuotationForm({ ...quotationForm, products: updatedProducts });
      setProductSearch((prev) => {
        const newSearch = { ...prev };
        delete newSearch[index];
        return Object.keys(newSearch)
          .sort((a, b) => Number(a) - Number(b))
          .reduce((acc, key, i) => ({ ...acc, [i]: newSearch[key] }), {});
      });
    }
  };

  const calculateQuotationTotal = () => {
    return quotationForm.products
      .reduce((total, item) => {
        return total + (item.salePrice || 0) * (item.quantity || 0);
      }, 0)
      .toFixed(2);
  };

  const handleSubmitQuotation = async (e) => {
    e.preventDefault();
    if (!quotationForm.customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (
      quotationForm.products.some(
        (p) => !p.productId || p.quantity <= 0 || p.costPrice < 0 || p.retailPrice < 0 || p.salePrice < 0
      )
    ) {
      toast.error('Please provide valid products and prices');
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/quotation/generate`,
        quotationForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { url, customer } = response.data;
      setPdfUrl(url);
      setPdfCustomer(customer);
      setIsPdfModalOpen(true);
      toast.success('Quotation generated successfully!');
      setIsQuotationModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate quotation');
    }
  };

  const handleShareWhatsApp = () => {
 
    // Clean the phone number - remove spaces, dashes, and ensure proper format
    let cleanPhone = '03335093223';
    
    // Handle Pakistani phone numbers
    if (cleanPhone.startsWith('0')) {
      // Convert 03xx format to +923xx format
      cleanPhone = '92' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('92')) {
      // Add country code if missing
      cleanPhone = '92' + cleanPhone;
    }
    
    const message = `Dear ${pdfCustomer.name},\n\nPlease find your quotation attached: ${pdfUrl}\n\nTotal Amount: PKR ${calculateQuotationTotal()}\n\nThank you for your business!`;
    
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    toast.success(`Opening WhatsApp for ${pdfCustomer.name}`);

};


  const filteredCustomers = customerSearch
    ? customerFuse.search(customerSearch).map((result) => result.item)
    : customers;
  const filteredProducts = (index) =>
    productSearch[index] ? productFuse.search(productSearch[index]).map((result) => result.item) : products;

  return {
    isQuotationModalOpen,
    setIsQuotationModalOpen,
    isPdfModalOpen,
    setIsPdfModalOpen,
    customers: filteredCustomers,
    products,
    filteredProducts,
    shops,
    quotationForm,
    setQuotationForm,
    pdfUrl,
    pdfCustomer,
    customerSearch,
    setCustomerSearch,
    productSearch,
    setProductSearch,
    handleQuotationChange,
    addProductRow,
    removeProductRow,
    calculateQuotationTotal,
    handleSubmitQuotation,
    handleShareWhatsApp,
  };
};