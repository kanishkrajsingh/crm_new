import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Filter, Download, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer } from '../types';
import toast from 'react-hot-toast';

const Billing: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonthlyBills(selectedMonth);
  }, [selectedMonth]);

  const fetchMonthlyBills = async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/daily-updates/monthly-bills?month=${month}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bills');
      }
      const data = await response.json();
      setBills(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const openLedger = async (bill: any) => {
    try {
      // Fetch current prices
      const pricesResponse = await fetch('/api/settings/prices');
      if (!pricesResponse.ok) {
        throw new Error('Failed to fetch prices');
      }
      const prices = await pricesResponse.json();
      const currentPrice = prices[0];

      const response = await fetch(`/api/daily-updates/ledger?customer_id=${bill.customer_id}&month=${selectedMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ledger data');
      }
      const ledgerData = await response.json();
      
      const ledgerWindow = window.open('', '_blank');
      if (!ledgerWindow) return;

      const [year, month] = selectedMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });

      // Get price based on customer type
      const pricePerCan = bill.customer_type === 'shop' ? currentPrice.shop_price :
                         bill.customer_type === 'monthly' ? currentPrice.monthly_price :
                         currentPrice.order_price;

      const calendarHTML = `
      <!DOCTYPE html>
<html>
<head>
  <title>Customer Ledger - ${bill.name} (${monthName} ${year})</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white p-4">
  <div class="max-w-xl mx-auto border border-black p-4">
    <!-- Header -->
    <div class="flex justify-between items-center border-b border-black pb-2 mb-2">
      <div class="text-left text-xs">
        <div class="font-bold text-blue-900 text-lg">कंचन मिनरल वाटर</div>
        <div>5, लेबर कॉलोनी, नई आबादी, मंदसौर</div>
        <div>Ph.: 07422-408555 Mob.: 9425033995</div>
      </div>
      <div class="text-center text-xs">
        <div class="font-bold text-blue-900 text-lg">कंचन चिल्ड वाटर</div>
        <div>साई मंदिर के पास, अभिनन्दन नगर, मंदसौर</div>
        <div>Mob.: 9685753343, 9516784779</div>
      </div>
    </div>

    <!-- Customer Info -->
    <div class="grid grid-cols-2 text-sm border-b border-black pb-1 mb-2">
      <div>मो.: ${bill.phone_number}</div>
      <div class="text-right">दिनांक: ${monthName} ${year}</div>
      <div class="col-span-2">श्रीमान: ${bill.name}</div>
    </div>

    <!-- Delivery Record Table -->
    <table class="w-full text-xs border border-black border-collapse">
      <thead>
        <tr>
          <th class="border border-black p-1">क्र.</th>
          <th class="border border-black p-1">संख्या</th>
          <th class="border border-black p-1">केन वापसी</th>
          <th class="border border-black p-1">हस्ताक्षर</th>
          <th class="border border-black p-1">क्र.</th>
          <th class="border border-black p-1">संख्या</th>
          <th class="border border-black p-1">केन वापसी</th>
          <th class="border border-black p-1">हस्ताक्षर</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: 16 }, (_, i) => {
          const left = ledgerData[i];
          const right = ledgerData[i + 16];
          return `
          <tr>
            <td class="border border-black p-1 text-center">${i + 1}</td>
            <td class="border border-black p-1 text-center">${left ? left.delivered_qty : ''}</td>
            <td class="border border-black p-1"></td>
            <td class="border border-black p-1"></td>
            <td class="border border-black p-1 text-center">${i + 17}</td>
            <td class="border border-black p-1 text-center">${right ? right.delivered_qty : ''}</td>
            <td class="border border-black p-1"></td>
            <td class="border border-black p-1"></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <!-- Total and Notes -->
    <div class="flex justify-between items-center border-t border-black mt-2 pt-1 text-sm">
      <div class="text-xs">
        <div>नोट: प्रति माह 12 केन लेना अनिवार्य है।</div>
        <div>* अगर कार्ड के पोस्ट मान्य नहीं होगा।</div>
        <div>* केन 1 दिन से अधिक रखने पर प्रति दिन 10 रुपये चार्ज लगेगा।</div>
      </div>
      <div class="text-right font-bold border border-black px-2 py-1 text-xs">
        <div>कुल केन: ${ledgerData.reduce((sum: number, d: { delivered_qty: any; }) => sum + Number(d.delivered_qty), 0)}</div>
        <div>कुल राशि: ₹${ledgerData.reduce((sum: number, d: { delivered_qty: any; }) => sum + Number(d.delivered_qty), 0) * pricePerCan}</div>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      ledgerWindow.document.write(calendarHTML);
    } catch (err) {
      toast.error('Failed to fetch ledger data');
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.phone_number.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'paid' && bill.paid_status) ||
                         (filterStatus === 'unpaid' && !bill.paid_status);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div>Loading billing data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customer bills and track deliveries</p>
        </div>
        <Button
          variant="primary"
          icon={<CreditCard size={16} />}
          className="mt-3 sm:mt-0"
        >
          Generate Bills
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
              placeholder="Search bills..."
              className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="month"
                className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-md"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 pr-3 py-2 w-full border-gray-300 rounded-md"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'paid' | 'unpaid')}
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cans
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Days
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
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
              {filteredBills.map((bill) => (
                <tr key={bill.customer_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{bill.name}</div>
                      <div className="text-sm text-gray-500">{bill.phone_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {bill.customer_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {bill.total_cans_delivered}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {bill.total_delivery_days}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ₹{bill.bill_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bill.paid_status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {bill.paid_status ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openLedger(bill)}
                    >
                      View Ledger
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBills.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No bills found for the selected month.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Billing;