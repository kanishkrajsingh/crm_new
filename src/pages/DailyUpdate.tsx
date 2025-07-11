import React, { useState, useEffect } from 'react';
import { Save, Filter, Calendar, RefreshCw, Search, Store, User, Package } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer, CustomerType, DailyUpdate as DailyUpdateType } from '../types';
import { useApp } from '../context/AppContext';
import { toast } from 'react-hot-toast';

interface DailyUpdateState {
  delivered: number | string;
  collected: number | string;
  holding_status: number; // Ensure it's always a number, initialize appropriately
  notes: string;
}

const DailyUpdate: React.FC = () => {
  const { getCustomerTypeLabel } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updates, setUpdates] = useState<Record<string, DailyUpdateState>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingCustomerId, setSavingCustomerId] = useState<string | null>(null);
  const [nextDayCollections, setNextDayCollections] = useState<Array<{ customer_id: string; name: string; holding_status: number }>>([]);

  // Calculate the maximum allowed date (today)
  const maxDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [customersResponse, initialUpdatesResponse] = await Promise.all([
          fetch('/api/customers'),
          fetch(`/api/daily-updates?date=${selectedDate}`),
        ]);

        if (!customersResponse.ok) {
          const errorData = await customersResponse.json();
          throw new Error(errorData?.error || 'Failed to fetch customers');
        }
        const customersData: Customer[] = await customersResponse.json();
        setCustomers(customersData);

        if (!initialUpdatesResponse.ok) {
          console.warn('Failed to fetch initial daily updates:', await initialUpdatesResponse.text());
          setUpdates(customersData.reduce((acc, customer) => ({
            ...acc,
            [customer.customer_id]: {
              delivered: customer.can_qty || 0,
              collected: 0,
              holding_status: customer.can_qty || 0, // Initial holding status
              notes: '',
            },
          }), {}));
        } else {
          const initialUpdatesData: DailyUpdateType[] = await initialUpdatesResponse.json();
          const updatesMap: Record<string, DailyUpdateState> = customersData.reduce((acc, customer) => ({
            ...acc,
            [customer.customer_id]: {
              delivered: customer.can_qty || 0,
              collected: 0,
              holding_status: customer.can_qty || 0, // Default if no update
              notes: '',
            },
          }), {});

          initialUpdatesData.forEach(update => {
            if (updatesMap[update.customer_id]) {
              updatesMap[update.customer_id] = {
                delivered: update.delivered_qty,
                collected: update.collected_qty,
                holding_status: update.holding_status, // Get from API
                notes: update.notes || '',
              };
            }
          });
          setUpdates(updatesMap);
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
    fetchNextDayCollections(selectedDate); // Fetch next day's collection on date change
  }, [selectedDate]);

  const getCustomerTypeIcon = (type: CustomerType) => {
    switch (type) {
        case 'monthly': return <Calendar className="h-4 w-4 text-green-500" />;
        case 'shop': return <Store className="h-4 w-4 text-blue-500" />;
        case 'order': return <User className="h-4 w-4 text-orange-500" />;
    }
  };

  const fetchNextDayCollections = async (date: string) => {
    try {
      const response = await fetch(`/api/daily-updates/next-collection?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        // Filter to show only customers with holding_status > 0 (those who have cans to return)
        const customersWithPendingCans = data.filter((collection: any) => collection.holding_status > 0);
        setNextDayCollections(customersWithPendingCans);
      } else {
        console.warn('Failed to fetch next day collections:', await response.text());
        setNextDayCollections([]);
      }
    } catch (error) {
      console.error('Error fetching next day collections:', error);
      setNextDayCollections([]);
    }
  };

  const handleUpdateChange = (customerId: string, field: 'delivered' | 'collected' | 'notes', value: string) => {
    setUpdates(prev => {
      const existing = prev[customerId] || { delivered: '', collected: '', holding_status: 0, notes: '' };
      const updated = { ...existing, [field]: value };

      const d = parseInt(updated.delivered as string) || 0;
      const c = parseInt(updated.collected as string) || 0;
      const customer = customers.find(cust => cust.customer_id === customerId);
      const previousHolding = customer?.can_qty || 0;

      // This is your original logic - holding status calculation
      updated.holding_status = previousHolding + d - c;

      return {
        ...prev,
        [customerId]: updated,
      };
    });
  };

  const handleSaveSingleUpdate = async (customerId: string) => {
    setSavingCustomerId(customerId);
    const updateData = {
      customer_id: customerId,
      date: selectedDate,
      delivered_qty: updates[customerId]?.delivered || 0,
      collected_qty: updates[customerId]?.collected || 0,
      holding_status: updates[customerId]?.holding_status || 0, // Send holding status
      notes: updates[customerId]?.notes || '',
    };

    try {
      const response = await fetch('/api/daily-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || `Failed to save update for customer ${customerId}`);
      }

      toast.success(`Update saved for ${customers.find(c => c.customer_id === customerId)?.name}!`);
      // Optionally refetch data to update the UI with the saved holding status
      fetch(`/api/daily-updates?date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          const updatedUpdatesMap: Record<string, DailyUpdateState> = {};
          data.forEach((update: any) => {
            updatedUpdatesMap[update.customer_id] = {
              delivered: update.delivered_qty,
              collected: update.collected_qty,
              holding_status: update.holding_status,
              notes: update.notes || '',
            };
          });
          setUpdates(updatedUpdatesMap);
        });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCustomerId(null);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesType = filterType === 'all' || customer.customer_type === filterType;
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-semibold">Error loading daily update data: {error}</div>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Can Management</h1>
        <p className="mt-2 text-sm text-gray-600">Track daily can deliveries and collections with real-time updates</p>
      </div>

      <Card className="shadow-lg border-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <input
              type="date"
              className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={maxDate}
            />
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="pl-10 pr-3 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="shop">Shop</option>
              <option value="monthly">Monthly</option>
              <option value="order">Order</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer Details
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <span className="mr-1">Delivered</span>
                    <RefreshCw className="h-3 w-3 text-blue-500" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <span className="mr-1">Collected</span>
                    <RefreshCw className="h-3 w-3 text-green-500" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Holding
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Notes
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Save</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">ID: {customer.customer_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getCustomerTypeIcon(customer.customer_type)}
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {getCustomerTypeLabel(customer.customer_type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="font-medium">{customer.phone_number}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-20 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-2 py-1"
                      value={updates[customer.customer_id]?.delivered ?? ''}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'delivered', e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-20 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-green-500 focus:border-green-500 px-2 py-1"
                      value={updates[customer.customer_id]?.collected ?? ''}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'collected', e.target.value)}
                      placeholder="0"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                      {updates[customer.customer_id]?.holding_status !== undefined ? updates[customer.customer_id]?.holding_status : customer.can_qty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={updates[customer.customer_id]?.notes || ''}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'notes', e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Save size={14} />}
                      onClick={() => handleSaveSingleUpdate(customer.customer_id)}
                      loading={savingCustomerId === customer.customer_id}
                      disabled={savingCustomerId === customer.customer_id}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      {savingCustomerId === customer.customer_id ? 'Saving...' : 'Save'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && !loading && (
          <div className="text-center py-12">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No customers available for the selected date.'}
            </p>
          </div>
        )}
      </Card>

      {nextDayCollections.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-red-50">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="mr-2 h-6 w-6 text-orange-600" />
              Cans to Collect Tomorrow ({new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1)).toLocaleDateString()})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nextDayCollections.map(collection => (
                <div key={collection.customer_id} className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
                  <div className="font-semibold text-gray-900">{collection.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-bold text-orange-600">{collection.holding_status}</span> cans to collect
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Note:</strong> These customers have pending cans from previous days that need to be collected.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DailyUpdate;