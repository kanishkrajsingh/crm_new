import React, { useState } from 'react';
import { CreditCard, Search, Filter, Download, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer } from '../types';

const Billing: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  

  // Mock data reflecting the structure of the physical card
  const mockBills = [
    {
      bill_id: 'apr-2025-1',
      customer: {
        customer_id: 'cust-1',
        name: 'Customer Name 1',
        phone_number: 'XXXXXXXXXX',
        customer_type: 'monthly',
      } as Customer,
      bill_month: '2025-04',
      can_qty: 15, // Example total
      bill_amount: 450, // Example total amount
      paid_status: false,
      sent_status: true,
      deliveries: [
        { date: 1, qty: 1, signature: '...' },
        { date: 3, qty: 1, signature: '...' },
        { date: 5, qty: 1, signature: '...' },
        { date: 7, qty: 1, signature: '...' },
        { date: 9, qty: 1, signature: '...' },
        { date: 11, qty: 1, signature: '...' },
        { date: 13, qty: 1, signature: '...' },
        { date: 15, qty: 1, signature: '...' },
        { date: 17, qty: 1, signature: '...' },
        { date: 19, qty: 1, signature: '...' },
        { date: 21, qty: 1, signature: '...' },
        { date: 23, qty: 1, signature: '...' },
        { date: 25, qty: 1, signature: '...' },
        { date: 27, qty: 1, signature: '...' },
        { date: 29, qty: 1, signature: '...' },
      ],
    },
    {
      bill_id: 'apr-2025-2',
      customer: {
        customer_id: 'cust-2',
        name: 'Another Customer',
        phone_number: 'YYYYYYYYYY',
        customer_type: 'shop',
      } as Customer,
      bill_month: '2025-04',
      can_qty: 20,
      bill_amount: 600,
      paid_status: true,
      sent_status: true,
      deliveries: [
        { date: 2, qty: 1, signature: '...' },
        { date: 4, qty: 1, signature: '...' },
        { date: 6, qty: 1, signature: '...' },
        { date: 8, qty: 1, signature: '...' },
        { date: 10, qty: 1, signature: '...' },
        { date: 12, qty: 1, signature: '...' },
        { date: 14, qty: 1, signature: '...' },
        { date: 16, qty: 1, signature: '...' },
        { date: 18, qty: 1, signature: '...' },
        { date: 20, qty: 1, signature: '...' },
        { date: 22, qty: 1, signature: '...' },
        { date: 24, qty: 1, signature: '...' },
        { date: 26, qty: 1, signature: '...' },
        { date: 28, qty: 1, signature: '...' },
        { date: 30, qty: 1, signature: '...' },
        { date: 30, qty: 1, signature: '...' }, // Example of multiple on one day
      ],
    },
    // Add more mock bill data for different months and customers
  ];

  const filteredBills = mockBills.filter((bill) => bill.bill_month === selectedMonth);

  const openLedger = (bill: typeof mockBills[0]) => {
    const ledgerWindow = window.open('', '_blank');
    if (!ledgerWindow) return;

    const [year, month] = bill.bill_month.split('-');
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' });

    const calendarHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Ledger - ${bill.customer.name} (${monthName} ${year})</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 p-8">
        <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
          <h1 class="text-xl font-bold text-gray-900 mb-4">Customer Ledger</h1>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-500">Customer Name</p>
              <p class="font-medium">${bill.customer.name}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Phone Number</p>
              <p class="font-medium">${bill.customer.phone_number}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Month</p>
              <p class="font-medium">${monthName} ${year}</p>
            </div>
          </div>

          <h2 class="text-lg font-semibold mb-2">Delivery Record</h2>
          <table class="w-full border-collapse border border-gray-200">
            <thead>
              <tr class="bg-gray-100">
                <th class="border border-gray-200 px-4 py-2 text-left">Date</th>
                <th class="border border-gray-200 px-4 py-2 text-center">Qty</th>
                <th class="border border-gray-200 px-4 py-2 text-left">Signature</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: 31 }, (_, i) => i + 1)
                .map((day) => {
                  const deliveriesOnDay = bill.deliveries.filter(d => d.date === day);
                  const totalQtyOnDay = deliveriesOnDay.reduce((sum, d) => sum + d.qty, 0);
                  const signature = deliveriesOnDay.length > 0 ? deliveriesOnDay[0].signature : ''; // Just take the first signature if multiple

                  return `
                    <tr class="${deliveriesOnDay.length > 0 ? 'bg-green-50' : ''}">
                      <td class="border border-gray-200 px-4 py-2">${day}</td>
                      <td class="border border-gray-200 px-4 py-2 text-center">${totalQtyOnDay > 0 ? totalQtyOnDay : ''}</td>
                      <td class="border border-gray-200 px-4 py-2">${signature}</td>
                    </tr>
                  `;
                })
                .join('')}
              <tr class="font-semibold">
                <td class="border border-gray-200 px-4 py-2">Total</td>
                <td class="border border-gray-200 px-4 py-2 text-center">${bill.can_qty}</td>
                <td class="border border-gray-200 px-4 py-2"></td>
              </tr>
            </tbody>
          </table>

          <div class="mt-4 text-sm text-gray-600">
            <h3 class="font-semibold">Notes:</h3>
            <ul>
              <li>प्रतिमाह 12 केन लेना अनिवार्य है। (Taking 12 cans per month is mandatory.)</li>
              <li>बगैर कार्ड के पेमेंट मान्य नहीं होगा। (Payment will not be valid without the card.)</li>
              <li>केन 1 दिन से अधिक रखने पर प्रतिदिन 10 रुपये चार्ज लगेगा। (A charge of ₹10 per day will be levied for keeping a can for more than 1 day.)</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `;

    ledgerWindow.document.write(calendarHTML);
  };

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
                  Month
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cans
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
                <tr key={bill.bill_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{bill.customer.name}</div>
                      <div className="text-sm text-gray-500">{bill.customer.phone_number}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {bill.bill_month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {bill.can_qty}
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