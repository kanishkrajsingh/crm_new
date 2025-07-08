import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, FileText } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import Select from '../components/ui/Select';

interface OrderFormProps {}

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
    collected_qty: 0, // New field for collected cans
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_time: '10:00',
    order_status: 'pending',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  useEffect(() => {
    if (isEditing && id) {
      fetchOrder(id);
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
    const { name, value, type } = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

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
    if (formData.collected_qty < 0) newErrors.collected_qty = 'Collected Quantity cannot be negative';
    if (formData.collected_qty > formData.can_qty) newErrors.collected_qty = 'Collected Quantity cannot exceed delivered quantity';
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

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
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
      // Get current prices for calculation
      const pricesResponse = await fetch('/api/settings/prices');
      if (!pricesResponse.ok) {
        throw new Error('Failed to fetch prices');
      }
      const prices = await pricesResponse.json();
      const currentPrice = prices[0];

      if (!currentPrice) {
        throw new Error('Current pricing data not found');
      }

      // Calculate total amount (assuming order customers use order_price)
      const pricePerCan = currentPrice.order_price;
      const totalAmount = formData.can_qty * pricePerCan;

      // Generate receipt PDF
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
          <Button
            variant="info"
            icon={<FileText size={16} />}
            onClick={generateReceipt}
            disabled={generatingReceipt}
          >
            {generatingReceipt ? 'Generating...' : 'Generate Receipt'}
          </Button>
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
              helper={`Maximum: ${formData.can_qty} cans`}
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
    </div>
  );
};

export default OrderForm;