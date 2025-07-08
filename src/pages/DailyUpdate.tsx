import React, { useState, useEffect } from 'react';
import { Save, Filter, Calendar, RefreshCw, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer, DailyUpdate as DailyUpdateType } from '../types';
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
              delivered: customer.can_qty,
              collected: 0,
              holding_status: customer.can_qty, // Initial holding status
              notes: '',
            },
          }), {}));
        } else {
          const initialUpdatesData: DailyUpdateType[] = await initialUpdatesResponse.json();
          const updatesMap: Record<string, DailyUpdateState> = customersData.reduce((acc, customer) => ({
            ...acc,
            [customer.customer_id]: {
              delivered: customer.can_qty,
              collected: 0,
              holding_status: customer.can_qty, // Default if no update
              notes: '',
            },
          }), {});

          initialUpdatesData.forEach(update => {
            if (updatesMap[update.customer_id]) {
              updatesMap[update.customer_id] = {
                delivered: update.delivered_qty,
                collected: update.collected_qty,
                holding_status: update.holding_status, // Get from API
                notes: update.notes,
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

  const fetchNextDayCollections = async (date: string) => {
    try {
      const response = await fetch(`/api/daily-can-status/next-collection?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setNextDayCollections(data);
      } else {
        console.warn('Failed to fetch next day collections:', await response.text());
        setNextDayCollections([]);
      }
    } catch (error) {
      console.error('Error fetching next day collections:', error);
      toast.error('Failed to fetch next day collection information.');
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
              notes: update.notes,
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
    return <div>Loading daily update data...</div>;
  }

  if (error) {
    return <div>Error loading daily update data: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Can Update</h1>
        <p className="mt-1 text-sm text-gray-500">Track daily can deliveries and collections</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <input
              type="date"
              className="border-gray-300 rounded-md"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={maxDate} // Added max attribute here
            />
          </div>

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

          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              className="border-gray-300 rounded-md"
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
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <span className="mr-1">Delivered</span>
                    <RefreshCw className="h-3 w-3 text-blue-500" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <span className="mr-1">Collected</span>
                    <RefreshCw className="h-3 w-3 text-green-500" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Holding
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Save</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.customer_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">
                      {getCustomerTypeLabel(customer.customer_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {customer.phone_number}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-16 border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ring-1 ring-gray-300"
                      value={updates[customer.customer_id]?.delivered ?? ''}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'delivered', e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-16 border-gray-300 rounded-md text-center focus:ring-2 focus:ring-green-500 focus:border-green-500 ring-1 ring-gray-300"
                      value={updates[customer.customer_id]?.collected ?? ''}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'collected', e.target.value)}
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-gray-700">
                      {updates[customer.customer_id]?.holding_status !== undefined ? updates[customer.customer_id]?.holding_status : customer.can_qty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Optional"
                      className="w-full border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ring-1 ring-gray-300"
                      value={updates[customer.customer_id]?.notes || ''}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'notes', e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Save size={14} />}
                      onClick={() => handleSaveSingleUpdate(customer.customer_id)}
                      loading={savingCustomerId === customer.customer_id}
                      disabled={savingCustomerId === customer.customer_id}
                    >
                      Save
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && !loading && (
          <div className="text-center py-10">
            <p className="text-gray-500">No customers found matching the selected criteria.</p>
          </div>
        )}
      </Card>

      {nextDayCollections.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Cans to Collect on {new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1)).toLocaleDateString()}</h2>
          <ul>
            {nextDayCollections.map(collection => (
              <li key={collection.customer_id} className="py-2">
                {collection.name}: <span className="font-semibold">{collection.holding_status}</span> cans
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default DailyUpdate;