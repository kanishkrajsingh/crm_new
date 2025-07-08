import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, FileText, Eye, X } from 'lucide-react'; // Import Eye and X icons
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import Select from '../components/ui/Select';
import ReactDOM from 'react-dom'; // Import ReactDOM for portal

interface OrderFormProps {}

// Reusable Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 relative">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="modal-content max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body // Render the modal outside the main app div
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
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [modalContent, setModalContent] = useState(''); // State to hold the HTML content for the modal

  useEffect(() => {
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
      const pricesResponse = await fetch('/api/settings/prices');
      if (!pricesResponse.ok) {
        throw new Error('Failed to fetch prices');
      }
      const prices = await pricesResponse.json();
      const currentPrice = prices[0];

      if (!currentPrice) {
        throw new Error('Current pricing data not found');
      }

      const pricePerCan = currentPrice.order_price;
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

  // Function to handle viewing the receipt in a new window
  const viewReceipt = async () => {
    if (!isEditing || !id) {
      toast.error('Please save the order first before viewing receipt');
      return;
    }

    try {
      // Fetch prices as before to calculate total amount for the receipt
      const pricesResponse = await fetch('/api/settings/prices');
      if (!pricesResponse.ok) {
        throw new Error('Failed to fetch prices');
      }
      const prices = await pricesResponse.json();
      const currentPrice = prices[0];

      if (!currentPrice) {
        throw new Error('Current pricing data not found');
      }

      const pricePerCan = currentPrice.order_price;
      const totalAmount = formData.can_qty * pricePerCan;

      // Simulate bill data for the calendarHTML, using formData for customer info
      const bill = {
        name: formData.customer_name,
        phone_number: formData.customer_phone,
      };

      const today = new Date();
      const monthName = today.toLocaleString('en-US', { month: 'long' });
      const year = today.getFullYear();
      const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate(); // Get number of days in current month

      // For dailyDeliveries, you'd ideally fetch this based on the customer and month.
      // For this example, we'll use a dummy map.
      const dailyDeliveries = new Map<number, number>();
      // Adding some dummy data for dailyDeliveries
      dailyDeliveries.set(5, 2);
      dailyDeliveries.set(10, 3);
      dailyDeliveries.set(15, 1);
      dailyDeliveries.set(20, 2);

      let calculatedTotalCans = 0;
      dailyDeliveries.forEach(qty => {
        calculatedTotalCans += qty;
      });
      const totalCans = calculatedTotalCans; // Using calculated value for total cans

      // Construct the HTML content for the modal
      const calendarHTML = `
            <!DOCTYPE html>
            <html>
            <head>
            <title>View Reciept Ledger - ${bill.name} (${monthName} ${year})</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; padding: 0; }
              @media print {
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .max-w-xl { max-width: 25rem; /* Adjust as needed for print */ }
              }
            </style>
            </head>
            <body class="bg-white p-4">
            <div class="max-w-xl mx-auto border border-black p-4">
                <div class="flex justify-between items-center border-b border-black pb-2 mb-2">
                <div class="text-left text-xs">
                    <div class="font-bold text-blue-900 text-lg">कंचन मिनरल वाटर</div>
                    <div>5, लेबर कॉलोनी, नई आबादी, मंदसौर</div>
                    <div>Ph.: 07422-408555 Mob.: 9425033995</div>
                </div>
                <div class="text-center text-xs">
                    <div class="font-bold text-blue-900 text-lg">कंचन चिल्ड वाटर</div>
                    <div>साई मंदिर के पास, अभिनन्दन नगर, मंदसौर</div>
                    <div>Mob.: 9685753343, 9516784779</div>
                </div>
                </div>

                <div class="grid grid-cols-2 text-sm border-b border-black pb-1 mb-2">
                 <div >श्रीमान: ${bill.name}</div>
                <div class="text-right">दिनांक: ${monthName} ${year}</div>               
                <div>मो.: ${bill.phone_number}</div>
                </div>

                <table class="w-full text-xs border border-black border-collapse">
                <thead>
                    <tr>
                    <th class="border border-black p-1">दिनांक</th>
                    <th class="border border-black p-1">संख्या</th>
                    <th class="border border-black p-1">केन वापसी</th>
                    </tr>
                </thead>
               <tbody>
    <tr>
        <td style="border: 1px solid black; padding: 0.25rem; text-align: center;"></td>
        <td style="border: 1px solid black; padding: 0.25rem; text-align: center;"></td>
        <td style="border: 1px solid black; padding: 0.25rem;"></td>
    </tr>
</tbody>
                </table>

                <div class="flex justify-between items-center border-t border-black mt-2 pt-1 text-sm">
                <div class="text-xs">
                    <div>नोट: प्रति माह 12 केन लेना अनिवार्य है।</div>
                    <div>* अगर कार्ड के पोस्ट मान्य नहीं होगा।</div>
                    <div>* केन 1 दिन से अधिक रखने पर प्रति दिन 10 रुपये चार्ज लगेगा।</div>
                </div>
                <div class="text-right font-bold border border-black px-2 py-1 text-xs">
                    <div>कुल केन: ${totalCans}</div>
                    <div>कुल राशि: ₹${totalAmount + formData.delivery_amount}</div>
                </div>
                </div>
            </div>
            </body>
            </html>
            `;
      setModalContent(calendarHTML);
      setIsModalOpen(true); // Open the modal
    } catch (error: any) {
      console.error('Error viewing receipt:', error);
      toast.error(`Failed to view receipt: ${error.message}`);
    }
  };

  if (loading && isEditing) {
    return <div>Loading order details...</div>;
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
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Order' : 'Create New Order'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? 'Update order details' : 'Enter the order details'}
          </p>
        </div>
        {isEditing && (
          <div className="flex space-x-2">
            <Button
              variant="info"
              icon={<Eye size={16} />}
              onClick={viewReceipt}
              disabled={isModalOpen} // Disable button while modal is open
            >
              {isModalOpen ? 'Loading...' : 'View Receipt'}
            </Button>
            <Button
              variant="info"
              icon={<FileText size={16} />}
              onClick={generateReceipt}
              disabled={generatingReceipt}
            >
              {generatingReceipt ? 'Generating...' : 'Generate Receipt'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Customer Name"
              id="customer_name"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              error={errors.customer_name}
              required
            />
            <Input
              label="Customer Phone"
              id="customer_phone"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
              error={errors.customer_phone}
              required
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
              />
            </div>
            <Input
              label="Order Date"
              id="order_date"
              name="order_date"
              type="date"
              value={formData.order_date}
              onChange={handleChange}
              error={errors.order_date}
              required
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
            />
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
              helper={isEditing ? `Maximum: ${formData.can_qty} cans` : 'Can only be updated when editing an order'}
              disabled={!isEditing}
            />
            <Input
              label="Collected Date"
              id="collected_date"
              name="collected_date"
              type="date"
              value={formData.collected_date}
              onChange={handleChange}
              error={errors.collected_date}
              disabled={!isEditing}
              required={isEditing && formData.collected_qty > 0}
            />
            <Input
              label="Delivery Charge (₹)"
              id="delivery_amount"
              name="delivery_amount"
              type="number"
              min="0"
              value={formData.delivery_amount}
              onChange={handleChange}
            />
            <Input
              label="Delivery Date"
              id="delivery_date"
              name="delivery_date"
              type="date"
              value={formData.delivery_date}
              onChange={handleChange}
              error={errors.delivery_date}
              required
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
            />
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes about the order..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/orders')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={16} />}
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Order' : 'Create Order')}
            </Button>
          </div>
        </form>
      </Card>

      {/* The Modal Component */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Customer Ledger">
        <div dangerouslySetInnerHTML={{ __html: modalContent }} />
      </Modal>
    </div>
  );
};

export default OrderForm;