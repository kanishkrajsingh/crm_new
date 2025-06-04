import React, { useState, useEffect } from 'react';
import { Save, Filter, Calendar, RefreshCw, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer, DailyUpdate as DailyUpdateType } from '../types';
import { useApp } from '../context/AppContext';
import { toast } from 'react-hot-toast';

interface DailyUpdateState {
  holding_status: number;
  delivered: number;
  collected: number;
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
  const [unreturnedQuantitiesYesterday, setUnreturnedQuantitiesYesterday] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [customersResponse, initialUpdatesResponse, previousDayUpdatesResponse] = await Promise.all([
          fetch('/api/customers'),
          fetch(`/api/daily-updates?date=${selectedDate}`),
          fetch(`/api/daily-updates?date=${getPreviousDay(selectedDate)}`),
        ]);

        if (!customersResponse.ok) {
          const errorData = await customersResponse.json();
          throw new Error(errorData?.error || 'Failed to fetch customers');
        }
        const customersData: Customer[] = await customersResponse.json();
        setCustomers(customersData);

        const previousDayUpdatesData: DailyUpdateType[] = previousDayUpdatesResponse.ok ? await previousDayUpdatesResponse.json() : [];
        const unreturnedYesterday: Record<string, number> = {};
        previousDayUpdatesData.forEach(update => {
          const unreturned = update.delivered_qty - update.collected_qty;
          if (unreturned > 0) {
            unreturnedYesterday[update.customer_id] = unreturned;
          }
        });
        setUnreturnedQuantitiesYesterday(unreturnedYesterday);

        let initialUpdatesMap: Record<string, DailyUpdateState> = {};
        if (initialUpdatesResponse.ok) {
          const initialUpdatesData: DailyUpdateType[] = await initialUpdatesResponse.json();
          initialUpdatesMap = initialUpdatesData.reduce((acc, update) => ({
            ...acc,
            [update.customer_id]: {
              delivered: update.delivered_qty,
              collected: update.collected_qty,
              holding_status: update.holding_status,
              notes: update.notes,
            },
          }), {});
        }

        const initialUpdatesWithDefaults: Record<string, DailyUpdateState> = customersData.reduce((acc, customer) => {
          const existingUpdate = initialUpdatesMap[customer.customer_id];
          const initialDelivered = existingUpdate?.delivered !== undefined ? existingUpdate.delivered : customer.can_qty || 0;
          const initialCollected = existingUpdate?.collected !== undefined ? existingUpdate.collected : 0;
          const initialHolding = existingUpdate?.holding_status !== undefined ? existingUpdate.holding_status : initialDelivered + (unreturnedYesterday[customer.customer_id] || 0);
          const initialNotes = existingUpdate?.notes || '';

          return {
            ...acc,
            [customer.customer_id]: {
              delivered: initialDelivered,
              collected: initialCollected,
              holding_status: initialHolding,
              notes: initialNotes,
            },
          };
        }, {});
        setUpdates(initialUpdatesWithDefaults);

      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedDate]);

  const getPreviousDay = (dateString: string): string => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesType = filterType === 'all' || customer.customer_type === filterType;
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  const handleUpdateChange = (customerId: string, field: 'delivered' | 'collected' | 'notes', value: string) => {
    setUpdates(prev => {
      const customerUpdates = prev[customerId] || { delivered: 0, collected: 0, holding_status: 0, notes: '' };
      let newDelivered = customerUpdates.delivered;
      let newCollected = customerUpdates.collected;

      if (field === 'delivered') {
        newDelivered = value === '' ? 0 : parseInt(value, 10);
      } else if (field === 'collected') {
        newCollected = value === '' ? 0 : parseInt(value, 10);
      }

      const deliveredChange = newDelivered - customerUpdates.delivered;
      const collectedChange = newCollected - customerUpdates.collected;
      const newHoldingStatus = customerUpdates.holding_status + deliveredChange - collectedChange;

      return {
        ...prev,
        [customerId]: {
          delivered: newDelivered,
          collected: newCollected,
          holding_status: isNaN(newHoldingStatus) ? 0 : newHoldingStatus,
          notes: field === 'notes' ? value : customerUpdates.notes,
        },
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
      holding_status: updates[customerId]?.holding_status || 0,
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

      setUpdates((prevUpdates) => {
        const updatedUpdates = { ...prevUpdates };
        updatedUpdates[customerId] = {
          ...updatedUpdates[customerId],
          delivered: updateData.delivered_qty,
          collected: updateData.collected_qty,
          holding_status: updateData.holding_status,
          notes: updateData.notes,
        };
        return updatedUpdates;
      });

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCustomerId(null);
    }
  };

  const getInitialCollectedValue = (customerId: string, customerCanQty: number): number => {
    return 0;
  };

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
                      value={updates[customer.customer_id]?.delivered !== undefined ? updates[customer.customer_id]?.delivered : customer.can_qty}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'delivered', e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-16 border-gray-300 rounded-md text-center focus:ring-2 focus:ring-green-500 focus:border-green-500 ring-1 ring-gray-300"
                      value={updates[customer.customer_id]?.collected !== undefined ? updates[customer.customer_id]?.collected : getInitialCollectedValue(customer.customer_id, customer.can_qty)}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'collected', e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Optional"
                      className="w-full border-gray-300 rounded-md"
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
    </div>
  );
};

export default DailyUpdate;