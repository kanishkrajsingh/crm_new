import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter, 
  Download,
  User,
  Store,
  Calendar
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer, CustomerType } from '../types';
import { useApp } from '../context/AppContext';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { getCustomerTypeLabel } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<CustomerType | 'all'>('all');

  // Mock data - would come from API in real app
  const mockCustomers: Customer[] = [
    {
      customer_id: '1',
      name: 'Rajesh Kumar',
      phone_number: '9876543210',
      address: '123 Main Street, Mumbai',
      customer_type: 'shop',
      can_qty: 15,
      created_at: '2023-05-15T10:30:00Z'
    },
    {
      customer_id: '2',
      name: 'Ananya Singh',
      phone_number: '8765432109',
      address: '456 Park Avenue, Delhi',
      customer_type: 'monthly',
      advance_amount: 1000,
      can_qty: 5,
      created_at: '2023-06-20T09:15:00Z'
    },
    {
      customer_id: '3',
      name: 'Suresh Patel',
      phone_number: '7654321098',
      address: '789 Lake View, Ahmedabad',
      customer_type: 'order',
      created_at: '2023-07-10T14:45:00Z'
    },
    {
      customer_id: '4',
      name: 'Priya Sharma',
      phone_number: '6543210987',
      address: '101 Hill Road, Pune',
      customer_type: 'monthly',
      advance_amount: 1500,
      can_qty: 3,
      created_at: '2023-08-05T11:20:00Z'
    },
    {
      customer_id: '5',
      name: 'Vijay Mehta',
      phone_number: '5432109876',
      address: '202 Beach Road, Chennai',
      customer_type: 'shop',
      can_qty: 25,
      created_at: '2023-09-12T08:30:00Z'
    },
  ];

  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          customer.phone_number.includes(searchTerm);
    const matchesType = selectedType === 'all' || customer.customer_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const getCustomerTypeIcon = (type: CustomerType) => {
    switch (type) {
      case 'shop': return <Store className="h-4 w-4 text-blue-500" />;
      case 'monthly': return <Calendar className="h-4 w-4 text-green-500" />;
      case 'order': return <User className="h-4 w-4 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your customer database</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          className="mt-3 sm:mt-0"
          onClick={() => navigate('/customers/new')}
        >
          Add Customer
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
              placeholder="Search by name or phone..."
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
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as CustomerType | 'all')}
              >
                <option value="all">All Types</option>
                <option value="shop">Shop</option>
                <option value="monthly">Monthly</option>
                <option value="order">Order</option>
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
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cans
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getCustomerTypeIcon(customer.customer_type)}
                      <span className="ml-1 text-sm text-gray-700">
                        {getCustomerTypeLabel(customer.customer_type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {customer.phone_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    {customer.address}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {customer.can_qty || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => navigate(`/customers/edit/${customer.customer_id}`)}
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
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No customers found matching your criteria.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Customers;