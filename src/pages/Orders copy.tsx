import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Download,
  Package, // Example icon for orders
  Calendar,
  User
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useApp } from '../context/AppContext'; // Assuming you have context
import toast from 'react-hot-toast';

interface Order {
  id: number;
  order_date: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  can_qty: number;
  delivery_amount?: number;
  delivery_date: string;
  delivery_time: string;
  order_status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  notes?: string;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'processing' | 'delivered' | 'cancelled'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/orders'); // Your orders API endpoint
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.error || 'Failed to fetch orders');
        }
        const data: Order[] = await response.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer_phone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || order.order_status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusIcon = (status: Order['order_status']) => {
    switch (status) {
      case 'pending': return <Calendar className="h-4 w-4 text-yellow-500" />;
      case 'processing': return <Package className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'delivered': return <User className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <Trash2 className="h-4 w-4 text-red-500" />;
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div>Error loading orders: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your order records</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          className="mt-3 sm:mt-0"
          onClick={() => navigate('/orders/new')}
        >
          Add Order
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-md"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'pending' | 'processing' | 'delivered' | 'cancelled')}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <Button
            variant="secondary"
            icon={<Download size={16} />}
            className="sm:w-auto"
          >
            Export
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cans
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-700">{order.customer_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.customer_phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.can_qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(order.delivery_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.delivery_time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getOrderStatusIcon(order.order_status)}
                      <span className="ml-1 text-sm text-gray-700">{order.order_status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => navigate(`/orders/edit/${order.id}`)}
                      >
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No orders found matching your criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Orders;