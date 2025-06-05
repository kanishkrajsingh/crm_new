import React, { useState, useEffect,} from 'react';
import { Save } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CustomerType } from '../types';
import toast from 'react-hot-toast';

interface PriceSettings {
  shop: number;
  monthly: number;
  order: number;
}

const Settings: React.FC = () => {
  const [prices, setPrices] = useState<PriceSettings>({
    shop: 30,
    monthly: 25,
    order: 35
  });
  
  const [deliveryCharges, setDeliveryCharges] = useState<Record<string, number>>({
    'under_5km': 50,
    '5_10km': 75,
    'above_10km': 100
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/settings/prices');
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setPrices({
            shop: data[0].shop_price,
            monthly: data[0].monthly_price,
            order: data[0].order_price
          });
        }
      } else {
        toast.error('Failed to fetch prices');
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Error loading prices');
    }
  };

  const handlePriceChange = (type: CustomerType, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setPrices(prev => ({
      ...prev,
      [type]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleDeliveryChargeChange = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setDeliveryCharges(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/settings/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prices),
      });

      if (response.ok) {
        toast.success('Prices updated successfully');
      } else {
        throw new Error('Failed to update prices');
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      toast.error('Failed to update prices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure system-wide settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Can Pricing">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="w-1/2 text-sm font-medium text-gray-700">Shop Customers</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices.shop.toString()}
                    onChange={(e) => handlePriceChange('shop', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <label className="w-1/2 text-sm font-medium text-gray-700">Monthly Customers</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices.monthly.toString()}
                    onChange={(e) => handlePriceChange('monthly', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <label className="w-1/2 text-sm font-medium text-gray-700">Order Customers</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices.order.toString()}
                    onChange={(e) => handlePriceChange('order', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                variant="primary"
                icon={<Save size={16} />}
                loading={loading}
              >
                Save Pricing
              </Button>
            </div>
          </form>
        </Card>
        
        <Card title="Delivery Charges">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="w-1/2 text-sm font-medium text-gray-700">Under 5 km</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryCharges.under_5km.toString()}
                    onChange={(e) => handleDeliveryChargeChange('under_5km', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <label className="w-1/2 text-sm font-medium text-gray-700">5 - 10 km</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryCharges['5_10km'].toString()}
                    onChange={(e) => handleDeliveryChargeChange('5_10km', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <label className="w-1/2 text-sm font-medium text-gray-700">Above 10 km</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryCharges.above_10km.toString()}
                    onChange={(e) => handleDeliveryChargeChange('above_10km', e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                variant="primary"
                icon={<Save size={16} />}
              >
                Save Charges
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;