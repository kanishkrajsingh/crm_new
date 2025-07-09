import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, FileText, Eye, X, Receipt, User, Package, Calendar, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import Select from '../components/ui/Select';
import ReactDOM from 'react-dom';

interface OrderFormProps {}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Receipt className="mr-2 h-5 w-5 text-blue-600" />
            {title}
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              icon={<FileText size={16} />}
              className="bg-white hover:bg-gray-50"
            >
              Print
            </Button>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="modal-content max-h-[80vh] overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

const OrderForm: React.FC<OrderFormProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    order_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    delivery_amount: 0,
    can_qty: 0,
    collected_qty: 0,
    collected_date: '',
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_time: '10:00',
    order_status: 'pending',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [currentPrices, setCurrentPrices] = useState<any>(null);

  useEffect(() => {
    fetchPrices();
    if (isEditing && id) {
      fetchOrder(id);
    }
    if (!isEditing) {
      setFormData(prev => ({
        ...prev,
        collected_qty: 0,
        collected_date: '',
      }));
    }
  }, [isEditing, id]);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/settings/prices');
      if (response.ok) {
        const prices = await response.json();
        setCurrentPrices(prices[0]);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const fetchOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          order_date: data.order_date.split('T')[0],
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_address: data.customer_address,
          delivery_amount: data.delivery_amount || 0,
          can_qty: data.can_qty,
          collected_qty: data.collected_qty || 0,
          collected_date: data.collected_date ? data.collected_date.split('T')[0] : '',
          delivery_date: data.delivery_date.split('T')[0],
          delivery_time: data.delivery_time,
          order_status: data.order_status,
          notes: data.notes || '',
        });
      } else {
        toast.error('Failed to fetch order details');
        navigate('/orders');
      }
    } catch (error) {
      toast.error('An unexpected error occurred while fetching order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.customer_name) newErrors.customer_name = 'Customer Name is required';
    if (!formData.customer_phone) newErrors.customer_phone = 'Customer Phone is required';
    if (!formData.customer_address) newErrors.customer_address = 'Delivery Address is required';
    if (!formData.order_date) newErrors.order_date = 'Order Date is required';
    if (formData.can_qty <= 0) newErrors.can_qty = 'Can Quantity must be greater than 0';

    if (isEditing) {
      if (formData.collected_qty < 0) newErrors.collected_qty = 'Collected Quantity cannot be negative';
      if (formData.collected_qty > formData.can_qty) newErrors.collected_qty = 'Collected Quantity cannot exceed delivered quantity';
      if (formData.collected_qty > 0 && !formData.collected_date) {
        newErrors.collected_date = 'Collection Date is required if cans are collected';
      }
    }

    if (!formData.delivery_date) newErrors.delivery_date = 'Delivery Date is required';
    if (!formData.delivery_time) newErrors.delivery_time = 'Delivery Time is required';
    if (!formData.order_status) newErrors.order_status = 'Order Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        const url = isEditing ? `/api/orders/${id}` : '/api/orders';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = {
          ...formData,
          notes: formData.notes === '' ? null : formData.notes,
          collected_date: formData.collected_date === '' ? null : formData.collected_date,
        };

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success(isEditing ? 'Order updated successfully!' : 'Order created successfully!');
          navigate('/orders');
        } else {
          const errorData = await response.json();
          toast.error(errorData?.error || `Failed to ${isEditing ? 'update' : 'create'} order.`);
        }
      } catch (error: any) {
        toast.error('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
  };

  const generateReceipt = async () => {
    if (!isEditing || !id) {
      toast.error('Please save the order first before generating receipt');
      return;
    }

    setGeneratingReceipt(true);
    try {
      if (!currentPrices) {
        throw new Error('Current pricing data not found');
      }

      const pricePerCan = currentPrices.order_price;
      const totalAmount = formData.can_qty * pricePerCan;

      const receiptData = {
        order: {
          id: id,
          ...formData,
          total_amount: totalAmount + formData.delivery_amount,
          price_per_can: pricePerCan,
        }
      };

      const response = await fetch('/generate-order-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `order-receipt-${formData.customer_name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Receipt generated successfully!');
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error(`Failed to generate receipt: ${error.message}`);
    } finally {
      setGeneratingReceipt(false);
    }
  };

  const viewReceipt = async () => {
    if (!isEditing || !id) {
      toast.error('Please save the order first before viewing receipt');
      return;
    }

    try {
      if (!currentPrices) {
        throw new Error('Current pricing data not found');
      }

      const pricePerCan = currentPrices.order_price;
      const subtotal = formData.can_qty * pricePerCan;
      const totalAmount = subtotal + formData.delivery_amount;
      const orderDate = new Date(formData.order_date).toLocaleDateString('en-IN');
      const deliveryDate = new Date(formData.delivery_date).toLocaleDateString('en-IN');

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order Receipt - ${formData.customer_name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              border-radius: 16px;
              overflow: hidden;
            }
            .header-gradient {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .status-badge {
              display: inline-flex;
              align-items: center;
              padding: 6px 16px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-processing { background-color: #dbeafe; color: #1e40af; }
            .status-delivered { background-color: #d1fae5; color: #065f46; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin: 24px 0;
            }
            .info-item {
              padding: 20px;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 12px;
              border-left: 4px solid #667eea;
              transition: all 0.3s ease;
            }
            .info-item:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.1);
            }
            .info-label {
              font-size: 12px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
            }
            .info-value {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 24px 0;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .items-table th {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 16px;
              text-align: left;
              font-weight: 600;
              font-size: 14px;
            }
            .items-table td {
              padding: 16px;
              border-bottom: 1px solid #e2e8f0;
              color: #334155;
              background: white;
            }
            .items-table tbody tr:hover {
              background: #f8fafc;
            }
            .total-section {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 24px;
              border-radius: 12px;
              margin: 24px 0;
              border: 1px solid #e2e8f0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              padding: 8px 0;
            }
            .total-row.final {
              border-top: 2px solid #667eea;
              padding-top: 16px;
              margin-top: 16px;
              font-size: 18px;
              font-weight: 700;
              color: #1e293b;
              background: white;
              padding: 16px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .collection-status {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 2px solid #0ea5e9;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
            }
            .notes-section {
              background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
              border: 2px solid #f59e0b;
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
            }
            .icon {
              width: 16px;
              height: 16px;
              margin-right: 8px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .receipt-container { box-shadow: none; }
            }
          </style>
        </head>
        <body class="bg-gray-50 p-6">
          <div class="receipt-container">
            <!-- Header -->
            <div class="header-gradient text-white p-8">
              <div class="text-center">
                <h1 class="text-3xl font-bold mb-2">कंचन मिनरल वाटर</h1>
                <p class="text-blue-100 mb-1">5, लेबर कॉलोनी, नई आबादी, मंदसौर</p>
                <p class="text-blue-100 text-sm mb-4">Ph.: 07422-408555 | Mob.: 9425033995</p>
                <div class="mt-6 pt-6 border-t border-blue-300">
                  <h2 class="text-xl font-semibold">ORDER RECEIPT</h2>
                  <p class="text-blue-100 text-sm mt-1">Receipt #ORD-${id}</p>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="p-8">
              <!-- Status and Date -->
              <div class="flex justify-between items-center mb-6">
                <span class="status-badge status-${formData.order_status}">${formData.order_status}</span>
                <span class="text-sm text-gray-500">Generated on ${new Date().toLocaleDateString('en-IN')}</span>
              </div>

              <!-- Customer Information -->
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                    </svg>
                    Customer Name
                  </div>
                  <div class="info-value">${formData.customer_name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                    </svg>
                    Phone Number
                  </div>
                  <div class="info-value">${formData.customer_phone}</div>
                </div>
              </div>

              <div class="info-item mb-6">
                <div class="info-label">
                  <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                  </svg>
                  Delivery Address
                </div>
                <div class="info-value">${formData.customer_address}</div>
              </div>

              <!-- Order Details -->
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                    </svg>
                    Order Date
                  </div>
                  <div class="info-value">${orderDate}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                    </svg>
                    Delivery Date
                  </div>
                  <div class="info-value">${deliveryDate}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                    </svg>
                    Delivery Time
                  </div>
                  <div class="info-value">${formData.delivery_time}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">
                    <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    Order Status
                  </div>
                  <div class="info-value" style="text-transform: capitalize;">${formData.order_status}</div>
                </div>
              </div>

              <!-- Items Table -->
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: center;">Rate (₹)</th>
                    <th style="text-align: right;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="font-semibold flex items-center">
                        <svg class="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        Water Cans (20L)
                      </div>
                      <div class="text-sm text-gray-500">Premium RO Purified Water</div>
                    </td>
                    <td style="text-align: center; font-weight: 600; color: #1e40af;">${formData.can_qty}</td>
                    <td style="text-align: center;">₹${pricePerCan}</td>
                    <td style="text-align: right; font-weight: 600;">₹${subtotal}</td>
                  </tr>
                  ${formData.delivery_amount && formData.delivery_amount > 0 ? `
                  <tr>
                    <td>
                      <div class="font-semibold flex items-center">
                        <svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"></path>
                        </svg>
                        Delivery Charges
                      </div>
                      <div class="text-sm text-gray-500">Home Delivery Service</div>
                    </td>
                    <td style="text-align: center; font-weight: 600; color: #1e40af;">1</td>
                    <td style="text-align: center;">₹${formData.delivery_amount}</td>
                    <td style="text-align: right; font-weight: 600;">₹${formData.delivery_amount}</td>
                  </tr>
                  ` : ''}
                </tbody>
              </table>

              <!-- Total Section -->
              <div class="total-section">
                <div class="total-row">
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 10a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4z"></path>
                    </svg>
                    Subtotal:
                  </span>
                  <span class="font-semibold">₹${subtotal}</span>
                </div>
                ${formData.delivery_amount && formData.delivery_amount > 0 ? `
                <div class="total-row">
                  <span class="flex items-center">
                    <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"></path>
                    </svg>
                    Delivery Charges:
                  </span>
                  <span class="font-semibold">₹${formData.delivery_amount}</span>
                </div>
                ` : ''}
                <div class="total-row final">
                  <span class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 10a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4z"></path>
                    </svg>
                    Total Amount:
                  </span>
                  <span>₹${totalAmount}</span>
                </div>
              </div>

              <!-- Collection Status -->
              ${formData.collected_qty !== undefined && formData.collected_qty > 0 ? `
              <div class="collection-status">
                <h3 class="font-semibold text-blue-800 mb-4 flex items-center text-lg">
                  <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                  Collection Status
                </h3>
                <div class="grid grid-cols-2 gap-6">
                  <div class="bg-white p-4 rounded-lg">
                    <div class="text-sm text-blue-600 font-medium mb-1">Cans Collected</div>
                    <div class="text-2xl font-bold text-blue-800">${formData.collected_qty} / ${formData.can_qty}</div>
                  </div>
                  <div class="bg-white p-4 rounded-lg">
                    <div class="text-sm text-blue-600 font-medium mb-1">Pending Collection</div>
                    <div class="text-2xl font-bold text-blue-800">${formData.can_qty - formData.collected_qty} cans</div>
                  </div>
                </div>
                ${formData.collected_date ? `
                <div class="mt-4 pt-4 border-t border-blue-200 bg-white p-4 rounded-lg">
                  <div class="text-sm text-blue-600 font-medium mb-1">Collection Date</div>
                  <div class="font-semibold text-blue-800 text-lg">${new Date(formData.collected_date).toLocaleDateString('en-IN')}</div>
                </div>
                ` : ''}
              </div>
              ` : ''}

              <!-- Notes -->
              ${formData.notes ? `
              <div class="notes-section">
                <h3 class="font-semibold text-amber-800 mb-3 flex items-center text-lg">
                  <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                  </svg>
                  Additional Notes
                </h3>
                <div class="bg-white p-4 rounded-lg">
                  <p class="text-amber-700 leading-relaxed">${formData.notes}</p>
                </div>
              </div>
              ` : ''}

              <!-- Footer -->
              <div class="text-center mt-8 pt-6 border-t border-gray-200">
                <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <p class="text-gray-700 mb-2 font-semibold">Thank you for choosing Kanchan Mineral Water!</p>
                  <p class="text-sm text-gray-600 mb-3">For any queries, please contact: 9425033995</p>
                  <div class="text-xs text-gray-500">
                    <p>This is a computer-generated receipt and does not require a signature.</p>
                    <p class="mt-1">Generated on ${new Date().toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      setModalContent(receiptHTML);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error('Error viewing receipt:', error);
      toast.error(`Failed to view receipt: ${error.message}`);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="secondary"
          icon={<ArrowLeft size={16} />}
          className="mr-4"
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Order' : 'Create New Order'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isEditing ? 'Update order details and manage collections' : 'Enter the order details for a new customer'}
          </p>
        </div>
        {isEditing && (
          <div className="flex space-x-3">
            <Button
              variant="info"
              icon={<Eye size={16} />}
              onClick={viewReceipt}
              disabled={isModalOpen}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
            >
              {isModalOpen ? 'Loading...' : 'Preview Receipt'}
            </Button>
            <Button
              variant="success"
              icon={<Receipt size={16} />}
              onClick={generateReceipt}
              disabled={generatingReceipt}
              className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
            >
              {generatingReceipt ? 'Generating...' : 'Download Receipt'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="mr-2 h-5 w-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Customer Name"
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    error={errors.customer_name}
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  <Input
                    label="Customer Phone"
                    id="customer_phone"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleChange}
                    error={errors.customer_phone}
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Delivery Address"
                      id="customer_address"
                      name="customer_address"
                      value={formData.customer_address}
                      onChange={handleChange}
                      error={errors.customer_address}
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Order Details Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="mr-2 h-5 w-5 text-green-600" />
                  Order Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Order Date"
                    id="order_date"
                    name="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={handleChange}
                    error={errors.order_date}
                    required
                    className="focus:ring-2 focus:ring-green-500"
                  />
                  <Input
                    label="Can Quantity (Delivered)"
                    id="can_qty"
                    name="can_qty"
                    type="number"
                    min="1"
                    value={formData.can_qty}
                    onChange={handleChange}
                    error={errors.can_qty}
                    required
                    className="focus:ring-2 focus:ring-green-500"
                  />
                  <Input
                    label="Delivery Charge (₹)"
                    id="delivery_amount"
                    name="delivery_amount"
                    type="number"
                    min="0"
                    value={formData.delivery_amount}
                    onChange={handleChange}
                    className="focus:ring-2 focus:ring-green-500"
                  />
                  <Select
                    label="Order Status"
                    id="order_status"
                    name="order_status"
                    value={formData.order_status}
                    onChange={handleChange}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'processing', label: 'Processing' },
                      { value: 'delivered', label: 'Delivered' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                    error={errors.order_status}
                    required
                    className="focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Delivery Schedule Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-purple-600" />
                  Delivery Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Delivery Date"
                    id="delivery_date"
                    name="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    error={errors.delivery_date}
                    required
                    className="focus:ring-2 focus:ring-purple-500"
                  />
                  <Input
                    label="Delivery Time"
                    id="delivery_time"
                    name="delivery_time"
                    type="time"
                    value={formData.delivery_time}
                    onChange={handleChange}
                    error={errors.delivery_time}
                    required
                    className="focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Collection Information Section (Only for editing) */}
              {isEditing && (
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-orange-600" />
                    Collection Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Collected Cans"
                      id="collected_qty"
                      name="collected_qty"
                      type="number"
                      min="0"
                      max={formData.can_qty}
                      value={formData.collected_qty}
                      onChange={handleChange}
                      error={errors.collected_qty}
                      helper={`Maximum: ${formData.can_qty} cans`}
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                    <Input
                      label="Collection Date"
                      id="collected_date"
                      name="collected_date"
                      type="date"
                      value={formData.collected_date}
                      onChange={handleChange}
                      error={errors.collected_date}
                      required={formData.collected_qty > 0}
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any special instructions or notes about this order..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/orders')}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save size={16} />}
                  disabled={loading}
                  className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? 'Saving...' : (isEditing ? 'Update Order' : 'Create Order')}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-0 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Receipt className="mr-2 h-5 w-5 text-blue-600" />
              Order Summary
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Water Cans (20L)</span>
                  <span className="font-semibold">{formData.can_qty || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Price per Can</span>
                  <span className="font-semibold">₹{currentPrices?.order_price || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{(formData.can_qty || 0) * (currentPrices?.order_price || 0)}</span>
                </div>
                {formData.delivery_amount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Delivery Charges</span>
                    <span className="font-semibold">₹{formData.delivery_amount}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="font-bold text-lg text-blue-600">
                      ₹{(formData.can_qty || 0) * (currentPrices?.order_price || 0) + (formData.delivery_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {isEditing && formData.collected_qty > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Collection Status</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Collected</span>
                    <span className="font-semibold text-green-600">{formData.collected_qty}/{formData.can_qty}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-semibold text-orange-600">{formData.can_qty - formData.collected_qty}</span>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Order Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold capitalize ${
                      formData.order_status === 'delivered' ? 'text-green-600' :
                      formData.order_status === 'processing' ? 'text-blue-600' :
                      formData.order_status === 'cancelled' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {formData.order_status}
                    </span>
                  </div>
                  {formData.delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-semibold">
                        {new Date(formData.delivery_date).toLocaleDateString()} at {formData.delivery_time}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Order Receipt Preview">
        <div dangerouslySetInnerHTML={{ __html: modalContent }} />
      </Modal>
    </div>
  );
};

export default OrderForm;