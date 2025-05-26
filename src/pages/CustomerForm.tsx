import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Customer, CustomerType } from '../types';

const CustomerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  // Mock data for editing - would come from API in real app
  const mockCustomers: Record<string, Customer> = {
    '1': {
      customer_id: '1',
      name: 'Rajesh Kumar',
      phone_number: '9876543210',
      alternate_number: '9876543211',
      address: '123 Main Street, Mumbai',
      customer_type: 'shop',
      can_qty: 15,
      created_at: '2023-05-15T10:30:00Z'
    },
    '2': {
      customer_id: '2',
      name: 'Ananya Singh',
      phone_number: '8765432109',
      alternate_number: '',
      address: '456 Park Avenue, Delhi',
      customer_type: 'monthly',
      advance_amount: 1000,
      can_qty: 5,
      created_at: '2023-06-20T09:15:00Z'
    }
  };

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone_number: '',
    alternate_number: '',
    address: '',
    customer_type: 'shop',
    advance_amount: 0,
    can_qty: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && id && mockCustomers[id]) {
      setFormData(mockCustomers[id]);
    }
  }, [isEditing, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Convert numeric values
    if (type === 'number') {
      setFormData({ ...formData, [name]: value ? parseFloat(value) : undefined });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error for this field if any
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.phone_number) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Phone number must be 10 digits';
    }
    
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.customer_type) newErrors.customer_type = 'Customer type is required';
    
    // Type-specific validations
    if (formData.customer_type === 'monthly' || formData.customer_type === 'shop') {
      if (formData.can_qty === undefined || formData.can_qty < 0) {
        newErrors.can_qty = 'Initial can quantity is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      // Here you would send the data to your API
      console.log('Submitting customer data:', formData);
      
      // Redirect back to customers list
      navigate('/customers');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="secondary" 
          icon={<ArrowLeft size={16} />} 
          className="mr-4"
          onClick={() => navigate('/customers')}
        >
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing 
              ? 'Update customer information' 
              : 'Create a new customer record'
            }
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Customer Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            
            <Select
              label="Customer Type"
              id="customer_type"
              name="customer_type"
              value={formData.customer_type}
              onChange={handleChange}
              options={[
                { value: 'shop', label: 'Shop' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'order', label: 'Order' }
              ]}
              error={errors.customer_type}
              required
            />
            
            <Input
              label="Phone Number"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              error={errors.phone_number}
              helper="10-digit mobile number"
              required
            />
            
            <Input
              label="Alternate Number (Optional)"
              id="alternate_number"
              name="alternate_number"
              value={formData.alternate_number}
              onChange={handleChange}
              helper="Secondary contact number"
            />
            
            <div className="md:col-span-2">
              <Input
                label="Address"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                required
              />
            </div>
            
            {(formData.customer_type === 'monthly' || formData.customer_type === 'shop') && (
              <>
                <Input
                  label="Initial Can Quantity"
                  id="can_qty"
                  name="can_qty"
                  type="number"
                  min="0"
                  value={formData.can_qty?.toString() || ''}
                  onChange={handleChange}
                  error={errors.can_qty}
                  required
                />
                
                {formData.customer_type === 'monthly' && (
                  <Input
                    label="Advance Amount (₹)"
                    id="advance_amount"
                    name="advance_amount"
                    type="number"
                    min="0"
                    value={formData.advance_amount?.toString() || ''}
                    onChange={handleChange}
                    error={errors.advance_amount}
                  />
                )}
              </>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="secondary" 
              className="mr-3"
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              icon={<Save size={16} />}
            >
              {isEditing ? 'Update Customer' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CustomerForm;