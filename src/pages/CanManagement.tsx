import React, { useState } from 'react';
import { Package, Search, Filter, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer } from '../types';
import { useApp } from '../context/AppContext';

const CanManagement: React.FC = () => {
  const { getCustomerTypeLabel } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'overdue'>('all');

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
    }
  ];

  const canStatuses = {
    '1': { issued: 45, returned: 30, pending: 15 },
    '2': { issued: 20, returned: 15, pending: 5 }
  };

  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         customer.phone_number.includes(searchTerm);
    const status = canStatuses[customer.customer_id as keyof typeof canStatuses];
    
    if (filterType === 'pending' && (!status || status.pending === 0)) {
      return false;
    }
    if (filterType === 'overdue' && (!status || status.pending < 10)) {
      return false;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Can Management</h1>
        <p className="mt-1 text-sm text-gray-500">Track and manage your water can inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Total Cans</h3>
              <p className="text-2xl font-semibold text-blue-600">250</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">In Circulation</h3>
              <p className="text-2xl font-semibold text-green-600">180</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full">
              <Package className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Pending Return</h3>
              <p className="text-2xl font-semibold text-red-600">70</p>
            </div>
          </div>
        </Card>
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'pending' | 'overdue')}
              >
                <option value="all">All Customers</option>
                <option value="pending">With Pending Cans</option>
                <option value="overdue">Overdue (10+ Cans)</option>
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
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Issued
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Returned
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const status = canStatuses[customer.customer_id as keyof typeof canStatuses];
                return (
                  <tr key={customer.customer_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {getCustomerTypeLabel(customer.customer_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-blue-600 font-medium">{status.issued}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-green-600 font-medium">{status.returned}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${
                        status.pending >= 10 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {status.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      2 days ago
                    </td>
                  </tr>
                );
              })}
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

export default CanManagement;