import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import Select from '../components/ui/Select';

interface OrderFormProps {}

const OrderForm: React.FC<OrderFormProps> = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    order_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    delivery_amount: 0,
    can_qty: 0,
    delivery_date: new Date().toISOString().split('T')[0], // Default to today
    delivery_time: '10:00', // Default to 10:00 AM
    order_status: 'pending',
    notes: '',
  });

  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
        const response = await fetch('/api/orders', { // Adjust your API endpoint
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast.success('Order created successfully!');
          navigate('/orders'); // Adjust your navigation path
        } else {
          const errorData = await response.json();
          toast.error(errorData?.error || 'Failed to create order.');
        }
      } catch (error: any) {
        toast.error('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
  };

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
          <p className="mt-1 text-sm text-gray-500">Enter the order details</p>
        </div>
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
              label="Can Quantity"
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
              <Input
                label="Notes (Optional)"
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              className="mr-3"
              onClick={() => navigate('/orders')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" icon={<Save size={16} />}>
              Create Order
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default OrderForm;